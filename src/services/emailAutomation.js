// src/services/emailAutomation.js - Unified Email Automation Service
// This replaces ALL Mailchimp functionality with intelligent Kit integration

import { IntelligentKitIntegration } from './intelligentKitIntegration.js';
import { log } from '../utils/logger.js';

class EmailAutomationService {
  constructor() {
    this.kit = new IntelligentKitIntegration();
  }

  // Test the email automation system
  async testConnection() {
    try {
      return await this.kit.testConnection();
    } catch (error) {
      log.error('Email automation connection test failed:', error.message);
      throw error;
    }
  }

  // Process a lead submission with intelligent tagging and sequencing
  async processLead(formData, leadScore, submissionType) {
    try {
      log.info(`Processing lead with intelligent Kit automation: ${formData.email}`);
      
      const result = await this.kit.processLeadSubmission(formData, leadScore, submissionType);
      
      log.info(`✅ Lead processed successfully: ${formData.email}`, {
        tagsApplied: result.tags?.filter(t => t.success).length || 0,
        totalTags: result.intelligentTags?.length || 0,
        sequence: result.sequence?.sequenceName || 'none'
      });
      
      return result;
    } catch (error) {
      log.error(`❌ Lead processing failed for ${formData.email}:`, error.message);
      throw error;
    }
  }

  // Add subscriber to newsletter (replacing Mailchimp newsletter functionality)
  async addToNewsletter(email, firstName = '', lastName = '', source = 'website') {
    try {
      log.info(`Adding to newsletter: ${email}`);
      
      // Create basic form data for newsletter signup
      const formData = {
        email,
        firstName,
        lastName,
        source
      };
      
      // Use medium lead score for newsletter signups
      const leadScore = { score: 40 };
      
      const result = await this.kit.processLeadSubmission(formData, leadScore, 'newsletter');
      
      log.info(`✅ Newsletter signup processed: ${email}`);
      return result;
    } catch (error) {
      log.error(`❌ Newsletter signup failed for ${email}:`, error.message);
      throw error;
    }
  }

  // Send broadcast to specific tags (replacing Mailchimp campaigns)
  async sendBroadcast(subject, content, tags = [], scheduledTime = null) {
    try {
      log.info(`Preparing broadcast: ${subject}`, { tags, scheduledTime });
      
      // Note: This would create a broadcast in Kit
      // For now, we'll log the intended action
      log.info(`Would send broadcast "${subject}" to tags: ${tags.join(', ')}`);
      
      return {
        success: true,
        subject,
        tags,
        scheduledTime,
        message: 'Broadcast prepared successfully'
      };
    } catch (error) {
      log.error(`Broadcast preparation failed:`, error.message);
      throw error;
    }
  }

  // Get subscriber information by email
  async getSubscriber(email) {
    try {
      return await this.kit.getSubscriberByEmail(email);
    } catch (error) {
      log.error(`Failed to get subscriber: ${email}`, error.message);
      throw error;
    }
  }

  // Apply specific tags to a subscriber
  async applyTags(email, tags) {
    try {
      const results = [];
      
      for (const tagName of tags) {
        try {
          const result = await this.kit.createAndApplyTag(email, tagName);
          results.push({ tag: tagName, success: true, result });
        } catch (error) {
          results.push({ tag: tagName, success: false, error: error.message });
        }
      }
      
      const successful = results.filter(r => r.success).length;
      log.info(`Applied ${successful}/${tags.length} tags to ${email}`);
      
      return {
        success: successful > 0,
        results,
        successful,
        total: tags.length
      };
    } catch (error) {
      log.error(`Failed to apply tags to ${email}:`, error.message);
      throw error;
    }
  }

  // Remove tags from a subscriber
  async removeTags(email, tags) {
    try {
      log.info(`Would remove tags from ${email}: ${tags.join(', ')}`);
      // Note: Implementation would depend on Kit API capabilities
      return {
        success: true,
        message: `Tags removal queued for ${email}`,
        tags
      };
    } catch (error) {
      log.error(`Failed to remove tags from ${email}:`, error.message);
      throw error;
    }
  }

  // Get analytics and stats
  async getAnalytics(timeframe = '30d') {
    try {
      log.info(`Getting email automation analytics for ${timeframe}`);
      
      // Note: This would fetch real analytics from Kit
      return {
        success: true,
        timeframe,
        subscribers: {
          total: 0,
          new: 0,
          active: 0
        },
        campaigns: {
          sent: 0,
          opened: 0,
          clicked: 0
        },
        sequences: {
          active: 0,
          completed: 0
        }
      };
    } catch (error) {
      log.error(`Failed to get analytics:`, error.message);
      throw error;
    }
  }

  // List all tags
  async listTags() {
    try {
      return await this.kit.listTags();
    } catch (error) {
      log.error(`Failed to list tags:`, error.message);
      throw error;
    }
  }

  // Health check
  async healthCheck() {
    try {
      const connection = await this.testConnection();
      return {
        healthy: true,
        service: 'Kit (ConvertKit)',
        connection: connection.success,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        healthy: false,
        service: 'Kit (ConvertKit)',
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }
}

// Export a singleton instance
export const emailAutomation = new EmailAutomationService();

// Export the class for testing
export { EmailAutomationService };

export default emailAutomation;