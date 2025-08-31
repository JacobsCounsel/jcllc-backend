// src/services/kitV4Automation.js - Complete Kit v4 Automation System
// Full automation using Kit v4 API with hybrid approach

import fetch from 'node-fetch';
import { config } from '../config/environment.js';
import { log } from '../utils/logger.js';

const KIT_API_BASE = 'https://api.kit.com/v4';

export class KitV4Automation {
  constructor() {
    this.apiKey = config.kit.apiKey;
    
    // Kit v4 requires header authentication
    this.headers = {
      'X-Kit-Api-Key': this.apiKey,
      'Content-Type': 'application/json'
    };
    
    // Track resources
    this.sequences = new Map();
    this.forms = new Map();
    this.tags = new Map();
    this.subscribers = new Map();
  }

  // Test Kit v4 connection
  async testConnection() {
    try {
      const response = await fetch(`${KIT_API_BASE}/account`, {
        headers: this.headers
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(`Kit v4 connection failed: ${data.error || 'Unknown error'}`);
      }
      
      log.info('✅ Kit v4 connection successful', { account: data.name });
      return { success: true, account: data };
    } catch (error) {
      log.error('❌ Kit v4 connection failed:', error.message);
      throw error;
    }
  }

  // Load existing sequences
  async loadSequences() {
    try {
      const response = await fetch(`${KIT_API_BASE}/sequences`, {
        headers: this.headers
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(`Failed to load sequences: ${data.error}`);
      }
      
      if (data.data) {
        data.data.forEach(sequence => {
          this.sequences.set(sequence.name, sequence);
        });
      }
      
      log.info(`📧 Loaded ${this.sequences.size} existing sequences`);
      return Array.from(this.sequences.values());
    } catch (error) {
      log.error('❌ Failed to load sequences:', error.message);
      throw error;
    }
  }

  // Load existing forms
  async loadForms() {
    try {
      const response = await fetch(`${KIT_API_BASE}/forms`, {
        headers: this.headers
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(`Failed to load forms: ${data.error}`);
      }
      
      if (data.data) {
        data.data.forEach(form => {
          this.forms.set(form.name, form);
        });
      }
      
      log.info(`📝 Loaded ${this.forms.size} existing forms`);
      return Array.from(this.forms.values());
    } catch (error) {
      log.error('❌ Failed to load forms:', error.message);
      throw error;
    }
  }

  // Load existing tags
  async loadTags() {
    try {
      const response = await fetch(`${KIT_API_BASE}/tags`, {
        headers: this.headers
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(`Failed to load tags: ${data.error}`);
      }
      
      if (data.data) {
        data.data.forEach(tag => {
          this.tags.set(tag.name, tag);
        });
      }
      
      log.info(`🏷️ Loaded ${this.tags.size} existing tags`);
      return Array.from(this.tags.values());
    } catch (error) {
      log.error('❌ Failed to load tags:', error.message);
      throw error;
    }
  }

  // Create or update subscriber
  async createSubscriber(email, firstName = '', lastName = '') {
    try {
      const response = await fetch(`${KIT_API_BASE}/subscribers`, {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify({
          email_address: email,
          first_name: firstName,
          last_name: lastName
        })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        // Check if subscriber already exists
        if (response.status === 409 || data.error?.includes('already exists')) {
          log.info(`Subscriber exists: ${email}`);
          return await this.getSubscriberByEmail(email);
        }
        throw new Error(`Subscriber creation failed: ${data.error || 'Unknown error'}`);
      }
      
      log.info(`✅ Subscriber created: ${email}`);
      return data.data;
    } catch (error) {
      log.error(`❌ Subscriber creation failed: ${email}`, error.message);
      throw error;
    }
  }

  // Get subscriber by email
  async getSubscriberByEmail(email) {
    try {
      const response = await fetch(`${KIT_API_BASE}/subscribers?email_address=${encodeURIComponent(email)}`, {
        headers: this.headers
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(`Subscriber lookup failed: ${data.error}`);
      }
      
      if (data.data && data.data.length > 0) {
        return data.data[0];
      }
      
      return null;
    } catch (error) {
      log.error(`❌ Subscriber lookup failed: ${email}`, error.message);
      throw error;
    }
  }

  // Add subscriber to sequence
  async addSubscriberToSequence(email, sequenceId, firstName = '', lastName = '') {
    try {
      // First ensure subscriber exists
      let subscriber = await this.getSubscriberByEmail(email);
      
      if (!subscriber) {
        subscriber = await this.createSubscriber(email, firstName, lastName);
      }
      
      // Add to sequence
      const response = await fetch(`${KIT_API_BASE}/sequences/${sequenceId}/subscribers`, {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify({
          email_address: email
        })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(`Adding to sequence failed: ${data.error || 'Unknown error'}`);
      }
      
      log.info(`✅ Added to sequence: ${email} → ${sequenceId}`);
      return data.data;
    } catch (error) {
      log.error(`❌ Adding to sequence failed: ${email}`, error.message);
      throw error;
    }
  }

  // Apply tag to subscriber
  async applyTag(email, tagId) {
    try {
      const response = await fetch(`${KIT_API_BASE}/tags/${tagId}/subscribers`, {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify({
          email_address: email
        })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(`Tag application failed: ${data.error || 'Unknown error'}`);
      }
      
      log.info(`✅ Tag applied: ${email} → ${tagId}`);
      return data.data;
    } catch (error) {
      log.error(`❌ Tag application failed: ${email}`, error.message);
      throw error;
    }
  }

  // Create broadcast campaign
  async createBroadcast(subject, content, tags = []) {
    try {
      const response = await fetch(`${KIT_API_BASE}/broadcasts`, {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify({
          subject: subject,
          content: content,
          description: `Automated broadcast from Jacobs Counsel system`,
          public: false, // Draft mode
          send_at: null, // Draft, not scheduled
          tag_ids: tags
        })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(`Broadcast creation failed: ${data.error || 'Unknown error'}`);
      }
      
      log.info(`✅ Broadcast created: ${subject}`);
      return data.data;
    } catch (error) {
      log.error(`❌ Broadcast creation failed: ${subject}`, error.message);
      throw error;
    }
  }

  // Main automation function - integrates with your backend
  async processLeadAutomation(formData, leadScore, submissionType) {
    try {
      log.info('🚀 Processing lead automation', { 
        email: formData.email, 
        score: leadScore.score,
        type: submissionType 
      });

      const firstName = formData.firstName || formData.fullName?.split(' ')[0] || '';
      const lastName = formData.lastName || formData.fullName?.split(' ')[1] || '';
      
      // Step 1: Create/get subscriber
      const subscriber = await this.createSubscriber(formData.email, firstName, lastName);
      
      // Step 2: Determine automation path based on lead score
      const automationPath = this.determineAutomationPath(leadScore.score, submissionType);
      
      // Step 3: Apply appropriate tags
      for (const tagName of automationPath.tags) {
        const tag = this.tags.get(tagName);
        if (tag) {
          await this.applyTag(formData.email, tag.id);
        } else {
          log.warn(`Tag not found: ${tagName}`);
        }
      }
      
      // Step 4: Add to sequences (if they exist)
      for (const sequenceName of automationPath.sequences) {
        const sequence = this.sequences.get(sequenceName);
        if (sequence) {
          await this.addSubscriberToSequence(formData.email, sequence.id, firstName, lastName);
        } else {
          log.warn(`Sequence not found: ${sequenceName} - needs manual creation`);
        }
      }
      
      log.info('✅ Lead automation completed', {
        email: formData.email,
        path: automationPath.name,
        tags: automationPath.tags.length,
        sequences: automationPath.sequences.length
      });
      
      return {
        success: true,
        subscriber_id: subscriber.id,
        automation_path: automationPath.name,
        tags_applied: automationPath.tags.length,
        sequences_added: automationPath.sequences.length
      };
      
    } catch (error) {
      log.error('❌ Lead automation failed:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Determine automation path based on lead score and submission type
  determineAutomationPath(score, submissionType) {
    const paths = {
      vip: {
        name: 'VIP Experience Journey',
        tags: ['trigger-vip-sequence', `intake-${submissionType}`, 'JC-High-Value-Lead'],
        sequences: ['JC VIP Experience Journey']
      },
      premium: {
        name: 'Premium Legal Protection Path', 
        tags: ['trigger-premium-nurture', `intake-${submissionType}`, 'JC-Premium-Lead'],
        sequences: ['JC Premium Legal Protection Path']
      },
      // REMOVED: Standard tier eliminated - Premium minimum service only
    };
    
    // Premium minimum service - no standard tier
    if (score >= 70) return paths.vip;
    return paths.premium; // All clients receive Premium minimum
  }

  // Initialize complete system
  async initializeSystem() {
    log.info('🏗️ Initializing Kit v4 automation system...');
    
    try {
      // Test connection
      await this.testConnection();
      
      // Load existing resources
      const [sequences, forms, tags] = await Promise.all([
        this.loadSequences(),
        this.loadForms(), 
        this.loadTags()
      ]);
      
      log.info('📊 System initialized successfully', {
        sequences: sequences.length,
        forms: forms.length,
        tags: tags.length
      });
      
      return {
        success: true,
        resources: {
          sequences,
          forms,
          tags
        }
      };
      
    } catch (error) {
      log.error('❌ System initialization failed:', error.message);
      throw error;
    }
  }

  // Generate sequence templates for manual setup
  generateSequenceTemplates() {
    return {
      vip: {
        name: 'JC VIP Experience Journey',
        trigger: 'trigger-vip-sequence tag',
        emails: [
          {
            subject: '🏛️ Welcome to Your VIP Legal Experience',
            delay: 'Immediate',
            content: 'VIP welcome email content...'
          },
          {
            subject: '⚡ Your Personal Legal Strategy Session Awaits',
            delay: '2 hours',
            content: 'Strategy session email content...'
          },
          {
            subject: '🎯 Priority Access: Schedule Your Session Today',
            delay: '24 hours', 
            content: 'Priority booking email content...'
          }
        ]
      },
      // Add more templates...
    };
  }
}

// Main export function for backend integration
export async function processKitV4Automation(formData, leadScore, submissionType) {
  if (!config.kit.apiKey || !config.kit.apiKey.startsWith('kit_')) {
    log.warn('Kit v4 automation skipped - API key not configured');
    return {
      success: true,
      skipped: true,
      reason: 'Kit v4 not configured'
    };
  }
  
  try {
    const automation = new KitV4Automation();
    return await automation.processLeadAutomation(formData, leadScore, submissionType);
  } catch (error) {
    log.error('Kit v4 automation failed:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

// Initialize system function
export async function initializeKitV4System() {
  const automation = new KitV4Automation();
  return await automation.initializeSystem();
}

export default KitV4Automation;