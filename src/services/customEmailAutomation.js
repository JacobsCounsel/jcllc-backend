// src/services/customEmailAutomation.js - Complete Custom Email Automation System
// Full 25-pathway automation built directly in your backend - no third-party limitations

import { config } from '../config/environment.js';
import { log } from '../utils/logger.js';
import { sendEmail } from './emailService.js';
import db from "../models/database-production.js";
import { legalEmailTemplates, generateLegallyCompliantEmail } from './legallyCompliantEmailTemplates.js';

export class CustomEmailAutomation {
  constructor() {
    this.brandColors = {
      primary: '#1a365d',
      secondary: '#2d4a63',
      accent: '#e2b030',
      text: '#2d3748',
      background: '#f7fafc',
      white: '#ffffff'
    };
    
    // Complete 25-pathway architecture
    this.pathways = this.defineCompletePathways();
  }

  // Define legally compliant email pathways
  defineCompletePathways() {
    return {
      // CLIENT-SPECIFIC NURTURE JOURNEYS - Truly Personalized
      'athlete-vip-sequence': {
        name: 'VIP Athlete Journey',
        trigger: 'athlete-vip-sequence',
        emails: [
          {
            delay: 0, // Immediate
            subject: 'Your Athletic Career Legal Strategy - {{firstName}}',
            template: 'vip_welcome'
          },
          {
            delay: 24 * 60 * 60 * 1000, // 24 hours
            subject: 'Protecting Athletic Career Value',
            template: 'athlete_email_2'
          },
          {
            delay: 3 * 24 * 60 * 60 * 1000, // 3 days
            subject: 'Building Your Athletic Legacy',
            template: 'athlete_email_3'
          },
          {
            delay: 7 * 24 * 60 * 60 * 1000, // 7 days
            subject: 'Secure Your Championship Legacy - {{firstName}}',
            template: 'consultation_reminder'
          }
        ]
      },
      
      'creator-vip-sequence': {
        name: 'VIP Creator Journey',
        trigger: 'creator-vip-sequence',
        emails: [
          {
            delay: 0, // Immediate
            subject: 'Protect Your Creator Business - {{firstName}}',
            template: 'vip_welcome'
          },
          {
            delay: 24 * 60 * 60 * 1000, // 24 hours
            subject: 'Your Content Has Real Business Value',
            template: 'creator_email_2'
          },
          {
            delay: 3 * 24 * 60 * 60 * 1000, // 3 days
            subject: 'Scale Your Creator Business Strategically',
            template: 'creator_email_3'
          },
          {
            delay: 7 * 24 * 60 * 60 * 1000, // 7 days
            subject: 'Bulletproof Your Creator Empire - {{firstName}}',
            template: 'consultation_reminder'
          }
        ]
      },
      
      'startup-vip-sequence': {
        name: 'VIP Startup Journey',
        trigger: 'startup-vip-sequence',
        emails: [
          {
            delay: 0, // Immediate
            subject: 'Legal Foundation for Scaling - {{firstName}}',
            template: 'vip_welcome'
          },
          {
            delay: 24 * 60 * 60 * 1000, // 24 hours
            subject: 'Legal Foundation = Investment Readiness',
            template: 'startup_email_2'
          },
          {
            delay: 3 * 24 * 60 * 60 * 1000, // 3 days
            subject: 'From Startup to Scalable Company',
            template: 'startup_email_3'
          },
          {
            delay: 7 * 24 * 60 * 60 * 1000, // 7 days
            subject: 'Make Your Startup Investor-Ready - {{firstName}}',
            template: 'consultation_reminder'
          }
        ]
      },
      
      'family-vip-sequence': {
        name: 'VIP Family Wealth Journey',
        trigger: 'family-vip-sequence',
        emails: [
          {
            delay: 0, // Immediate
            subject: 'Multi-Generational Planning - {{firstName}}',
            template: 'vip_welcome'
          },
          {
            delay: 24 * 60 * 60 * 1000, // 24 hours
            subject: 'Generational Wealth Architecture',
            template: 'family_email_2'
          },
          {
            delay: 3 * 24 * 60 * 60 * 1000, // 3 days
            subject: 'Family Legacy Strategy',
            template: 'family_email_3'
          },
          {
            delay: 7 * 24 * 60 * 60 * 1000, // 7 days
            subject: 'Build Your Legacy Architecture - {{firstName}}',
            template: 'consultation_reminder'
          }
        ]
      },
      
      // Generic VIP for business owners
      'trigger-vip-sequence': {
        name: 'VIP Legal Strategy Journey',
        trigger: 'trigger-vip-sequence',
        emails: [
          {
            delay: 0, // Immediate
            subject: 'Welcome to Jacobs Counsel - {{firstName}}',
            template: 'vip_welcome'
          },
          {
            delay: 4 * 60 * 60 * 1000, // 4 hours
            subject: 'Preparing for Your Legal Consultation',
            template: 'vip_strategy'
          },
          {
            delay: 24 * 60 * 60 * 1000, // 24 hours
            subject: 'Educational Resources for Your Review',
            template: 'legal_education_general'
          },
          {
            delay: 3 * 24 * 60 * 60 * 1000, // 3 days
            subject: 'Schedule Your Consultation - {{firstName}}',
            template: 'consultation_reminder'
          }
        ]
      },
      
      'trigger-premium-nurture': {
        name: 'Premium Legal Education Journey',
        trigger: 'trigger-premium-nurture',
        emails: [
          {
            delay: 0,
            subject: 'Welcome to Jacobs Counsel - {{firstName}}',
            template: 'premium_welcome'
          },
          {
            delay: 24 * 60 * 60 * 1000, // 1 day
            subject: 'Understanding Legal Strategy Basics',
            template: 'legal_education_general'
          },
          {
            delay: 3 * 24 * 60 * 60 * 1000, // 3 days
            subject: 'Educational Resources for Your Review',
            template: 'legal_resources'
          },
          {
            delay: 7 * 24 * 60 * 60 * 1000, // 7 days
            subject: 'Schedule Your Consultation - {{firstName}}',
            template: 'consultation_reminder'
          }
        ]
      },
      
      'trigger-standard-nurture': {
        name: 'General Legal Education Series',
        trigger: 'trigger-standard-nurture',
        emails: [
          {
            delay: 0,
            subject: 'Thank You for Your Interest - {{firstName}}',
            template: 'standard_welcome'
          },
          {
            delay: 2 * 24 * 60 * 60 * 1000, // 2 days
            subject: 'Understanding Legal Strategy Basics',
            template: 'legal_education_general'
          },
          {
            delay: 7 * 24 * 60 * 60 * 1000, // 7 days
            subject: 'Schedule Your Consultation - {{firstName}}',
            template: 'consultation_reminder'
          }
        ]
      },
      
      // SERVICE-SPECIFIC EDUCATIONAL JOURNEYS
      'intake-estate-intake': {
        name: 'Estate Planning Educational Series',
        trigger: 'intake-estate-intake',
        emails: [
          {
            delay: 0,
            subject: 'Estate Planning Intake Received - {{firstName}}',
            template: 'estate_intake_confirmation'
          },
          {
            delay: 24 * 60 * 60 * 1000,
            subject: 'Understanding Estate Planning Basics',
            template: 'estate_planning_education'
          },
          {
            delay: 3 * 24 * 60 * 60 * 1000,
            subject: 'Schedule Your Estate Planning Consultation',
            template: 'estate_consultation_reminder'
          }
        ]
      },

      'intake-business-formation': {
        name: 'Business Formation Educational Series',
        trigger: 'intake-business-formation',
        emails: [
          {
            delay: 0,
            subject: 'Business Formation Inquiry Received - {{firstName}}',
            template: 'business_intake_confirmation'
          },
          {
            delay: 24 * 60 * 60 * 1000,
            subject: 'Business Formation Considerations',
            template: 'business_formation_education'
          },
          {
            delay: 3 * 24 * 60 * 60 * 1000,
            subject: 'Schedule Your Business Formation Consultation',
            template: 'business_consultation_reminder'
          }
        ]
      },

      'intake-brand-protection': {
        name: 'Brand Protection Educational Series',
        trigger: 'intake-brand-protection',
        emails: [
          {
            delay: 0,
            subject: 'Brand Protection Inquiry Received - {{firstName}}',
            template: 'brand_intake_confirmation'
          },
          {
            delay: 24 * 60 * 60 * 1000,
            subject: 'Understanding Brand Protection',
            template: 'brand_protection_education'
          },
          {
            delay: 3 * 24 * 60 * 60 * 1000,
            subject: 'Schedule Your Brand Protection Consultation',
            template: 'brand_consultation_reminder'
          }
        ]
      },

      // LEGAL STRATEGY BUILDER PATHWAY
      'intake-legal-strategy-builder': {
        name: 'Legal Strategy Builder Assessment Series',
        trigger: 'intake-legal-strategy-builder',
        emails: [
          {
            delay: 0,
            subject: 'Your Strategic Legal Assessment Results - {{firstName}}',
            template: 'legal_strategy_builder_welcome'
          },
          {
            delay: 24 * 60 * 60 * 1000, // 1 day
            subject: 'Strategic Legal Implementation: Next Steps',
            template: 'legal_strategy_builder_followup'
          },
          {
            delay: 3 * 24 * 60 * 60 * 1000, // 3 days
            subject: 'Schedule Your Strategy Session - {{firstName}}',
            template: 'consultation_reminder'
          }
        ]
      },

      // NEWSLETTER PATHWAY
      'intake-newsletter': {
        name: 'Newsletter Subscriber Welcome Series',
        trigger: 'intake-newsletter',
        emails: [
          {
            delay: 0,
            subject: 'Welcome to Strategic Legal Insights - {{firstName}}',
            template: 'newsletter_welcome'
          },
          {
            delay: 7 * 24 * 60 * 60 * 1000, // 1 week
            subject: 'Strategic Legal Planning Fundamentals',
            template: 'legal_education_general'
          },
          {
            delay: 14 * 24 * 60 * 60 * 1000, // 2 weeks
            subject: 'Schedule a Strategic Consultation - {{firstName}}',
            template: 'consultation_reminder'
          }
        ]
      },

      // OUTSIDE COUNSEL PATHWAY
      'intake-outside-counsel': {
        name: 'Outside Counsel Educational Series',
        trigger: 'intake-outside-counsel',
        emails: [
          {
            delay: 0,
            subject: 'Outside Counsel Inquiry Received - {{firstName}}',
            template: 'outside_counsel_welcome'
          },
          {
            delay: 24 * 60 * 60 * 1000, // 1 day
            subject: 'Strategic Legal Counsel Framework',
            template: 'legal_education_general'
          },
          {
            delay: 3 * 24 * 60 * 60 * 1000, // 3 days
            subject: 'Schedule Your Outside Counsel Discussion',
            template: 'consultation_reminder'
          }
        ]
      },

      // RESOURCE GUIDE PATHWAY
      'intake-resource-guide': {
        name: 'Resource Guide Download Series',
        trigger: 'intake-resource-guide',
        emails: [
          {
            delay: 0,
            subject: 'Your Strategic Legal Resource Guide - {{firstName}}',
            template: 'resource_guide_welcome'
          },
          {
            delay: 3 * 24 * 60 * 60 * 1000, // 3 days
            subject: 'Implementing Strategic Legal Resources',
            template: 'legal_education_general'
          },
          {
            delay: 7 * 24 * 60 * 60 * 1000, // 1 week
            subject: 'Schedule Implementation Discussion - {{firstName}}',
            template: 'consultation_reminder'
          }
        ]
      },

      // BUSINESS GUIDE DOWNLOAD PATHWAY
      'intake-business-guide-download': {
        name: 'Business Legal Guide Download Series',
        trigger: 'intake-business-guide-download',
        emails: [
          {
            delay: 0,
            subject: 'Your Business Legal Planning Guide - {{firstName}}',
            template: 'business_guide_welcome'
          },
          {
            delay: 24 * 60 * 60 * 1000, // 1 day
            subject: 'Advanced Business Legal Strategy',
            template: 'business_formation_education'
          },
          {
            delay: 3 * 24 * 60 * 60 * 1000, // 3 days
            subject: 'Schedule Your Business Strategy Discussion',
            template: 'consultation_reminder'
          }
        ]
      },

      // BRAND GUIDE DOWNLOAD PATHWAY
      'intake-brand-guide-download': {
        name: 'Brand Protection Guide Download Series',
        trigger: 'intake-brand-guide-download',
        emails: [
          {
            delay: 0,
            subject: 'Your Brand Protection Strategy Guide - {{firstName}}',
            template: 'brand_guide_welcome'
          },
          {
            delay: 24 * 60 * 60 * 1000, // 1 day
            subject: 'Advanced Brand Protection Strategies',
            template: 'brand_protection_education'
          },
          {
            delay: 3 * 24 * 60 * 60 * 1000, // 3 days
            subject: 'Schedule Your Brand Strategy Discussion',
            template: 'consultation_reminder'
          }
        ]
      },

      // ESTATE GUIDE DOWNLOAD PATHWAY
      'intake-estate-guide-download': {
        name: 'Estate Planning Guide Download Series',
        trigger: 'intake-estate-guide-download',
        emails: [
          {
            delay: 0,
            subject: 'Your Estate Planning Strategy Guide - {{firstName}}',
            template: 'estate_guide_welcome'
          },
          {
            delay: 24 * 60 * 60 * 1000, // 1 day
            subject: 'Advanced Estate Planning Strategies',
            template: 'estate_planning_education'
          },
          {
            delay: 3 * 24 * 60 * 60 * 1000, // 3 days
            subject: 'Schedule Your Estate Strategy Consultation',
            template: 'consultation_reminder'
          }
        ]
      },

      // GENERAL SUBSCRIBER PATHWAY
      'intake-add-subscriber': {
        name: 'General Subscriber Welcome Series',
        trigger: 'intake-add-subscriber',
        emails: [
          {
            delay: 0,
            subject: 'Welcome to Jacobs Counsel - {{firstName}}',
            template: 'standard_welcome'
          },
          {
            delay: 2 * 24 * 60 * 60 * 1000, // 2 days
            subject: 'Understanding Strategic Legal Planning',
            template: 'legal_education_general'
          },
          {
            delay: 7 * 24 * 60 * 60 * 1000, // 1 week
            subject: 'Schedule Your Legal Strategy Consultation',
            template: 'consultation_reminder'
          }
        ]
      },

      // POST-CONSULTATION FOLLOW-UP SEQUENCES - CUSTOMER EXPERIENCE ENHANCEMENT
      'post-consultation-general': {
        name: 'Post-Consultation General Follow-up',
        trigger: 'post-consultation-general',
        emails: [
          {
            delay: 0,
            subject: 'Thank You for Your Consultation - {{firstName}}',
            template: 'post_consultation_thank_you'
          },
          {
            delay: 7 * 24 * 60 * 60 * 1000, // 1 week
            subject: 'Strategic Legal Planning: Your Next Steps',
            template: 'strategic_follow_up'
          },
          {
            delay: 21 * 24 * 60 * 60 * 1000, // 3 weeks
            subject: 'Legal Updates and Strategic Opportunities',
            template: 'lead_reengagement'
          }
        ]
      },

      'post-consultation-estate': {
        name: 'Post-Consultation Estate Planning Follow-up',
        trigger: 'post-consultation-estate',
        emails: [
          {
            delay: 0,
            subject: 'Thank You for Your Estate Planning Consultation',
            template: 'post_consultation_thank_you'
          },
          {
            delay: 5 * 24 * 60 * 60 * 1000, // 5 days
            subject: 'Estate Planning Implementation: Next Steps',
            template: 'strategic_follow_up'
          },
          {
            delay: 14 * 24 * 60 * 60 * 1000, // 2 weeks
            subject: 'Strategic Estate Planning Updates',
            template: 'lead_reengagement'
          }
        ]
      },

      'post-consultation-business': {
        name: 'Post-Consultation Business Formation Follow-up',
        trigger: 'post-consultation-business', 
        emails: [
          {
            delay: 0,
            subject: 'Thank You for Your Business Strategy Consultation',
            template: 'post_consultation_thank_you'
          },
          {
            delay: 3 * 24 * 60 * 60 * 1000, // 3 days
            subject: 'Business Legal Strategy: Next Steps',
            template: 'strategic_follow_up'
          },
          {
            delay: 10 * 24 * 60 * 60 * 1000, // 10 days
            subject: 'Business Legal Updates and Opportunities',
            template: 'lead_reengagement'
          }
        ]
      },

      'post-consultation-brand': {
        name: 'Post-Consultation Brand Protection Follow-up',
        trigger: 'post-consultation-brand',
        emails: [
          {
            delay: 0,
            subject: 'Thank You for Your Brand Strategy Consultation',
            template: 'post_consultation_thank_you'
          },
          {
            delay: 4 * 24 * 60 * 60 * 1000, // 4 days
            subject: 'Brand Protection Strategy: Next Steps',
            template: 'strategic_follow_up'
          },
          {
            delay: 12 * 24 * 60 * 60 * 1000, // 12 days
            subject: 'Brand Protection Updates and Strategic Opportunities',
            template: 'lead_reengagement'
          }
        ]
      },

      'post-consultation-counsel': {
        name: 'Post-Consultation Outside Counsel Follow-up',
        trigger: 'post-consultation-counsel',
        emails: [
          {
            delay: 0,
            subject: 'Thank You for Your Strategic Counsel Discussion',
            template: 'post_consultation_thank_you'
          },
          {
            delay: 2 * 24 * 60 * 60 * 1000, // 2 days
            subject: 'Outside Counsel Strategy: Next Steps',
            template: 'strategic_follow_up'
          },
          {
            delay: 8 * 24 * 60 * 60 * 1000, // 8 days
            subject: 'Strategic Legal Counsel Updates',
            template: 'lead_reengagement'
          }
        ]
      },

      'post-consultation-vip': {
        name: 'Post-Consultation VIP Strategic Follow-up',
        trigger: 'post-consultation-vip',
        emails: [
          {
            delay: 0,
            subject: 'Thank You for Your VIP Strategic Consultation',
            template: 'post_consultation_thank_you'
          },
          {
            delay: 24 * 60 * 60 * 1000, // 1 day
            subject: 'VIP Strategic Implementation: Next Steps',
            template: 'strategic_follow_up'
          },
          {
            delay: 7 * 24 * 60 * 60 * 1000, // 1 week
            subject: 'Exclusive Strategic Legal Updates',
            template: 'lead_reengagement'
          }
        ]
      },

      // LEAD RE-ENGAGEMENT SEQUENCES
      'lead-reengagement-30-day': {
        name: '30-Day Lead Re-engagement',
        trigger: 'lead-reengagement-30-day',
        emails: [
          {
            delay: 0,
            subject: 'Strategic Legal Updates - {{firstName}}',
            template: 'lead_reengagement'
          },
          {
            delay: 14 * 24 * 60 * 60 * 1000, // 2 weeks
            subject: 'New Legal Opportunities for Strategic Planning',
            template: 'legal_education_general'
          },
          {
            delay: 28 * 24 * 60 * 60 * 1000, // 4 weeks
            subject: 'Ready to Discuss Your Legal Strategy?',
            template: 'consultation_reminder'
          }
        ]
      },

      'lead-reengagement-90-day': {
        name: '90-Day Lead Re-engagement',
        trigger: 'lead-reengagement-90-day',
        emails: [
          {
            delay: 0,
            subject: 'Important Legal Updates - {{firstName}}', 
            template: 'lead_reengagement'
          },
          {
            delay: 21 * 24 * 60 * 60 * 1000, // 3 weeks
            subject: 'Strategic Legal Planning Refresh',
            template: 'consultation_reminder'
          }
        ]
      }
      
      // Complete customer journey now includes pre-consultation, consultation booking, and post-consultation workflows
    };
  }

  // Generate legally compliant email HTML template
  generateEmailHTML(templateType, content, firstName = 'Valued Client', additionalData = {}) {
    // Use the legally compliant email generator with dynamic data
    return generateLegallyCompliantEmail(templateType, firstName, additionalData);
  }

  // DEPRECATED - keeping for compatibility but using new system
  _oldGenerateEmailHTML(templateType, content, firstName = 'Valued Client') {
    const { colors } = this.brandColors;
    
    const personalizedContent = content.replace(/\{\{firstName\}\}/g, firstName);
    
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
      ${personalizedContent}
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

  // Get legally compliant email content for template  
  getEmailContent(templateType, firstName = 'Valued Client') {
    // Return the template type - the legal template system will handle the content
    return legalEmailTemplates[templateType] || legalEmailTemplates.standard_welcome;
  }

  // DEPRECATED - keeping for compatibility
  _oldGetEmailContent(templateType, firstName = 'Valued Client') {
    const templates = {
      vip_welcome: `
        <h1>Welcome to Your VIP Legal Experience!</h1>
        
        <p>{{firstName}}, thank you for trusting Jacobs Counsel with your most important legal needs. You've just taken the most critical step toward protecting what matters most to you.</p>
        
        <div class="highlight-box">
          <h3>🛡️ What Makes Our Approach Revolutionary</h3>
          <p>Our advanced AI-enhanced legal analysis has already begun processing your unique situation. Within the next 24 hours, you'll receive personalized recommendations that traditional attorneys often miss—strategies that could save you thousands in taxes and prevent costly legal disputes.</p>
        </div>
        
        <p><strong>Your Immediate Action Plan:</strong></p>
        <ol>
          <li>📋 <strong>Complete Assessment</strong> - Finish your personalized legal questionnaire</li>
          <li>📞 <strong>Strategic Consultation</strong> - Book your complimentary 15-minute strategy session</li>
          <li>🎯 <strong>Custom Blueprint</strong> - Receive your tailored protection roadmap</li>
        </ol>
        
        <p>I personally review every VIP client situation. Your success deserves nothing less than premium, personalized attention.</p>
        
        <a href="https://calendly.com/jacobscounsel/vip-consultation" class="cta-button">
          Book Your VIP Consultation →
        </a>
        
        <p>Questions about your legal strategy? Simply reply to this email—I read every VIP response personally.</p>
        
        <p>To your continued success,<br>
        <strong>Drew Jacobs, Esq.</strong><br>
        Founder & Managing Attorney<br>
        Jacobs Counsel</p>
      `,
      
      vip_strategy: `
        <h1>Your Personal Legal Strategy Session Awaits</h1>
        
        <p>{{firstName}}, I've been reviewing your information and I'm excited about the strategic opportunities I see for your situation.</p>
        
        <div class="highlight-box">
          <h3>⚡ Why This Session Matters</h3>
          <p>Most high-performers wait until they face legal problems to seek counsel. You're different. You understand that offensive legal strategy prevents problems before they happen and creates competitive advantages others miss.</p>
        </div>
        
        <p><strong>In your VIP strategy session, we'll cover:</strong></p>
        <ul>
          <li>🔍 Immediate vulnerability assessment for your specific situation</li>
          <li>💡 Strategic opportunities you may not have considered</li>
          <li>🎯 Priority action items for maximum protection and advantage</li>
          <li>📊 Clear roadmap with transparent pricing and timelines</li>
        </ul>
        
        <p>This isn't a sales call. It's a strategic planning session designed to give you clarity and actionable next steps.</p>
        
        <a href="https://calendly.com/jacobscounsel/vip-consultation" class="cta-button">
          Schedule Your Strategy Session →
        </a>
        
        <p>Your success is my priority.</p>
        
        <p><strong>Drew Jacobs, Esq.</strong></p>
      `,
      
      premium_welcome: `
        <h1>Welcome to Premium Legal Protection</h1>
        
        <p>{{firstName}}, congratulations on prioritizing your legal protection. You're ahead of 90% of high-performers who wait until problems arise to seek strategic legal counsel.</p>
        
        <div class="highlight-box">
          <h3>🚀 Your Premium Analysis Is Underway</h3>
          <p>Our advanced legal intelligence system is already analyzing your situation and developing personalized strategies for maximum protection and advantage.</p>
        </div>
        
        <p>Over the next few days, you'll receive strategic insights that will help you understand exactly how to build an offensive legal foundation that protects and advances your interests.</p>
        
        <a href="https://calendly.com/jacobscounsel/strategic-consultation" class="cta-button">
          Book Your Strategic Consultation →
        </a>
        
        <p>To your legal advantage,<br>
        <strong>Drew Jacobs, Esq.</strong></p>
      `
      
      // Additional templates would be added here for all pathways
    };
    
    return templates[templateType] || templates.vip_welcome;
  }

  // Process lead through automation system
  async processLeadAutomation(email, firstName, lastName, leadScore, submissionType, clientProfile = null) {
    try {
      log.info('🚀 Processing custom email automation', {
        email,
        score: leadScore.score,
        type: submissionType
      });

      // Determine pathway based on score, submission type, and client profile
      const pathway = this.determinePathway(leadScore.score, submissionType, clientProfile);
      
      if (!pathway) {
        throw new Error('No pathway determined for lead');
      }

      // Create automation record in database
      const automationId = await this.createAutomationRecord(email, pathway.name, pathway.trigger);

      // Schedule all emails in the sequence with optimized timing
      let emailsScheduled = 0;
      for (const emailConfig of pathway.emails) {
        await this.scheduleEmail(
          automationId,
          email,
          firstName,
          lastName,
          emailConfig,
          pathway.trigger,
          leadScore.score  // Pass lead score for timing optimization
        );
        emailsScheduled++;
      }

      log.info('✅ Custom email automation created', {
        email,
        pathway: pathway.name,
        emailsScheduled
      });

      return {
        success: true,
        automation_id: automationId,
        pathway: pathway.name,
        emails_scheduled: emailsScheduled
      };

    } catch (error) {
      log.error('❌ Custom email automation failed:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Determine pathway based on lead score and submission type
  determinePathway(score, submissionType, clientProfile = null) {
    // CLIENT-SPECIFIC VIP SEQUENCES (score 70+)
    if (score >= 70) {
      if (clientProfile === 'athlete') {
        return this.pathways['athlete-vip-sequence'];
      }
      if (clientProfile === 'creator') {
        return this.pathways['creator-vip-sequence'];
      }
      if (clientProfile === 'startup') {
        return this.pathways['startup-vip-sequence'];
      }
      if (clientProfile === 'high_performing_family') {
        return this.pathways['family-vip-sequence'];
      }
      // Fallback to generic VIP
      return this.pathways['trigger-vip-sequence'];
    }
    
    // Premium pathway (score 50-69) 
    if (score >= 50) {
      return this.pathways['trigger-premium-nurture'];
    }
    
    // Service-specific pathways
    if (submissionType && this.pathways[`intake-${submissionType}`]) {
      return this.pathways[`intake-${submissionType}`];
    }
    
    // Default to standard nurture
    return this.pathways['trigger-standard-nurture'];
  }

  // Create automation record in database
  async createAutomationRecord(email, pathwayName, trigger) {
    const stmt = db.prepare(`
      INSERT INTO email_automations (email, pathway_name, trigger_type, status, created_at)
      VALUES (?, ?, ?, 'active', datetime('now'))
    `);
    
    const result = stmt.run(email, pathwayName, trigger);
    return result.lastInsertRowid;
  }

  // Schedule individual email with lead score optimization
  async scheduleEmail(automationId, email, firstName, lastName, emailConfig, trigger, leadScore = 50) {
    // CUSTOMER EXPERIENCE ENHANCEMENT: Optimize timing based on lead score
    let optimizedDelay = emailConfig.delay;
    
    if (leadScore >= 90) {
      // Ultra high-value leads: 25% faster delivery
      optimizedDelay = Math.floor(emailConfig.delay * 0.75);
    } else if (leadScore >= 70) {
      // High-value leads: 15% faster delivery  
      optimizedDelay = Math.floor(emailConfig.delay * 0.85);
    } else if (leadScore >= 50) {
      // Medium-value leads: standard timing
      optimizedDelay = emailConfig.delay;
    } else {
      // Lower-value leads: 20% slower (less aggressive)
      optimizedDelay = Math.floor(emailConfig.delay * 1.2);
    }
    
    // Ensure immediate emails remain immediate
    if (emailConfig.delay === 0) {
      optimizedDelay = 0;
    }
    
    const sendAt = new Date(Date.now() + optimizedDelay);
    
    const stmt = db.prepare(`
      INSERT INTO scheduled_emails (
        automation_id, email, first_name, last_name, 
        subject, template_type, trigger_type, send_at, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending')
    `);
    
    stmt.run(
      automationId,
      email,
      firstName,
      lastName,
      emailConfig.subject,
      emailConfig.template,
      trigger,
      sendAt.toISOString()
    );
    
    log.info('📧 Email scheduled with optimized timing', {
      email,
      template: emailConfig.template,
      leadScore,
      originalDelay: emailConfig.delay,
      optimizedDelay,
      sendAt: sendAt.toISOString()
    });
  }

  // Process scheduled emails (called by cron job)
  async processScheduledEmails() {
    const stmt = db.prepare(`
      SELECT 
        se.*,
        ea.trigger_type,
        l.submission_type
      FROM scheduled_emails se
      JOIN email_automations ea ON se.automation_id = ea.id
      LEFT JOIN leads l ON ea.email = l.email
      WHERE se.status = 'pending' AND se.send_at <= datetime('now')
      ORDER BY se.send_at ASC
      LIMIT 50
    `);
    
    const emails = stmt.all();
    let processed = 0;

    for (const emailRecord of emails) {
      try {
        // Generate email content with dynamic data
        const content = this.getEmailContent(emailRecord.template_type, emailRecord.first_name);
        const additionalData = {
          submissionType: emailRecord.submission_type || emailRecord.trigger_type
        };
        const html = this.generateEmailHTML(emailRecord.template_type, content, emailRecord.first_name, additionalData);
        
        // Send email
        await sendEmail(
          emailRecord.email,
          emailRecord.subject.replace('{{firstName}}', emailRecord.first_name),
          html
        );

        // Mark as sent
        const updateStmt = db.prepare(`
          UPDATE scheduled_emails 
          SET status = 'sent', sent_at = datetime('now') 
          WHERE id = ?
        `);
        updateStmt.run(emailRecord.id);

        processed++;
        log.info('✅ Automation email sent', { 
          email: emailRecord.email,
          subject: emailRecord.subject 
        });

      } catch (error) {
        log.error('❌ Automation email failed:', { 
          email: emailRecord.email,
          error: error.message 
        });
        
        // Mark as failed
        const updateStmt = db.prepare(`
          UPDATE scheduled_emails 
          SET status = 'failed', error_message = ? 
          WHERE id = ?
        `);
        updateStmt.run(error.message, emailRecord.id);
      }
    }

    if (processed > 0) {
      log.info(`📧 Processed ${processed} automation emails`);
    }

    return processed;
  }
}

// Main export function for backend integration
export async function processCustomEmailAutomation(formData, leadScore, submissionType) {
  try {
    const automation = new CustomEmailAutomation();
    const firstName = formData.firstName || formData.fullName?.split(' ')[0] || '';
    const lastName = formData.lastName || formData.fullName?.split(' ')[1] || '';
    
    // Detect client profile from form data
    const clientProfile = detectClientProfile(formData, submissionType);
    
    return await automation.processLeadAutomation(
      formData.email,
      firstName,
      lastName,
      leadScore,
      submissionType,
      clientProfile
    );
  } catch (error) {
    log.error('Custom email automation failed:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

// Helper function to detect client profile
function detectClientProfile(formData, submissionType) {
  // Detect athletes
  if (formData.profession === 'athlete' || 
      formData.careerType === 'professional_athlete' || 
      formData.industry === 'sports') {
    return 'athlete';
  }
  
  // Detect creators (high social following or content business)
  const socialFollowing = parseInt(formData.socialFollowing?.replace(/[,]/g, '') || '0');
  const businessRevenue = parseInt(formData.businessRevenue?.replace(/[,]/g, '') || '0');
  
  if (socialFollowing > 100000 || 
      businessRevenue > 500000 || 
      formData.businessType === 'creator' ||
      formData.revenueStreams?.includes('brand_partnerships')) {
    return 'creator';
  }
  
  // Detect startups (VC funding, high growth goals)
  if (submissionType === 'business-formation' &&
      (formData.investmentPlan === 'vc' || 
       formData.investmentPlan === 'angel' ||
       formData.businessGoal === 'startup')) {
    return 'startup';
  }
  
  // Detect high-performing families (high estate values)
  if (submissionType === 'estate-intake') {
    const grossEstate = parseFloat(formData.grossEstate?.replace(/[,$]/g, '') || '0');
    if (grossEstate > 1000000) {
      return 'high_performing_family';
    }
  }
  
  return null;
}

// Email processor function (for cron job)
export async function processScheduledEmails() {
  const automation = new CustomEmailAutomation();
  return await automation.processScheduledEmails();
}

export default CustomEmailAutomation;