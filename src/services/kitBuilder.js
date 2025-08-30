// src/services/kitBuilder.js - Complete Kit Account Builder
// Builds the entire premium automation system directly in Kit

import fetch from 'node-fetch';
import { config } from '../config/environment.js';
import { log } from '../utils/logger.js';

const KIT_API_BASE = 'https://api.convertkit.com/v3';

export class KitBuilder {
  constructor() {
    this.apiKey = config.kit.apiKey;
    this.apiSecret = config.kit.apiSecret;
    
    // Track created resources
    this.createdForms = new Map();
    this.createdSequences = new Map();
    this.createdTags = new Map();
    this.createdAutomations = new Map();
    
    // Jacobs Counsel brand colors and styling
    this.branding = {
      colors: {
        primary: '#1a365d',
        secondary: '#2d4a63',
        accent: '#e2b030',
        text: '#2d3748',
        background: '#f7fafc',
        white: '#ffffff'
      },
      fonts: {
        primary: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
      }
    };
  }

  // Test Kit connection
  async testConnection() {
    try {
      const response = await fetch(`${KIT_API_BASE}/account?api_key=${this.apiKey}`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(`Kit connection failed: ${data.message || 'Unknown error'}`);
      }
      
      log.info('✅ Kit connection successful', { account: data.name });
      return { success: true, account: data };
    } catch (error) {
      log.error('❌ Kit connection failed:', error.message);
      throw error;
    }
  }

  // Generate premium branded email HTML
  generateEmailHTML(content, type = 'welcome') {
    const { colors } = this.branding;
    
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Jacobs Counsel</title>
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <![endif]-->
  <style>
    /* Reset styles */
    body, table, td, p, a, li, blockquote { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { -ms-interpolation-mode: bicubic; border: 0; outline: none; text-decoration: none; }
    
    /* Base styles */
    body {
      margin: 0 !important;
      padding: 0 !important;
      background-color: ${colors.background};
      font-family: ${this.branding.fonts.primary};
      line-height: 1.6;
      color: ${colors.text};
    }
    
    .email-container {
      max-width: 600px;
      margin: 0 auto;
      background-color: ${colors.white};
    }
    
    .header {
      background: linear-gradient(135deg, ${colors.primary} 0%, ${colors.secondary} 100%);
      padding: 40px 30px;
      text-align: center;
    }
    
    .logo {
      color: ${colors.white};
      font-size: 28px;
      font-weight: 700;
      letter-spacing: -0.5px;
      margin-bottom: 8px;
      text-decoration: none;
    }
    
    .tagline {
      color: rgba(255, 255, 255, 0.9);
      font-size: 16px;
      font-weight: 300;
      margin: 0;
    }
    
    .content {
      padding: 40px 30px;
    }
    
    .content h1 {
      color: ${colors.primary};
      font-size: 24px;
      font-weight: 700;
      margin: 0 0 20px 0;
      line-height: 1.3;
    }
    
    .content h2 {
      color: ${colors.primary};
      font-size: 20px;
      font-weight: 600;
      margin: 30px 0 15px 0;
    }
    
    .content h3 {
      color: ${colors.secondary};
      font-size: 18px;
      font-weight: 600;
      margin: 25px 0 10px 0;
    }
    
    .content p {
      margin: 0 0 16px 0;
      font-size: 16px;
      line-height: 1.6;
    }
    
    .highlight-box {
      background: linear-gradient(135deg, ${colors.accent}15 0%, ${colors.accent}25 100%);
      border-left: 4px solid ${colors.accent};
      padding: 20px;
      margin: 20px 0;
      border-radius: 8px;
    }
    
    .highlight-box h3 {
      margin-top: 0;
      color: ${colors.primary};
    }
    
    .cta-button {
      display: inline-block;
      background: linear-gradient(135deg, ${colors.primary} 0%, ${colors.secondary} 100%);
      color: ${colors.white} !important;
      text-decoration: none !important;
      padding: 16px 32px;
      border-radius: 8px;
      font-weight: 600;
      font-size: 16px;
      margin: 20px 0;
      text-align: center;
      border: none;
      cursor: pointer;
    }
    
    .cta-button:hover {
      opacity: 0.9;
    }
    
    .footer {
      background-color: ${colors.text};
      color: ${colors.white};
      padding: 30px;
      text-align: center;
      font-size: 14px;
    }
    
    .disclaimer {
      background-color: rgba(255, 255, 255, 0.1);
      padding: 15px;
      margin-top: 20px;
      border-radius: 6px;
      font-size: 12px;
      opacity: 0.9;
      line-height: 1.4;
    }
    
    /* Responsive */
    @media only screen and (max-width: 600px) {
      .email-container { width: 100% !important; }
      .header, .content, .footer { padding: 25px 20px !important; }
      .logo { font-size: 24px !important; }
      .content h1 { font-size: 22px !important; }
      .cta-button { display: block !important; width: 100% !important; }
    }
  </style>
</head>
<body>
  <div class="email-container">
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
        <strong>IMPORTANT LEGAL DISCLAIMER:</strong><br>
        This communication does not create an attorney-client relationship. No attorney-client privilege exists unless a written engagement letter is executed. This information is for educational purposes only and should not be construed as legal advice. Consult with a qualified attorney for advice specific to your situation.
      </div>
    </div>
  </div>
</body>
</html>`;
  }

  // Create a tag in Kit
  async createTag(name) {
    try {
      const response = await fetch(`${KIT_API_BASE}/tags`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          api_key: this.apiKey,
          name: name
        })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        // Tag might already exist
        if (data.message && data.message.includes('already exists')) {
          log.info(`Tag already exists: ${name}`);
          // Get existing tag
          const existingTag = await this.getExistingTag(name);
          if (existingTag) {
            this.createdTags.set(name, existingTag);
            return existingTag;
          }
        }
        throw new Error(`Tag creation failed: ${data.message || 'Unknown error'}`);
      }
      
      log.info(`✅ Tag created: ${name}`, { id: data.tag.id });
      this.createdTags.set(name, data.tag);
      return data.tag;
      
    } catch (error) {
      log.error(`❌ Tag creation failed: ${name}`, error.message);
      throw error;
    }
  }

  // Get existing tag by name
  async getExistingTag(name) {
    try {
      const response = await fetch(`${KIT_API_BASE}/tags?api_key=${this.apiKey}`);
      const data = await response.json();
      
      if (response.ok && data.tags) {
        const existingTag = data.tags.find(tag => tag.name === name);
        return existingTag || null;
      }
      return null;
    } catch (error) {
      return null;
    }
  }

  // Create a form in Kit
  async createForm(name, description) {
    try {
      const response = await fetch(`${KIT_API_BASE}/forms`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          api_key: this.apiKey,
          name: name,
          description: description,
          sign_up_button_text: 'Start Your Legal Journey',
          success_message: 'Thank you! Your personalized legal roadmap is being prepared. Check your email for next steps.',
          archetype: 'lead-magnet',
          format: 'modal'
        })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(`Form creation failed: ${data.message || 'Unknown error'}`);
      }
      
      log.info(`✅ Form created: ${name}`, { id: data.form.id });
      this.createdForms.set(name, data.form);
      return data.form;
      
    } catch (error) {
      log.error(`❌ Form creation failed: ${name}`, error.message);
      throw error;
    }
  }

  // Create a sequence in Kit
  async createSequence(name, description) {
    try {
      const response = await fetch(`${KIT_API_BASE}/sequences`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          api_key: this.apiKey,
          name: name,
          description: description
        })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(`Sequence creation failed: ${data.message || 'Unknown error'}`);
      }
      
      log.info(`✅ Sequence created: ${name}`, { id: data.sequence.id });
      this.createdSequences.set(name, data.sequence);
      return data.sequence;
      
    } catch (error) {
      log.error(`❌ Sequence creation failed: ${name}`, error.message);
      throw error;
    }
  }

  // Add email to sequence
  async addEmailToSequence(sequenceId, emailData) {
    try {
      const emailHTML = this.generateEmailHTML(emailData.content, emailData.type);
      
      const response = await fetch(`${KIT_API_BASE}/sequences/${sequenceId}/emails`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          api_key: this.apiKey,
          subject: emailData.subject,
          content: emailHTML,
          delay_days: emailData.delay_days || 0,
          delay_hours: emailData.delay_hours || 0,
          delay_minutes: emailData.delay_minutes || 0,
          published: true
        })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(`Email creation failed: ${data.message || 'Unknown error'}`);
      }
      
      log.info(`✅ Email added to sequence`, { 
        sequenceId, 
        emailId: data.email.id,
        subject: emailData.subject 
      });
      
      return data.email;
      
    } catch (error) {
      log.error(`❌ Email creation failed:`, error.message);
      throw error;
    }
  }

  // Build complete premium automation system
  async buildCompleteSystem() {
    log.info('🏗️ Building complete premium Kit automation system...');
    
    const results = {
      tags: [],
      forms: [],
      sequences: [],
      emails: [],
      automations: []
    };
    
    try {
      // Test connection first
      await this.testConnection();
      
      // Step 1: Create all premium tags
      log.info('📋 Creating premium tags...');
      const tagNames = [
        'JC-Estate-Planning-VIP',
        'JC-Business-Formation-Premium',
        'JC-Brand-Protection-Advanced', 
        'JC-Outside-Counsel-Strategic',
        'JC-High-Value-Lead',
        'JC-Consultation-Ready',
        'JC-Engaged-Prospect',
        'JC-AI-Native-Client',
        'JC-Newsletter-Subscriber'
      ];
      
      for (const tagName of tagNames) {
        try {
          const tag = await this.createTag(tagName);
          results.tags.push(tag);
        } catch (error) {
          log.warn(`Tag creation skipped: ${tagName} - ${error.message}`);
        }
      }
      
      // Step 2: Create premium forms
      log.info('📝 Creating premium forms...');
      const forms = [
        {
          name: 'JC Estate Planning Premium Lead Magnet',
          description: 'Comprehensive estate planning assessment with AI-powered recommendations and personalized strategy development for high-net-worth individuals and families.'
        },
        {
          name: 'JC Business Formation Strategic Guide',
          description: 'Advanced business formation roadmap with intelligent entity selection, tax optimization strategies, and scalable legal structure recommendations.'
        },
        {
          name: 'JC Brand Protection Authority',
          description: 'Complete intellectual property protection strategy with proactive trademark monitoring, filing recommendations, and brand defense protocols.'
        },
        {
          name: 'JC Outside Counsel Excellence',
          description: 'Strategic on-demand legal counsel with expert contract analysis, negotiation support, and transparent pricing for ongoing business needs.'
        },
        {
          name: 'JC Legal Strategy Builder Premium',
          description: 'Comprehensive legal vulnerability assessment with personalized protection recommendations and strategic implementation roadmap.'
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
      
      // Step 3: Create premium email sequences
      log.info('📧 Creating premium email sequences...');
      await this.createPremiumSequences(results);
      
      log.info('🎉 Premium Kit automation system complete!', {
        tags: results.tags.length,
        forms: results.forms.length,
        sequences: results.sequences.length,
        emails: results.emails.length
      });
      
      return results;
      
    } catch (error) {
      log.error('❌ Premium system build failed:', error.message);
      throw error;
    }
  }

  // Create all premium email sequences
  async createPremiumSequences(results) {
    const sequences = [
      {
        name: 'JC Estate Planning VIP Journey',
        description: 'Premium 3-email sequence for estate planning leads with personalized strategy development and consultation conversion optimization.',
        emails: [
          {
            type: 'welcome',
            subject: '🏛️ Welcome to Your Estate Planning Journey, {{first_name | default: "Valued Client"}}',
            delay_hours: 0,
            content: `
              <h1>Welcome to Your Estate Planning Journey!</h1>
              
              <p>Thank you for trusting Jacobs Counsel with your family's most important legal needs. You've just taken the most critical step toward protecting your legacy and ensuring your loved ones are secure.</p>
              
              <div class="highlight-box">
                <h3>🛡️ What Makes Our Approach Revolutionary</h3>
                <p>Our advanced AI-enhanced legal analysis has already begun processing your unique situation. Within the next 24 hours, you'll receive personalized recommendations that traditional attorneys often miss—strategies that could save your family thousands in taxes and prevent costly legal disputes.</p>
              </div>
              
              <p><strong>Your Immediate Action Plan:</strong></p>
              <ol>
                <li>📋 <strong>Complete Assessment</strong> - Finish your personalized estate planning questionnaire</li>
                <li>📞 <strong>Strategic Consultation</strong> - Book your complimentary 15-minute strategy session</li>
                <li>🎯 <strong>Custom Blueprint</strong> - Receive your tailored estate protection roadmap</li>
              </ol>
              
              <p>I personally review every assessment and consultation request. Your family's security deserves nothing less than premium attention.</p>
              
              <a href="https://calendly.com/jacobscounsel/estate-planning-consultation" class="cta-button">
                Book Your Strategic Consultation →
              </a>
              
              <p>Questions about your estate planning needs? Simply reply to this email—I read every response personally.</p>
              
              <p>To your family's lasting security,<br>
              <strong>Drew Jacobs, Esq.</strong><br>
              Founder & Managing Attorney<br>
              Jacobs Counsel</p>
            `
          },
          {
            type: 'nurture',
            subject: '⚠️ {{first_name}}, Your Family\'s Protection Can\'t Wait',
            delay_days: 3,
            content: `
              <h1>{{first_name}}, Time Is Your Family's Enemy</h1>
              
              <p>I hope you and your family are doing well. Three days ago, you began your estate planning journey with us, and I wanted to reach out personally with something urgent.</p>
              
              <div class="highlight-box">
                <h3>⚠️ The Hidden Dangers Most Families Face</h3>
                <p>Every single day without proper estate planning exposes your family to devastating risks:</p>
                <ul>
                  <li><strong>Probate Nightmare:</strong> 12-18 months of court delays while your family waits</li>
                  <li><strong>Crushing Costs:</strong> 5-10% of your entire estate consumed by court fees</li>
                  <li><strong>Family Warfare:</strong> Bitter disputes over unclear intentions tear families apart</li>
                  <li><strong>Tax Devastation:</strong> Preventable tax consequences that could cost hundreds of thousands</li>
                  <li><strong>Business Chaos:</strong> Your company's future left to chance and conflict</li>
                </ul>
              </div>
              
              <p>Here's what most attorneys won't tell you: <strong>Generic estate plans fail.</strong> Cookie-cutter documents from online services or volume-based law firms leave massive gaps that only become apparent when it's too late.</p>
              
              <p>Our AI-enhanced analysis has already identified specific vulnerabilities in situations like yours. These aren't template recommendations—they're precision strategies based on your exact circumstances, goals, and family dynamics.</p>
              
              <div class="highlight-box">
                <h3>🎯 What Happens in Your Strategic Session</h3>
                <ol>
                  <li><strong>Vulnerability Assessment:</strong> We identify the gaps other attorneys miss</li>
                  <li><strong>Personalized Strategy:</strong> Custom recommendations for your family's unique needs</li>
                  <li><strong>Tax Optimization:</strong> Strategies to minimize estate and gift tax exposure</li>
                  <li><strong>Legacy Protection:</strong> Ensuring your values and wealth transfer properly</li>
                  <li><strong>Clear Action Plan:</strong> Your roadmap to complete family protection</li>
                </ol>
              </div>
              
              <p>The consultation is complimentary, but the insights are invaluable. I'll personally review your situation and provide actionable guidance whether we work together or not.</p>
              
              <a href="https://calendly.com/jacobscounsel/estate-planning-consultation" class="cta-button">
                Claim Your Strategic Session (15 Minutes) →
              </a>
              
              <p><strong>P.S.</strong> - We've helped over 500 families protect their legacies and avoid the disasters I described above. Don't let your family be the one that waits too long.</p>
              
              <p>Protecting what matters most,<br>
              <strong>Drew Jacobs</strong></p>
            `
          },
          {
            type: 'consultation',
            subject: '🚨 FINAL NOTICE: Your Estate Protection Strategy (Action Required)',
            delay_days: 7,
            content: `
              <h1>This Is My Final Personal Invitation</h1>
              
              <p>Hi {{first_name}},</p>
              
              <p>I've been thinking about your estate planning situation, and I'm genuinely concerned. It's been a week since you showed serious interest in protecting your family, but you haven't taken the final step.</p>
              
              <p>I understand—estate planning feels overwhelming. The legal jargon, the complex decisions, the fear of making mistakes. But here's the truth: <strong>doing nothing is the biggest mistake of all.</strong></p>
              
              <div class="highlight-box">
                <h3>🎯 Your 15-Minute Strategic Session Includes</h3>
                <ol>
                  <li><strong>Immediate Risk Assessment:</strong> I'll identify your family's most urgent vulnerabilities</li>
                  <li><strong>Priority Action Items:</strong> The 3 most critical steps to take right now</li>
                  <li><strong>Investment Clarity:</strong> Transparent pricing with no surprises or hidden fees</li>
                  <li><strong>Timeline Roadmap:</strong> Exactly how quickly we can get your protection in place</li>
                  <li><strong>Peace of Mind:</strong> Finally know your family is truly protected</li>
                </ol>
              </div>
              
              <p>This isn't a high-pressure sales call. It's a strategic planning session designed to give you absolute clarity on protecting what matters most to you. Many clients tell me it's the most valuable 15 minutes they've ever spent.</p>
              
              <p><strong>Here's my commitment to you:</strong> Even if we don't work together, you'll walk away with actionable insights that could save your family thousands of dollars and months of legal hassles.</p>
              
              <a href="https://calendly.com/jacobscounsel/estate-planning-consultation" class="cta-button">
                Book Your Final Opportunity Session →
              </a>
              
              <p><strong>If estate planning isn't a priority right now,</strong> I completely understand. Life gets busy. Simply reply with "PAUSE" and I'll pause these emails until you're ready.</p>
              
              <p>But if your family's security matters to you—if you want to ensure they're protected no matter what happens—then this is your moment to act.</p>
              
              <p>The consultation calendar closes tomorrow. After that, the next available appointment isn't for several weeks.</p>
              
              <p>To your family's enduring protection,<br>
              <strong>Drew Jacobs, Esq.</strong><br>
              Your Estate Planning Strategist</p>
            `
          }
        ]
      },
      {
        name: 'JC Business Formation Excellence',
        description: 'Strategic business formation sequence with AI-powered entity recommendations and growth-focused legal structure optimization.',
        emails: [
          {
            type: 'welcome',
            subject: '🚀 {{first_name}}, Your Business Protection Journey Begins Now',
            delay_hours: 0,
            content: `
              <h1>Congratulations on Taking Control of Your Business Future!</h1>
              
              <p>{{first_name}}, you're already ahead of 80% of entrepreneurs who skip this critical foundation step. By prioritizing proper business formation, you're setting yourself up for long-term success and protection.</p>
              
              <div class="highlight-box">
                <h3>🚀 Your AI-Enhanced Business Analysis Is Underway</h3>
                <p>Our advanced legal technology is already processing your business goals and industry requirements. Within hours, you'll have personalized recommendations for:</p>
                <ul>
                  <li>🛡️ Optimal business entity structure for maximum liability protection</li>
                  <li>💰 Tax-efficient formation strategies to minimize your burden</li>
                  <li>📈 Scalable legal framework that grows with your success</li>
                  <li>🎯 Industry-specific compliance and risk management protocols</li>
                </ul>
              </div>
              
              <p><strong>What's Happening Behind the Scenes Right Now:</strong></p>
              <ol>
                <li>🔍 <strong>Risk Assessment:</strong> Analyzing liability exposure for your specific industry</li>
                <li>💡 <strong>Tax Optimization:</strong> Identifying the most tax-efficient structure for your goals</li>
                <li>🛡️ <strong>Asset Protection:</strong> Designing frameworks to shield your personal wealth</li>
                <li>📊 <strong>Growth Planning:</strong> Ensuring your structure supports future expansion</li>
              </ol>
              
              <p>Most entrepreneurs make costly formation mistakes that haunt them for years. Wrong entity choice, improper tax elections, inadequate operating agreements—these "small" oversights can cost tens of thousands later.</p>
              
              <p>You won't have that problem. Our systematic approach ensures you get it right the first time.</p>
              
              <a href="https://calendly.com/jacobscounsel/business-formation-strategy" class="cta-button">
                Book Your Business Strategy Session →
              </a>
              
              <p>Ready to build something bulletproof? Let's make it happen.</p>
              
              <p>To your business success,<br>
              <strong>Drew Jacobs, Esq.</strong><br>
              Business Formation Strategist<br>
              Jacobs Counsel</p>
            `
          }
        ]
      },
      {
        name: 'JC Brand Protection Authority',
        description: 'Comprehensive intellectual property protection sequence with proactive monitoring and strategic trademark guidance.',
        emails: [
          {
            type: 'welcome',
            subject: '™️ {{first_name}}, Your Brand Protection Strategy Activated',
            delay_hours: 0,
            content: `
              <h1>Your Brand Is Now Under Strategic Protection</h1>
              
              <p>{{first_name}}, congratulations on taking proactive steps to protect your most valuable business asset—your brand identity.</p>
              
              <div class="highlight-box">
                <h3>🛡️ Advanced Brand Analysis Initiated</h3>
                <p>Our intelligent IP protection system is already scanning for:</p>
                <ul>
                  <li>🔍 Existing trademark conflicts and clearance issues</li>
                  <li>⚡ Real-time monitoring for brand infringement</li>
                  <li>🎯 Strategic filing recommendations for maximum protection</li>
                  <li>🌐 International brand protection opportunities</li>
                </ul>
              </div>
              
              <p><strong>Why This Matters More Than You Realize:</strong></p>
              <p>Every day without proper trademark protection, your brand becomes vulnerable to copycats, competitors, and cybersquatters. We've seen businesses lose their names, domains, and entire brand identities because they waited too long to act.</p>
              
              <a href="https://calendly.com/jacobscounsel/brand-protection-consultation" class="cta-button">
                Secure Your Brand Strategy Session →
              </a>
              
              <p>Your brand deserves fortress-level protection. Let's build it together.</p>
              
              <p>Protecting your intellectual property,<br>
              <strong>Drew Jacobs, Esq.</strong><br>
              Brand Protection Specialist</p>
            `
          }
        ]
      }
    ];
    
    for (const sequenceData of sequences) {
      try {
        const sequence = await this.createSequence(sequenceData.name, sequenceData.description);
        results.sequences.push(sequence);
        
        // Add emails to the sequence
        for (const emailData of sequenceData.emails) {
          try {
            const email = await this.addEmailToSequence(sequence.id, emailData);
            results.emails.push(email);
          } catch (error) {
            log.warn(`Email addition failed: ${emailData.subject} - ${error.message}`);
          }
        }
      } catch (error) {
        log.warn(`Sequence creation skipped: ${sequenceData.name} - ${error.message}`);
      }
    }
  }

  // Get summary of created resources
  getSummary() {
    return {
      tags: Array.from(this.createdTags.values()),
      forms: Array.from(this.createdForms.values()),
      sequences: Array.from(this.createdSequences.values()),
      automations: Array.from(this.createdAutomations.values())
    };
  }
}

// Main function to build everything
export async function buildCompleteKitSystem() {
  const builder = new KitBuilder();
  return await builder.buildCompleteSystem();
}

export default KitBuilder;