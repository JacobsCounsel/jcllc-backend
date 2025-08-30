// src/services/smartKitBuilder.js - Smart Kit Builder That Works With Existing Tags
// Builds on top of existing Kit account structure

import fetch from 'node-fetch';
import { config } from '../config/environment.js';
import { log } from '../utils/logger.js';

const KIT_API_BASE = 'https://api.convertkit.com/v3';

export class SmartKitBuilder {
  constructor() {
    this.apiKey = config.kit.apiKey;
    this.apiSecret = config.kit.apiSecret;
    
    // Track existing and created resources
    this.existingTags = new Map();
    this.existingForms = new Map();
    this.existingSequences = new Map();
    this.createdSequences = new Map();
    this.createdForms = new Map();
    
    // Jacobs Counsel brand colors
    this.branding = {
      colors: {
        primary: '#1a365d',
        secondary: '#2d4a63',
        accent: '#e2b030',
        text: '#2d3748',
        background: '#f7fafc',
        white: '#ffffff'
      }
    };
  }

  // Test connection and get account info
  async testConnection() {
    try {
      const response = await fetch(`${KIT_API_BASE}/account?api_key=${this.apiKey}`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(`Kit connection failed: ${data.message || 'Unknown error'}`);
      }
      
      log.info('✅ Kit connection successful', { 
        account: data.name,
        id: data.id 
      });
      return { success: true, account: data };
    } catch (error) {
      log.error('❌ Kit connection failed:', error.message);
      throw error;
    }
  }

  // Get all existing tags
  async loadExistingTags() {
    try {
      const response = await fetch(`${KIT_API_BASE}/tags?api_key=${this.apiKey}`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(`Failed to load tags: ${data.message || 'Unknown error'}`);
      }
      
      if (data.tags) {
        data.tags.forEach(tag => {
          this.existingTags.set(tag.name, tag);
        });
      }
      
      log.info(`📋 Loaded ${this.existingTags.size} existing tags`);
      return Array.from(this.existingTags.values());
    } catch (error) {
      log.error('❌ Failed to load existing tags:', error.message);
      throw error;
    }
  }

  // Get all existing forms
  async loadExistingForms() {
    try {
      const response = await fetch(`${KIT_API_BASE}/forms?api_key=${this.apiKey}`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(`Failed to load forms: ${data.message || 'Unknown error'}`);
      }
      
      if (data.forms) {
        data.forms.forEach(form => {
          this.existingForms.set(form.name, form);
        });
      }
      
      log.info(`📝 Loaded ${this.existingForms.size} existing forms`);
      return Array.from(this.existingForms.values());
    } catch (error) {
      log.error('❌ Failed to load existing forms:', error.message);
      throw error;
    }
  }

  // Get all existing sequences
  async loadExistingSequences() {
    try {
      const response = await fetch(`${KIT_API_BASE}/sequences?api_key=${this.apiKey}`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(`Failed to load sequences: ${data.message || 'Unknown error'}`);
      }
      
      if (data.sequences) {
        data.sequences.forEach(sequence => {
          this.existingSequences.set(sequence.name, sequence);
        });
      }
      
      log.info(`📧 Loaded ${this.existingSequences.size} existing sequences`);
      return Array.from(this.existingSequences.values());
    } catch (error) {
      log.error('❌ Failed to load existing sequences:', error.message);
      throw error;
    }
  }

  // Generate premium branded email HTML (same as before but optimized)
  generateEmailHTML(content, type = 'welcome') {
    const { colors } = this.branding;
    
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Jacobs Counsel</title>
  <style>
    body, table, td, p, a, li, blockquote { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { -ms-interpolation-mode: bicubic; border: 0; outline: none; text-decoration: none; }
    
    body {
      margin: 0 !important;
      padding: 0 !important;
      background-color: ${colors.background};
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      line-height: 1.6;
      color: ${colors.text};
    }
    
    .email-container {
      max-width: 600px;
      margin: 0 auto;
      background-color: ${colors.white};
      box-shadow: 0 10px 40px rgba(0,0,0,0.08);
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
      padding: 25px;
      margin: 25px 0;
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
      box-shadow: 0 4px 15px rgba(26, 54, 93, 0.3);
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

  // Create sequence only if it doesn't exist
  async createSequence(name, description) {
    // Check if sequence already exists
    if (this.existingSequences.has(name)) {
      log.info(`📧 Sequence already exists: ${name}`);
      return this.existingSequences.get(name);
    }

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
      
      log.info(`✅ New sequence created: ${name}`, { id: data.sequence.id });
      this.createdSequences.set(name, data.sequence);
      return data.sequence;
      
    } catch (error) {
      log.error(`❌ Sequence creation failed: ${name}`, error.message);
      throw error;
    }
  }

  // Create form only if it doesn't exist
  async createForm(name, description) {
    // Check if form already exists
    if (this.existingForms.has(name)) {
      log.info(`📝 Form already exists: ${name}`);
      return this.existingForms.get(name);
    }

    try {
      const response = await fetch(`${KIT_API_BASE}/forms`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          api_key: this.apiKey,
          name: name,
          description: description,
          sign_up_button_text: 'Start Your Legal Journey',
          success_message: 'Thank you! Your personalized legal roadmap is being prepared.',
          archetype: 'lead-magnet',
          format: 'modal'
        })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(`Form creation failed: ${data.message || 'Unknown error'}`);
      }
      
      log.info(`✅ New form created: ${name}`, { id: data.form.id });
      this.createdForms.set(name, data.form);
      return data.form;
      
    } catch (error) {
      log.error(`❌ Form creation failed: ${name}`, error.message);
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

  // Build the Taj Mahal on existing foundation
  async buildTajMahalOnExisting() {
    log.info('🏛️ Building Taj Mahal on existing Kit foundation...');
    
    const results = {
      existingTags: [],
      existingForms: [],
      existingSequences: [],
      newSequences: [],
      newForms: [],
      emails: []
    };
    
    try {
      // Test connection
      await this.testConnection();
      
      // Load existing resources
      results.existingTags = await this.loadExistingTags();
      results.existingForms = await this.loadExistingForms();
      results.existingSequences = await this.loadExistingSequences();
      
      log.info('📊 Account Analysis:', {
        existingTags: results.existingTags.length,
        existingForms: results.existingForms.length,
        existingSequences: results.existingSequences.length
      });
      
      // Create only premium sequences (forms and tags we'll use existing ones)
      log.info('📧 Building premium email sequences on existing foundation...');
      
      const premiumSequences = [
        {
          name: 'Jacobs Counsel - Estate Planning VIP Journey',
          description: 'Premium 3-email sequence for estate planning leads with AI-enhanced personalization and consultation conversion optimization.',
          emails: [
            {
              type: 'welcome',
              subject: '🏛️ Welcome to Your Estate Planning Journey, {{first_name | default: "Valued Client"}}',
              delay_hours: 0,
              content: `
                <h1>Welcome to Your Estate Planning Journey!</h1>
                
                <p>Thank you for trusting Jacobs Counsel with your family's most important legal decisions. You've just taken the most critical step toward protecting your legacy and ensuring your loved ones are truly secure.</p>
                
                <div class="highlight-box">
                  <h3>🛡️ What Makes Our Approach Revolutionary</h3>
                  <p>Our advanced AI-enhanced legal analysis has already begun processing your unique situation. Within the next 24 hours, you'll receive personalized recommendations that traditional attorneys often miss—strategies that could save your family thousands in taxes and prevent devastating legal disputes.</p>
                </div>
                
                <p><strong>Your Immediate Action Plan:</strong></p>
                <ol>
                  <li>📋 <strong>Complete Assessment</strong> - Finish your personalized estate planning questionnaire</li>
                  <li>📞 <strong>Strategic Consultation</strong> - Book your complimentary 15-minute strategy session</li>
                  <li>🎯 <strong>Custom Blueprint</strong> - Receive your tailored estate protection roadmap</li>
                </ol>
                
                <p>I personally review every assessment and consultation request. Your family's security deserves nothing less than premium, personalized attention.</p>
                
                <a href="https://calendly.com/jacobscounsel/estate-planning-consultation" class="cta-button">
                  Book Your Strategic Consultation →
                </a>
                
                <p>Questions about your estate planning strategy? Simply reply to this email—I read every response personally and will get back to you within 24 hours.</p>
                
                <p>To your family's lasting security,<br>
                <strong>Drew Jacobs, Esq.</strong><br>
                Founder & Managing Attorney<br>
                Jacobs Counsel</p>
              `
            },
            {
              type: 'urgency',
              subject: '⚠️ {{first_name}}, Your Family\'s Protection Can\'t Wait Any Longer',
              delay_days: 3,
              content: `
                <h1>{{first_name}}, Time Is Your Family's Greatest Enemy</h1>
                
                <p>I hope you and your family are doing well. It's been three days since you began your estate planning journey with us, and I wanted to reach out personally about something that keeps me awake at night.</p>
                
                <div class="highlight-box">
                  <h3>⚠️ The Devastating Reality Most Families Face</h3>
                  <p>Every single day without proper estate planning exposes your family to catastrophic risks that most people never see coming:</p>
                  <ul>
                    <li><strong>Probate Nightmare:</strong> 12-24 months of court delays while your family suffers financially</li>
                    <li><strong>Crushing Legal Costs:</strong> 5-10% of your entire estate consumed by attorney fees and court costs</li>
                    <li><strong>Family Warfare:</strong> Bitter disputes over unclear intentions that destroy relationships forever</li>
                    <li><strong>Tax Devastation:</strong> Preventable tax consequences that could cost your family hundreds of thousands</li>
                    <li><strong>Business Chaos:</strong> Your life's work left vulnerable to creditors and family conflicts</li>
                    <li><strong>Guardian Battles:</strong> Courts deciding who raises your children instead of you</li>
                  </ul>
                </div>
                
                <p><strong>Here's what most attorneys won't tell you:</strong> Generic estate plans fail when families need them most. Cookie-cutter documents from online services or volume-based law firms leave massive gaps that only become apparent after it's too late to fix them.</p>
                
                <p>Our AI-enhanced analysis has already identified specific vulnerabilities in situations exactly like yours. These aren't template recommendations—they're precision strategies based on your unique circumstances, family dynamics, and financial goals.</p>
                
                <div class="highlight-box">
                  <h3>🎯 Your 15-Minute Strategic Session Reveals</h3>
                  <ol>
                    <li><strong>Hidden Vulnerabilities:</strong> The critical gaps other attorneys miss completely</li>
                    <li><strong>Personalized Solutions:</strong> Custom strategies designed for your family's exact needs</li>
                    <li><strong>Tax Optimization:</strong> Advanced strategies to minimize estate and gift tax exposure</li>
                    <li><strong>Asset Protection:</strong> Bulletproof structures to shield your wealth from creditors</li>
                    <li><strong>Legacy Preservation:</strong> Ensuring your values and wealth transfer exactly as you intend</li>
                    <li><strong>Clear Roadmap:</strong> Your step-by-step path to complete family protection</li>
                  </ol>
                </div>
                
                <p>This consultation is complimentary, but the insights could be worth hundreds of thousands to your family. I'll personally review your situation and provide actionable guidance whether we work together or not.</p>
                
                <a href="https://calendly.com/jacobscounsel/estate-planning-consultation" class="cta-button">
                  Claim Your Strategic Session (15 Minutes) →
                </a>
                
                <p><strong>P.S.</strong> - In my 15+ years of practice, I've helped over 500 families protect their legacies and avoid the disasters I described above. I've also seen what happens to families who wait. Don't let yours be one of them.</p>
                
                <p>Protecting what matters most,<br>
                <strong>Drew Jacobs, Esq.</strong></p>
              `
            },
            {
              type: 'final',
              subject: '🚨 FINAL NOTICE: Your Estate Protection Strategy (Action Required)',
              delay_days: 7,
              content: `
                <h1>This Is My Final Personal Invitation, {{first_name}}</h1>
                
                <p>I've been thinking about your family's estate planning situation, and I'm genuinely concerned. It's been a full week since you showed serious interest in protecting your loved ones, but you haven't taken the final step.</p>
                
                <p>I understand completely—estate planning feels overwhelming. The legal complexities, the difficult decisions about death and incapacity, the fear of making costly mistakes. But here's the brutal truth: <strong>doing nothing is the biggest mistake of all.</strong></p>
                
                <div class="highlight-box">
                  <h3>💔 What I See When Families Wait Too Long</h3>
                  <p>Just last month, I consulted with a widow whose husband died without proper planning. Their $2.3 million estate is now:</p>
                  <ul>
                    <li>Locked in probate for at least 18 months</li>
                    <li>Generating over $15,000 in legal fees monthly</li>
                    <li>Causing bitter fights between their three children</li>
                    <li>Exposing the family business to creditors and lawsuits</li>
                    <li>Creating a tax bill that could have been completely avoided</li>
                  </ul>
                  <p><strong>This devastation was 100% preventable</strong> with proper planning that would have cost less than $10,000.</p>
                </div>
                
                <p>I don't want your family to become another tragic story. You contacted me because you're smart enough to know that protection matters. You just need to take the final step.</p>
                
                <div class="highlight-box">
                  <h3>🎯 Your Final Strategic Session Includes</h3>
                  <ol>
                    <li><strong>Immediate Risk Assessment:</strong> I'll identify your family's most urgent vulnerabilities in real-time</li>
                    <li><strong>Priority Action Items:</strong> The 3 most critical steps you must take immediately</li>
                    <li><strong>Investment Clarity:</strong> Transparent, fixed pricing with zero surprises or hidden fees</li>
                    <li><strong>Fast-Track Timeline:</strong> How quickly we can get your protection in place</li>
                    <li><strong>Peace of Mind:</strong> Finally sleep well knowing your family is truly protected</li>
                  </ol>
                </div>
                
                <p><strong>My Personal Commitment to You:</strong> This isn't a high-pressure sales pitch. It's a strategic planning session designed to give you absolute clarity. Even if we don't work together, you'll walk away with insights that could save your family tens of thousands of dollars.</p>
                
                <p>Many clients tell me it's the most valuable 15 minutes they've ever spent—and the decision that gave them complete peace of mind about their family's future.</p>
                
                <a href="https://calendly.com/jacobscounsel/estate-planning-consultation" class="cta-button">
                  Book Your Final Opportunity Session →
                </a>
                
                <p><strong>If estate planning truly isn't a priority right now,</strong> I completely understand. Life gets busy, and sometimes timing isn't right. Simply reply with "PAUSE" and I'll pause these emails until you're ready.</p>
                
                <p>But if your family's security matters to you—if you want to ensure they're protected no matter what life brings—then this is your moment to act decisively.</p>
                
                <p><strong>Important:</strong> My consultation calendar for estate planning closes tomorrow night. After that, the next available appointment isn't for several weeks due to existing client commitments.</p>
                
                <p>Don't let your family become another cautionary tale. Take action today.</p>
                
                <p>To your family's enduring protection and your lasting peace of mind,<br>
                <strong>Drew Jacobs, Esq.</strong><br>
                Your Estate Planning Strategist</p>
              `
            }
          ]
        },
        {
          name: 'Jacobs Counsel - Business Formation Excellence',
          description: 'Strategic business formation sequence with AI-powered entity recommendations and growth-focused legal structure optimization.',
          emails: [
            {
              type: 'welcome',
              subject: '🚀 {{first_name}}, Your Business Protection Foundation Begins Now',
              delay_hours: 0,
              content: `
                <h1>Congratulations on Prioritizing Your Business Future!</h1>
                
                <p>{{first_name}}, you're already ahead of 80% of entrepreneurs who make the critical mistake of skipping proper business formation. By prioritizing legal protection from the start, you're setting yourself up for sustainable success and bulletproof growth.</p>
                
                <div class="highlight-box">
                  <h3>🚀 Your AI-Enhanced Business Analysis Is Live</h3>
                  <p>Our advanced legal intelligence system is already processing your business goals, industry requirements, and growth projections. Within hours, you'll receive personalized recommendations that include:</p>
                  <ul>
                    <li>🛡️ Optimal business entity structure for maximum liability protection in your industry</li>
                    <li>💰 Tax-efficient formation strategies that minimize your annual burden by thousands</li>
                    <li>📈 Scalable legal framework designed to grow with your success</li>
                    <li>🎯 Industry-specific compliance protocols and risk management systems</li>
                    <li>⚖️ Advanced asset protection strategies for your personal wealth</li>
                  </ul>
                </div>
                
                <p><strong>What's Happening Behind the Scenes Right Now:</strong></p>
                <ol>
                  <li>🔍 <strong>Comprehensive Risk Assessment:</strong> Analyzing liability exposure patterns specific to your industry and business model</li>
                  <li>💡 <strong>Tax Optimization Analysis:</strong> Identifying the most tax-efficient structure for your current situation and future goals</li>
                  <li>🛡️ <strong>Asset Protection Design:</strong> Creating frameworks to shield your personal wealth from business risks</li>
                  <li>📊 <strong>Growth Architecture Planning:</strong> Ensuring your structure supports funding rounds, partnerships, and exit strategies</li>
                  <li>⚡ <strong>Compliance Mapping:</strong> Identifying all regulatory requirements to keep you bulletproof from day one</li>
                </ol>
                
                <p><strong>The Hidden Truth About Business Formation:</strong> Most entrepreneurs make catastrophic formation mistakes that haunt them for years. Wrong entity choice, improper tax elections, inadequate operating agreements, missing compliance requirements—these "small" oversights can cost tens of thousands in additional taxes, legal fees, and missed opportunities.</p>
                
                <p>You won't have that problem. Our systematic, AI-enhanced approach ensures you get it right the first time, with a legal foundation that actually accelerates your growth instead of limiting it.</p>
                
                <div class="highlight-box">
                  <h3>🎯 Your Strategic Formation Session Includes</h3>
                  <ol>
                    <li><strong>Entity Structure Optimization:</strong> We'll determine the perfect legal structure for your specific goals</li>
                    <li><strong>Tax Strategy Development:</strong> Advanced planning to minimize your tax burden legally and ethically</li>
                    <li><strong>Asset Protection Framework:</strong> Bulletproof strategies to protect your personal wealth</li>
                    <li><strong>Growth Scalability Planning:</strong> Legal architecture that supports your expansion plans</li>
                    <li><strong>Compliance Roadmap:</strong> Clear guidelines to keep you legally bulletproof</li>
                    <li><strong>Implementation Timeline:</strong> Your step-by-step roadmap to complete business protection</li>
                  </ol>
                </div>
                
                <a href="https://calendly.com/jacobscounsel/business-formation-strategy" class="cta-button">
                  Book Your Business Strategy Session →
                </a>
                
                <p>Ready to build something truly bulletproof? Let's create the legal foundation that turns your vision into an unstoppable reality.</p>
                
                <p>To your business success and protection,<br>
                <strong>Drew Jacobs, Esq.</strong><br>
                Business Formation Strategist<br>
                Jacobs Counsel</p>
              `
            }
          ]
        },
        {
          name: 'Jacobs Counsel - Brand Protection Authority',
          description: 'Comprehensive intellectual property protection sequence with proactive monitoring and strategic trademark guidance.',
          emails: [
            {
              type: 'welcome',
              subject: '™️ {{first_name}}, Your Brand Protection System Is Now Active',
              delay_hours: 0,
              content: `
                <h1>Your Brand Is Now Under Strategic Protection</h1>
                
                <p>{{first_name}}, congratulations on taking proactive steps to protect your most valuable business asset—your brand identity. Most business owners wait until it's too late, when competitors are already copying their success.</p>
                
                <div class="highlight-box">
                  <h3>🛡️ Advanced Brand Intelligence System Activated</h3>
                  <p>Our AI-enhanced intellectual property protection system is already scanning multiple databases and monitoring channels for:</p>
                  <ul>
                    <li>🔍 Existing trademark conflicts and clearance issues that could block your registration</li>
                    <li>⚡ Real-time monitoring for brand infringement attempts across multiple platforms</li>
                    <li>🎯 Strategic filing recommendations for maximum protection at optimal cost</li>
                    <li>🌐 International brand protection opportunities as you expand globally</li>
                    <li>💼 Competitive intelligence on similar brands in your industry</li>
                    <li>⚖️ Enforcement strategies to stop infringers before they damage your brand</li>
                  </ul>
                </div>
                
                <p><strong>Why This Matters More Than You Might Realize:</strong></p>
                <p>Every single day without proper trademark protection, your brand becomes vulnerable to copycats, competitors, and cybersquatters. I've personally seen businesses lose their names, domains, social media handles, and entire brand identities because they waited too long to establish legal protection.</p>
                
                <p>Just last quarter, we helped a client who almost lost their $500K brand because a competitor filed for their trademark first. We were able to save their brand, but it cost them $15,000 in legal fees and six months of uncertainty that could have been completely avoided.</p>
                
                <div class="highlight-box">
                  <h3>🎯 Your Brand Protection Strategy Session Reveals</h3>
                  <ol>
                    <li><strong>Comprehensive Brand Audit:</strong> Complete analysis of your current brand vulnerabilities</li>
                    <li><strong>Strategic Filing Roadmap:</strong> Optimal trademark filing strategy for maximum protection</li>
                    <li><strong>Competitive Analysis:</strong> Intelligence on similar brands and potential conflicts</li>
                    <li><strong>International Strategy:</strong> Global brand protection as you expand</li>
                    <li><strong>Enforcement Protocols:</strong> Systems to monitor and stop brand infringers</li>
                    <li><strong>Investment Planning:</strong> Clear, transparent pricing for comprehensive protection</li>
                  </ol>
                </div>
                
                <p>Don't leave your brand's future to chance. The businesses that thrive long-term are the ones that protect their intellectual property proactively, not reactively.</p>
                
                <a href="https://calendly.com/jacobscounsel/brand-protection-consultation" class="cta-button">
                  Secure Your Brand Strategy Session →
                </a>
                
                <p>Your brand deserves fortress-level protection. Let's build that protection together, strategically and cost-effectively.</p>
                
                <p>Protecting your intellectual property and competitive advantage,<br>
                <strong>Drew Jacobs, Esq.</strong><br>
                Brand Protection Specialist<br>
                Jacobs Counsel</p>
              `
            }
          ]
        }
      ];

      // Create each premium sequence
      for (const sequenceData of premiumSequences) {
        try {
          const sequence = await this.createSequence(sequenceData.name, sequenceData.description);
          results.newSequences.push(sequence);
          
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
      
      log.info('🎉 Taj Mahal built successfully on existing foundation!', {
        existingTags: results.existingTags.length,
        existingForms: results.existingForms.length,
        existingSequences: results.existingSequences.length,
        newSequences: results.newSequences.length,
        newEmails: results.emails.length
      });
      
      return results;
      
    } catch (error) {
      log.error('❌ Taj Mahal construction failed:', error.message);
      throw error;
    }
  }

  // Get comprehensive summary
  getSummary() {
    return {
      existingTags: Array.from(this.existingTags.values()),
      existingForms: Array.from(this.existingForms.values()),
      existingSequences: Array.from(this.existingSequences.values()),
      newSequences: Array.from(this.createdSequences.values()),
      newForms: Array.from(this.createdForms.values())
    };
  }
}

// Main export function
export async function buildTajMahalOnExisting() {
  const builder = new SmartKitBuilder();
  return await builder.buildTajMahalOnExisting();
}

export default SmartKitBuilder;