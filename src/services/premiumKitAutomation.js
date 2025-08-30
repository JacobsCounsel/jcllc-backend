// src/services/premiumKitAutomation.js - Premium Kit Automation Builder
// The Taj Mahal of legal marketing automation with Jacobs Counsel branding

import fetch from 'node-fetch';
import { config } from '../config/environment.js';
import { log } from '../utils/logger.js';

const KIT_API_BASE = 'https://api.convertkit.com/v3';

// Premium automation architecture for Jacobs Counsel
export class PremiumKitAutomation {
  constructor() {
    this.brandColors = {
      primary: '#1a365d',
      secondary: '#2d4a63', 
      accent: '#e2b030',
      text: '#2d3748',
      background: '#f7fafc'
    };
    
    this.sequences = new Map();
    this.forms = new Map();
    this.tags = new Map();
  }

  // Test Kit connection and account details
  async testConnection() {
    try {
      const response = await fetch(`${KIT_API_BASE}/account?api_key=${config.kit.apiKey}`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(`Kit API error: ${data.message || 'Unknown error'}`);
      }
      
      log.info('Kit connection successful', { account: data.name });
      return { success: true, account: data };
    } catch (error) {
      log.error('Kit connection failed:', error.message);
      throw error;
    }
  }

  // Create premium branded email templates
  generateEmailTemplate(content, type = 'welcome') {
    const templates = {
      welcome: {
        subject: '🏛️ Welcome to Jacobs Counsel - Your Legal Journey Begins',
        preheader: 'Next-generation legal counsel designed for your success'
      },
      nurture: {
        subject: '⚖️ Strategic Legal Insights for {{first_name | default: "Valued Client"}}',
        preheader: 'Personalized legal guidance based on your unique situation'
      },
      followup: {
        subject: '📋 Next Steps for Your {{service_type}} Strategy',
        preheader: 'Ready to move forward? Here\'s what happens next'
      },
      consultation: {
        subject: '🎯 Book Your Strategic Consultation - {{first_name}}',
        preheader: 'Premium legal counsel at your convenience'
      }
    };

    const template = templates[type] || templates.welcome;
    
    return {
      ...template,
      html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${template.subject}</title>
  <style>
    body { 
      margin: 0; 
      padding: 0; 
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: ${this.brandColors.background};
      color: ${this.brandColors.text};
      line-height: 1.6;
    }
    .container { 
      max-width: 600px; 
      margin: 0 auto; 
      background: white;
      box-shadow: 0 10px 40px rgba(0,0,0,0.1);
    }
    .header { 
      background: linear-gradient(135deg, ${this.brandColors.primary} 0%, ${this.brandColors.secondary} 100%);
      padding: 40px 30px;
      text-align: center;
      color: white;
    }
    .logo { 
      font-size: 28px; 
      font-weight: 700; 
      margin-bottom: 10px;
      letter-spacing: -0.5px;
    }
    .tagline { 
      opacity: 0.9; 
      font-size: 16px;
      font-weight: 300;
    }
    .content { 
      padding: 40px 30px;
    }
    .highlight-box {
      background: linear-gradient(135deg, ${this.brandColors.accent}15 0%, ${this.brandColors.accent}25 100%);
      padding: 25px;
      border-radius: 12px;
      border-left: 4px solid ${this.brandColors.accent};
      margin: 25px 0;
    }
    .cta-button {
      display: inline-block;
      background: linear-gradient(135deg, ${this.brandColors.primary} 0%, ${this.brandColors.secondary} 100%);
      color: white !important;
      padding: 16px 32px;
      text-decoration: none;
      border-radius: 8px;
      font-weight: 600;
      font-size: 16px;
      margin: 20px 0;
      box-shadow: 0 4px 15px rgba(26, 54, 93, 0.3);
      transition: all 0.3s ease;
    }
    .footer {
      background: ${this.brandColors.text};
      color: white;
      padding: 30px;
      text-align: center;
      font-size: 14px;
    }
    .disclaimer {
      opacity: 0.8;
      font-size: 12px;
      margin-top: 20px;
      padding: 15px;
      background: rgba(255,255,255,0.1);
      border-radius: 6px;
    }
    @media (max-width: 600px) {
      .container { margin: 0 10px; }
      .header, .content { padding: 25px 20px; }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">JACOBS COUNSEL</div>
      <div class="tagline">Next-Generation Legal Counsel</div>
    </div>
    <div class="content">
      ${content}
    </div>
    <div class="footer">
      <strong>JACOBS COUNSEL</strong><br>
      Strategic Legal Counsel to Unlock Your Edge
      <div class="disclaimer">
        <strong>IMPORTANT LEGAL DISCLAIMER:</strong> This communication does not create an attorney-client relationship. 
        No attorney-client privilege exists unless a written engagement letter is executed. 
        This information is for educational purposes only and should not be construed as legal advice.
        Consult with a qualified attorney for advice specific to your situation.
      </div>
    </div>
  </div>
</body>
</html>`
    };
  }

  // Create advanced form with specific triggers
  async createForm(name, description, tags = []) {
    try {
      const response = await fetch(`${KIT_API_BASE}/forms?api_key=${config.kit.apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          description,
          sign_up_button_text: 'Start Your Legal Journey',
          success_message: 'Thank you! Your personalized legal roadmap is being prepared.',
          archetype: 'lead-magnet',
          format: 'modal'
        })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(`Kit form creation failed: ${data.message}`);
      }
      
      log.info(`Kit form created: ${name}`, { id: data.form.id });
      this.forms.set(name, data.form);
      
      return data.form;
    } catch (error) {
      log.error('Kit form creation failed:', error.message);
      throw error;
    }
  }

  // Create sophisticated sequences with AI-powered personalization
  async createSequence(name, content) {
    try {
      const response = await fetch(`${KIT_API_BASE}/sequences?api_key=${config.kit.apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          description: `${name} - Premium automated sequence with intelligent personalization`
        })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(`Kit sequence creation failed: ${data.message}`);
      }
      
      log.info(`Kit sequence created: ${name}`, { id: data.sequence.id });
      this.sequences.set(name, data.sequence);
      
      // Add emails to sequence
      for (const email of content.emails) {
        await this.addEmailToSequence(data.sequence.id, email);
      }
      
      return data.sequence;
    } catch (error) {
      log.error('Kit sequence creation failed:', error.message);
      throw error;
    }
  }

  // Add branded email to sequence
  async addEmailToSequence(sequenceId, emailData) {
    try {
      const template = this.generateEmailTemplate(emailData.content, emailData.type);
      
      const response = await fetch(`${KIT_API_BASE}/sequences/${sequenceId}/emails?api_key=${config.kit.apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: template.subject,
          content: template.html,
          delay_days: emailData.delay_days || 0,
          delay_hours: emailData.delay_hours || 0,
          delay_minutes: emailData.delay_minutes || 0,
          published: true
        })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(`Kit email creation failed: ${data.message}`);
      }
      
      log.info('Kit email added to sequence', { 
        sequenceId, 
        emailId: data.email.id,
        subject: template.subject 
      });
      
      return data.email;
    } catch (error) {
      log.error('Kit email creation failed:', error.message);
      throw error;
    }
  }

  // Create premium tags for advanced segmentation
  async createTag(name) {
    try {
      const response = await fetch(`${KIT_API_BASE}/tags?api_key=${config.kit.apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(`Kit tag creation failed: ${data.message}`);
      }
      
      log.info(`Kit tag created: ${name}`, { id: data.tag.id });
      this.tags.set(name, data.tag);
      
      return data.tag;
    } catch (error) {
      log.error('Kit tag creation failed:', error.message);
      throw error;
    }
  }

  // Build the complete premium automation architecture
  async buildPremiumArchitecture() {
    log.info('🏗️ Building premium Kit automation architecture...');
    
    const results = {
      forms: [],
      sequences: [],
      tags: [],
      automations: []
    };
    
    try {
      // Test connection first
      await this.testConnection();
      
      // Create premium tags for segmentation
      const tagNames = [
        'JC-Estate-Planning-VIP',
        'JC-Business-Formation-Premium', 
        'JC-Brand-Protection-Advanced',
        'JC-Outside-Counsel-Strategic',
        'JC-High-Value-Lead',
        'JC-Consultation-Ready',
        'JC-Engaged-Prospect',
        'JC-AI-Native-Client'
      ];
      
      for (const tagName of tagNames) {
        try {
          const tag = await this.createTag(tagName);
          results.tags.push(tag);
        } catch (error) {
          log.warn(`Tag creation skipped (may exist): ${tagName}`);
        }
      }
      
      // Create premium forms for each service
      const forms = [
        {
          name: 'JC Estate Planning Premium Lead Magnet',
          description: 'Advanced estate planning assessment with intelligent recommendations'
        },
        {
          name: 'JC Business Formation Strategic Guide',
          description: 'Comprehensive business formation roadmap with AI-powered insights'
        },
        {
          name: 'JC Brand Protection Authority',
          description: 'Complete brand protection strategy with proactive monitoring'
        },
        {
          name: 'JC Outside Counsel Excellence',
          description: 'Strategic legal counsel on-demand with transparent pricing'
        }
      ];
      
      for (const formData of forms) {
        try {
          const form = await this.createForm(formData.name, formData.description);
          results.forms.push(form);
        } catch (error) {
          log.warn(`Form creation skipped: ${formData.name} - ${error.message}`);
        }
      }
      
      // Create premium sequence flows
      await this.createPremiumSequences(results);
      
      log.info('🎉 Premium Kit automation architecture complete!', {
        forms: results.forms.length,
        sequences: results.sequences.length,
        tags: results.tags.length
      });
      
      return results;
      
    } catch (error) {
      log.error('Premium architecture build failed:', error.message);
      throw error;
    }
  }

  // Create sophisticated sequence flows
  async createPremiumSequences(results) {
    const sequences = [
      {
        name: 'JC Estate Planning VIP Journey',
        emails: [
          {
            type: 'welcome',
            delay_hours: 0,
            content: `
              <h2>Welcome to Your Estate Planning Journey, {{first_name}}!</h2>
              
              <p>Thank you for trusting Jacobs Counsel with your estate planning needs. You've just taken the most important step toward protecting your family's future.</p>
              
              <div class="highlight-box">
                <h3>🛡️ What Makes Our Approach Different</h3>
                <p>Our AI-enhanced system has already begun analyzing your unique situation. Within the next 24 hours, you'll receive personalized recommendations that most attorneys miss.</p>
              </div>
              
              <p><strong>Your Immediate Next Steps:</strong></p>
              <ol>
                <li>📋 Complete your personalized estate planning assessment</li>
                <li>📞 Schedule your strategic consultation</li>
                <li>🎯 Receive your custom protection blueprint</li>
              </ol>
              
              <a href="https://calendly.com/jacobscounsel/strategic-consultation" class="cta-button">
                Book Your Strategic Consultation →
              </a>
              
              <p>Questions? Simply reply to this email - I personally read every response.</p>
              
              <p>Best regards,<br><strong>Drew Jacobs, Esq.</strong><br>Founder, Jacobs Counsel</p>
            `
          },
          {
            type: 'nurture',
            delay_days: 3,
            content: `
              <h2>{{first_name}}, Your Estate Plan Can't Wait</h2>
              
              <p>I hope you're doing well. Three days ago, you started your estate planning journey with us, and I wanted to personally reach out.</p>
              
              <div class="highlight-box">
                <h3>⚠️ The Reality Most People Miss</h3>
                <p>Every day without proper estate planning is a day your family is exposed to:</p>
                <ul>
                  <li>Probate delays that can last 12+ months</li>
                  <li>Court fees that consume 5-10% of your estate</li>
                  <li>Family disputes over unclear intentions</li>
                  <li>Tax consequences that could be avoided</li>
                </ul>
              </div>
              
              <p>Our intelligent system has prepared specific recommendations for your situation. These aren't generic templates - they're personalized strategies based on your unique goals.</p>
              
              <a href="https://calendly.com/jacobscounsel/strategic-consultation" class="cta-button">
                Claim Your Consultation (15 Minutes) →
              </a>
              
              <p>P.S. - We've helped over 500 families protect their legacies. Don't let yours be the one that waits too long.</p>
            `
          },
          {
            type: 'consultation',
            delay_days: 7,
            content: `
              <h2>Final Invitation: Your Estate Protection Strategy Awaits</h2>
              
              <p>Hi {{first_name}},</p>
              
              <p>I've been thinking about your estate planning goals, and I don't want you to miss this opportunity.</p>
              
              <div class="highlight-box">
                <h3>🎯 What Happens in Your Strategic Consultation</h3>
                <ol>
                  <li><strong>Vulnerability Assessment</strong> - We identify gaps most attorneys miss</li>
                  <li><strong>Personalized Strategy</strong> - Custom recommendations for your family</li>
                  <li><strong>Transparent Pricing</strong> - No surprises, just clear next steps</li>
                  <li><strong>Implementation Timeline</strong> - Your roadmap to complete protection</li>
                </ol>
              </div>
              
              <p>This isn't a sales call. It's a strategic session designed to give you clarity on protecting what matters most.</p>
              
              <a href="https://calendly.com/jacobscounsel/strategic-consultation" class="cta-button">
                Schedule Your Session (Last Chance) →
              </a>
              
              <p>If estate planning isn't a priority right now, I understand. Simply reply with "PAUSE" and I'll pause these emails.</p>
              
              <p>To your family's security,<br><strong>Drew Jacobs</strong></p>
            `
          }
        ]
      },
      {
        name: 'JC Business Formation Excellence',
        emails: [
          {
            type: 'welcome',
            delay_hours: 0,
            content: `
              <h2>{{first_name}}, Your Business Formation Journey Starts Now</h2>
              
              <p>Congratulations on taking the first step toward proper business protection! You're ahead of 80% of entrepreneurs who skip this critical foundation.</p>
              
              <div class="highlight-box">
                <h3>🚀 Your AI-Enhanced Business Analysis</h3>
                <p>Our advanced system is already processing your business goals and recommending the optimal structure for maximum protection and tax efficiency.</p>
              </div>
              
              <p><strong>What's Happening Behind the Scenes:</strong></p>
              <ul>
                <li>🔍 Liability risk assessment for your industry</li>
                <li>💰 Tax optimization strategy development</li>
                <li>🛡️ Asset protection framework design</li>
                <li>📈 Growth scaling recommendations</li>
              </ul>
              
              <a href="https://calendly.com/jacobscounsel/business-strategy" class="cta-button">
                Book Your Business Strategy Session →
              </a>
              
              <p>Ready to build something bulletproof?</p>
              
              <p><strong>Drew Jacobs, Esq.</strong><br>Business Formation Strategist</p>
            `
          }
        ]
      }
    ];
    
    for (const sequenceData of sequences) {
      try {
        const sequence = await this.createSequence(sequenceData.name, sequenceData);
        results.sequences.push(sequence);
      } catch (error) {
        log.warn(`Sequence creation skipped: ${sequenceData.name} - ${error.message}`);
      }
    }
  }

  // Add subscriber with premium segmentation
  async addSubscriberWithPremiumSegmentation(email, firstName, lastName, leadScore, submissionType) {
    try {
      // Determine which form and tags to use based on submission type and lead score
      const formMapping = {
        'estate-planning': 'JC Estate Planning Premium Lead Magnet',
        'business-formation': 'JC Business Formation Strategic Guide', 
        'brand-protection': 'JC Brand Protection Authority',
        'outside-counsel': 'JC Outside Counsel Excellence'
      };
      
      const formName = formMapping[submissionType] || 'JC Estate Planning Premium Lead Magnet';
      const form = this.forms.get(formName);
      
      if (!form) {
        throw new Error(`Form not found: ${formName}`);
      }
      
      // Add subscriber to form
      const response = await fetch(`${KIT_API_BASE}/forms/${form.id}/subscribe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          first_name: firstName,
          last_name: lastName,
          api_key: config.kit.apiKey,
          fields: {
            lead_score: leadScore.score,
            submission_type: submissionType,
            urgency_level: leadScore.urgency || 'medium',
            ai_recommendations: JSON.stringify(leadScore.insights || {})
          }
        })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(`Kit subscription failed: ${data.message}`);
      }
      
      // Add premium tags based on lead score and type
      const tags = this.determinePremiumTags(leadScore, submissionType);
      await this.applyTags(data.subscription.subscriber.id, tags);
      
      log.info('Premium Kit subscriber added', {
        email,
        leadScore: leadScore.score,
        tags: tags.length,
        form: formName
      });
      
      return {
        success: true,
        subscriber_id: data.subscription.subscriber.id,
        form_used: formName,
        tags_applied: tags.length
      };
      
    } catch (error) {
      log.error('Premium Kit subscription failed:', error.message);
      throw error;
    }
  }

  // Determine premium tags based on sophisticated logic
  determinePremiumTags(leadScore, submissionType) {
    const tags = [`JC-${submissionType.charAt(0).toUpperCase() + submissionType.slice(1)}-Premium`];
    
    if (leadScore.score >= 80) {
      tags.push('JC-High-Value-Lead');
    }
    
    if (leadScore.urgency === 'high') {
      tags.push('JC-Consultation-Ready');
    }
    
    if (leadScore.engagement_level === 'high') {
      tags.push('JC-Engaged-Prospect');
    }
    
    tags.push('JC-AI-Native-Client');
    
    return tags;
  }

  // Apply multiple tags to subscriber
  async applyTags(subscriberId, tagNames) {
    for (const tagName of tagNames) {
      try {
        const tag = this.tags.get(tagName);
        if (tag) {
          await fetch(`${KIT_API_BASE}/tags/${tag.id}/subscribe`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              api_key: config.kit.apiKey,
              subscriber: { id: subscriberId }
            })
          });
        }
      } catch (error) {
        log.warn(`Tag application failed: ${tagName}`, error.message);
      }
    }
  }
}

// Main integration function for backend
export async function addToKitPremiumAutomation(formData, leadScore, submissionType) {
  if (!config.kit.apiKey || config.kit.apiKey === '_asjUkBoW6K8ORx6w2lSpg') {
    log.warn('Kit premium automation skipped - API credentials not configured');
    return {
      success: true,
      skipped: true,
      reason: 'Kit credentials not configured'
    };
  }
  
  try {
    const automation = new PremiumKitAutomation();
    
    const firstName = formData.firstName || formData.fullName?.split(' ')[0] || '';
    const lastName = formData.lastName || formData.fullName?.split(' ')[1] || '';
    
    const result = await automation.addSubscriberWithPremiumSegmentation(
      formData.email,
      firstName, 
      lastName,
      leadScore,
      submissionType
    );
    
    return result;
    
  } catch (error) {
    log.error('Kit premium automation failed:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

// Build the complete premium architecture
export async function buildPremiumKitAutomation() {
  const automation = new PremiumKitAutomation();
  return await automation.buildPremiumArchitecture();
}

export default PremiumKitAutomation;