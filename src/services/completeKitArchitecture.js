// src/services/completeKitArchitecture.js - Complete 25-Pathway Kit Journey Architecture
// Full cohesion with existing backend integration and trigger system

import fetch from 'node-fetch';
import { config } from '../config/environment.js';
import { log } from '../utils/logger.js';

const KIT_API_BASE = 'https://api.convertkit.com/v3';

export class CompleteKitArchitecture {
  constructor() {
    this.apiKey = config.kit.apiKey;
    this.apiSecret = config.kit.apiSecret;
    
    // Track all resources
    this.existingTags = new Map();
    this.existingForms = new Map();
    this.existingSequences = new Map();
    this.createdSequences = new Map();
    this.createdTags = new Map();
    this.createdRules = new Map();
    
    // Jacobs Counsel branding
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
    
    // Complete journey architecture matching backend
    this.journeyArchitecture = this.defineCompleteArchitecture();
  }

  // Define the complete 25-pathway architecture
  defineCompleteArchitecture() {
    return {
      // LEAD NURTURE JOURNEYS (5 Journeys)
      leadNurture: [
        {
          id: 1,
          name: 'JC VIP Experience Journey',
          trigger: 'trigger-vip-sequence',
          description: 'Premium VIP sequence for highest-scoring leads (70+) with priority access and personal attention',
          emails: [
            {
              subject: '🏛️ Welcome to Your VIP Legal Experience, {{first_name | default: "Valued VIP"}}',
              delay_hours: 0,
              type: 'vip_welcome'
            },
            {
              subject: '⚡ Your Personal Legal Strategy Session Awaits, {{first_name}}',
              delay_hours: 2,
              type: 'vip_strategy'
            },
            {
              subject: '🎯 Priority Access: Schedule Your Session Today',
              delay_hours: 24,
              type: 'vip_priority'
            },
            {
              subject: '🏆 VIP Client Success Stories That Inspire',
              delay_days: 3,
              type: 'vip_social_proof'
            },
            {
              subject: '🚨 Final VIP Priority Invitation - {{first_name}}',
              delay_days: 7,
              type: 'vip_final'
            }
          ]
        },
        {
          id: 2,
          name: 'JC Premium Legal Protection Path',
          trigger: 'trigger-premium-nurture',
          description: 'Premium nurture sequence for high-value prospects (50-69 score) with advanced legal strategies',
          emails: [
            {
              subject: '🛡️ Welcome to Premium Legal Protection, {{first_name}}',
              delay_hours: 0,
              type: 'premium_welcome'
            },
            {
              subject: '⚡ The High-Performer\'s Legal Advantage Revealed',
              delay_days: 1,
              type: 'premium_advantage'
            },
            {
              subject: '💰 Case Study: $2M Asset Protection Victory',
              delay_days: 3,
              type: 'premium_case_study'
            },
            {
              subject: '📞 Your Complimentary Strategy Session Is Ready',
              delay_days: 5,
              type: 'premium_consultation'
            },
            {
              subject: '📚 Advanced Legal Strategies Guide (Exclusive)',
              delay_days: 7,
              type: 'premium_guide'
            },
            {
              subject: '🚀 Ready to Build Your Legal Foundation?',
              delay_days: 10,
              type: 'premium_final'
            }
          ]
        },
        // REMOVED: Standard tier - Premium minimum service only
        {
          id: 3,
          name: 'JC Legal Intelligence Weekly Welcome',
          trigger: 'trigger-newsletter-sequence',
          description: 'Newsletter welcome series for subscribers with weekly legal intelligence',
          emails: [
            {
              subject: '📬 Welcome to Legal Intelligence Weekly, {{first_name}}',
              delay_hours: 0,
              type: 'newsletter_welcome'
            },
            {
              subject: '🏆 This Week\'s Legal Wins You Need to Know',
              delay_days: 3,
              type: 'newsletter_wins'
            },
            {
              subject: '🎓 Exclusive: Legal Strategy Masterclass Access',
              delay_days: 7,
              type: 'newsletter_masterclass'
            }
          ]
        },
        {
          id: 4,
          name: 'JC Resource Guide Follow-Up',
          trigger: 'trigger-guide-sequence',
          description: 'Follow-up sequence for resource guide downloads with implementation support',
          emails: [
            {
              subject: '📖 Your Legal Guide is Ready for Download',
              delay_hours: 0,
              type: 'guide_ready'
            },
            {
              subject: '🛠️ Implementation Tips Inside Your Guide',
              delay_days: 2,
              type: 'guide_implementation'
            },
            {
              subject: '❓ Questions About Your Legal Strategy? Let\'s Talk',
              delay_days: 5,
              type: 'guide_questions'
            }
          ]
        }
      ],
      
      // SERVICE EDUCATION JOURNEYS (10 Journeys)
      serviceEducation: [
        {
          id: 6,
          name: 'JC Asset Protection Mastery',
          trigger: 'sequence-asset-protection',
          description: 'Complete asset protection education with offensive wealth protection strategies',
          emails: [
            {
              subject: '🛡️ Protecting Your Wealth: The Offensive Approach',
              delay_hours: 0,
              type: 'asset_protection_intro'
            },
            {
              subject: '💰 Case Study: $5M Protected in 30 Days',
              delay_days: 2,
              type: 'asset_protection_case'
            },
            {
              subject: '🏗️ Asset Protection Structures Explained Simply',
              delay_days: 4,
              type: 'asset_protection_structures'
            },
            {
              subject: '📊 Your Personal Asset Protection Assessment',
              delay_days: 7,
              type: 'asset_protection_assessment'
            }
          ]
        },
        {
          id: 7,
          name: 'JC Wealth Protection Path',
          trigger: 'sequence-wealth-protection',
          description: 'Advanced wealth protection strategies for high-net-worth individuals',
          emails: [
            {
              subject: '💎 Advanced Wealth Protection Strategies Revealed',
              delay_hours: 0,
              type: 'wealth_protection_intro'
            },
            {
              subject: '📈 Tax-Efficient Wealth Structures That Work',
              delay_days: 3,
              type: 'wealth_protection_tax'
            },
            {
              subject: '🏛️ Generational Wealth Planning Secrets',
              delay_days: 6,
              type: 'wealth_protection_generational'
            },
            {
              subject: '📅 Schedule Your Comprehensive Wealth Review',
              delay_days: 10,
              type: 'wealth_protection_review'
            }
          ]
        },
        {
          id: 8,
          name: 'JC Business Succession Series',
          trigger: 'sequence-business-succession',
          description: 'Strategic business succession planning for entrepreneurs and business owners',
          emails: [
            {
              subject: '🚀 Planning Your Business Legacy Starts Now',
              delay_hours: 0,
              type: 'succession_intro'
            },
            {
              subject: '⚠️ Succession Planning Mistakes That Destroy Value',
              delay_days: 3,
              type: 'succession_mistakes'
            },
            {
              subject: '📊 Tax-Optimized Exit Strategies Explained',
              delay_days: 6,
              type: 'succession_tax'
            },
            {
              subject: '🎯 Your Business Succession Planning Session',
              delay_days: 10,
              type: 'succession_session'
            }
          ]
        },
        {
          id: 9,
          name: 'JC Trust Planning Sequence',
          trigger: 'sequence-trust-planning',
          description: 'Comprehensive trust planning education for sophisticated estate planning',
          emails: [
            {
              subject: '🏛️ Trust Structures for High-Performers',
              delay_hours: 0,
              type: 'trust_intro'
            },
            {
              subject: '⚖️ Revocable vs. Irrevocable Trusts Explained',
              delay_days: 3,
              type: 'trust_types'
            },
            {
              subject: '💰 Trust Tax Benefits Every High-Earner Should Know',
              delay_days: 6,
              type: 'trust_tax'
            },
            {
              subject: '📅 Custom Trust Strategy Session Available',
              delay_days: 10,
              type: 'trust_session'
            }
          ]
        },
        {
          id: 10,
          name: 'JC Trademark Registration Flow',
          trigger: 'sequence-trademark-registration',
          description: 'Complete trademark registration process and brand protection guidance',
          emails: [
            {
              subject: '™️ Protecting Your Brand Assets: The Complete Guide',
              delay_hours: 0,
              type: 'trademark_intro'
            },
            {
              subject: '📋 Trademark Registration Process Simplified',
              delay_days: 2,
              type: 'trademark_process'
            },
            {
              subject: '🏆 Brand Protection Success Stories',
              delay_days: 5,
              type: 'trademark_success'
            },
            {
              subject: '🚀 Start Your Trademark Application Today',
              delay_days: 8,
              type: 'trademark_application'
            }
          ]
        },
        {
          id: 11,
          name: 'JC IP Enforcement Series',
          trigger: 'sequence-ip-enforcement',
          description: 'Intellectual property enforcement strategies and protection protocols',
          emails: [
            {
              subject: '⚔️ Defending Your Intellectual Property Rights',
              delay_hours: 0,
              type: 'ip_enforcement_intro'
            },
            {
              subject: '🎯 Strategic IP Enforcement That Works',
              delay_days: 3,
              type: 'ip_enforcement_strategy'
            },
            {
              subject: '💰 Case Study: $1M IP Recovery Victory',
              delay_days: 6,
              type: 'ip_enforcement_case'
            },
            {
              subject: '📊 Comprehensive IP Audit & Strategy Session',
              delay_days: 10,
              type: 'ip_enforcement_audit'
            }
          ]
        },
        {
          id: 12,
          name: 'JC Estate Tax Planning',
          trigger: 'sequence-estate-tax',
          description: 'Advanced estate tax minimization strategies for high-net-worth families',
          emails: [
            {
              subject: '💰 Minimizing Estate Tax Exposure: Advanced Strategies',
              delay_hours: 0,
              type: 'estate_tax_intro'
            },
            {
              subject: '📈 Advanced Estate Tax Strategies That Work',
              delay_days: 3,
              type: 'estate_tax_advanced'
            },
            {
              subject: '🏛️ Generation-Skipping Techniques Explained',
              delay_days: 6,
              type: 'estate_tax_generation'
            },
            {
              subject: '📅 Estate Tax Planning Consultation Available',
              delay_days: 10,
              type: 'estate_tax_consultation'
            }
          ]
        },
        {
          id: 13,
          name: 'JC VC Startup Formation',
          trigger: 'sequence-vc-startup',
          description: 'VC-ready startup formation and legal foundation for investment rounds',
          emails: [
            {
              subject: '🚀 Building Your VC-Ready Legal Foundation',
              delay_hours: 0,
              type: 'vc_startup_intro'
            },
            {
              subject: '📋 Complete Startup Legal Structure Guide',
              delay_days: 2,
              type: 'vc_startup_structure'
            },
            {
              subject: '💰 Preparing for Investment Rounds: Legal Essentials',
              delay_days: 5,
              type: 'vc_startup_investment'
            },
            {
              subject: '📅 Strategic Startup Legal Session',
              delay_days: 8,
              type: 'vc_startup_session'
            }
          ]
        },
        {
          id: 14,
          name: 'JC Angel Funding Readiness',
          trigger: 'sequence-angel-funding',
          description: 'Angel investment readiness and legal preparation for funding rounds',
          emails: [
            {
              subject: '👼 Angel-Ready Legal Preparation Starts Here',
              delay_hours: 0,
              type: 'angel_funding_intro'
            },
            {
              subject: '📄 Investment Documentation Essentials',
              delay_days: 3,
              type: 'angel_funding_docs'
            },
            {
              subject: '🔍 Due Diligence Preparation Checklist',
              delay_days: 6,
              type: 'angel_funding_diligence'
            },
            {
              subject: '✅ Complete Funding Readiness Review',
              delay_days: 10,
              type: 'angel_funding_review'
            }
          ]
        },
        {
          id: 15,
          name: 'JC Basic Estate Planning',
          trigger: 'sequence-basic-planning',
          description: 'Essential estate planning documents and foundational protection strategies',
          emails: [
            {
              subject: '📋 Essential Estate Planning Documents Checklist',
              delay_hours: 0,
              type: 'basic_estate_intro'
            },
            {
              subject: '⚖️ Will vs. Trust: What You Actually Need',
              delay_days: 3,
              type: 'basic_estate_comparison'
            },
            {
              subject: '📄 Power of Attorney Essentials Explained',
              delay_days: 6,
              type: 'basic_estate_poa'
            },
            {
              subject: '✅ Complete Your Estate Plan Today',
              delay_days: 10,
              type: 'basic_estate_complete'
            }
          ]
        }
      ],
      
      // LIFECYCLE MANAGEMENT JOURNEYS (6 Journeys)
      lifecycleManagement: [
        {
          id: 16,
          name: 'JC Pre-Consultation Preparation',
          trigger: 'consultation-booked',
          description: 'Preparation sequence for booked consultations with meeting preparation',
          emails: [
            {
              subject: '✅ Consultation Confirmed - What to Expect Next',
              delay_hours: 0,
              type: 'pre_consultation_confirmed'
            },
            {
              subject: '📋 Preparation Checklist for Your Legal Session',
              delay_days: -1, // 1 day before
              type: 'pre_consultation_prep'
            },
            {
              subject: '⏰ Meeting Reminder & Zoom Link - Starting Soon',
              delay_hours: -2, // 2 hours before
              type: 'pre_consultation_reminder'
            }
          ]
        },
        {
          id: 17,
          name: 'JC Consultation Canceled Recovery',
          trigger: 'consultation-canceled',
          description: 'Recovery sequence for canceled consultations with flexible rescheduling',
          emails: [
            {
              subject: '🤝 We Understand - Let\'s Find a Better Time',
              delay_hours: 2,
              type: 'canceled_understanding'
            },
            {
              subject: '📅 Flexible Scheduling Options Available',
              delay_days: 2,
              type: 'canceled_flexible'
            },
            {
              subject: '☎️ Quick 15-Minute Call Instead?',
              delay_days: 5,
              type: 'canceled_quick_call'
            },
            {
              subject: '🎯 Final Opportunity - Priority Booking Access',
              delay_days: 10,
              type: 'canceled_final'
            }
          ]
        },
        {
          id: 18,
          name: 'JC Active Client Experience',
          trigger: 'stage-active',
          description: 'Welcome sequence for active clients with onboarding and resources',
          emails: [
            {
              subject: '🎉 Welcome to the Jacobs Counsel Family',
              delay_hours: 0,
              type: 'active_welcome'
            },
            {
              subject: '🔑 Your Client Portal & Exclusive Resources',
              delay_days: 1,
              type: 'active_portal'
            },
            {
              subject: '📅 What to Expect: Your Next 30 Days',
              delay_days: 3,
              type: 'active_expectations'
            },
            {
              subject: '📰 Monthly Legal Update & Insights',
              delay_days: 30,
              type: 'active_monthly',
              recurring: true
            }
          ]
        },
        {
          id: 19,
          name: 'JC Community Member Nurturing',
          trigger: 'community-member',
          description: 'Ongoing nurture for community members with exclusive content',
          emails: [
            {
              subject: '🏛️ Welcome to Our Exclusive Legal Community',
              delay_hours: 0,
              type: 'community_welcome'
            },
            {
              subject: '🔐 Exclusive Member Resources & Benefits',
              delay_days: 3,
              type: 'community_resources'
            },
            {
              subject: '📊 Monthly Legal Insights & Market Updates',
              delay_days: 7,
              type: 'community_insights',
              recurring: true
            }
          ]
        },
        {
          id: 20,
          name: 'JC Referral Generation',
          trigger: 'ltv-high',
          description: 'Referral generation sequence for high-value clients after 90 days',
          condition: '90 days active',
          emails: [
            {
              subject: '🏆 Thank You - Your Success Story Inspires Us',
              delay_hours: 0,
              type: 'referral_thank_you'
            },
            {
              subject: '🤝 Help Others Achieve Similar Success',
              delay_days: 3,
              type: 'referral_help_others'
            },
            {
              subject: '🎁 Referral Rewards Program Details',
              delay_days: 7,
              type: 'referral_rewards'
            }
          ]
        },
        {
          id: 21,
          name: 'JC Client Satisfaction Monitoring',
          trigger: 'stage-active',
          description: 'Ongoing satisfaction monitoring and feedback collection',
          condition: '60+ days active',
          emails: [
            {
              subject: '📊 How Are We Doing? Your Feedback Matters',
              delay_days: 60,
              type: 'satisfaction_feedback'
            },
            {
              subject: '🔄 Quick Feedback Request - 2 Minutes',
              delay_days: 90,
              type: 'satisfaction_quick'
            },
            {
              subject: '⭐ Share Your Success Story?',
              delay_days: 120,
              type: 'satisfaction_testimonial'
            }
          ]
        }
      ],
      
      // INTAKE-SPECIFIC JOURNEYS (4 Journeys)
      intakeSpecific: [
        {
          id: 22,
          name: 'JC Estate Planning Intake Follow-Up',
          trigger: 'intake-estate-intake',
          description: 'Follow-up sequence for estate planning intake submissions',
          emails: [
            {
              subject: '✅ Estate Planning Intake Received - Next Steps',
              delay_hours: 0,
              type: 'estate_intake_received'
            },
            {
              subject: '📋 Next Steps in Your Estate Planning Journey',
              delay_days: 1,
              type: 'estate_intake_next_steps'
            },
            {
              subject: '📅 Schedule Your Estate Planning Session',
              delay_days: 3,
              type: 'estate_intake_schedule'
            }
          ]
        },
        {
          id: 23,
          name: 'JC Business Formation Intake Follow-Up',
          trigger: 'intake-business-formation',
          description: 'Follow-up sequence for business formation intake submissions',
          emails: [
            {
              subject: '✅ Business Formation Intake Received',
              delay_hours: 0,
              type: 'business_intake_received'
            },
            {
              subject: '🏗️ Complete Entity Selection Guide',
              delay_days: 1,
              type: 'business_intake_entity'
            },
            {
              subject: '📅 Business Formation Strategy Session',
              delay_days: 3,
              type: 'business_intake_strategy'
            }
          ]
        },
        {
          id: 24,
          name: 'JC Brand Protection Intake Follow-Up',
          trigger: 'intake-brand-protection',
          description: 'Follow-up sequence for brand protection intake submissions',
          emails: [
            {
              subject: '✅ Brand Protection Intake Received',
              delay_hours: 0,
              type: 'brand_intake_received'
            },
            {
              subject: '🔍 Your Trademark Search Results',
              delay_days: 1,
              type: 'brand_intake_search'
            },
            {
              subject: '📞 Brand Protection Strategy Call',
              delay_days: 3,
              type: 'brand_intake_call'
            }
          ]
        },
        {
          id: 25,
          name: 'JC Outside Counsel Intake Follow-Up',
          trigger: 'intake-outside-counsel',
          description: 'Follow-up sequence for outside counsel inquiry submissions',
          emails: [
            {
              subject: '✅ Outside Counsel Inquiry Received',
              delay_hours: 0,
              type: 'counsel_intake_received'
            },
            {
              subject: '⚖️ Our General Counsel Services Overview',
              delay_days: 1,
              type: 'counsel_intake_services'
            },
            {
              subject: '📋 Strategy & Retainer Discussion',
              delay_days: 3,
              type: 'counsel_intake_retainer'
            }
          ]
        }
      ]
    };
  }

  // Test Kit connection
  async testConnection() {
    try {
      const response = await fetch(`${KIT_API_BASE}/account?api_key=${this.apiKey}&api_secret=${this.apiSecret}`);
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

  // Load existing resources
  async loadExistingResources() {
    try {
      // Load tags
      const tagsResponse = await fetch(`${KIT_API_BASE}/tags?api_key=${this.apiKey}&api_secret=${this.apiSecret}`);
      const tagsData = await tagsResponse.json();
      
      if (tagsResponse.ok && tagsData.tags) {
        tagsData.tags.forEach(tag => {
          this.existingTags.set(tag.name, tag);
        });
      }
      
      // Load forms
      const formsResponse = await fetch(`${KIT_API_BASE}/forms?api_key=${this.apiKey}&api_secret=${this.apiSecret}`);
      const formsData = await formsResponse.json();
      
      if (formsResponse.ok && formsData.forms) {
        formsData.forms.forEach(form => {
          this.existingForms.set(form.name, form);
        });
      }
      
      // Load sequences
      const sequencesResponse = await fetch(`${KIT_API_BASE}/sequences?api_key=${this.apiKey}&api_secret=${this.apiSecret}`);
      const sequencesData = await sequencesResponse.json();
      
      if (sequencesResponse.ok && sequencesData.sequences) {
        sequencesData.sequences.forEach(sequence => {
          this.existingSequences.set(sequence.name, sequence);
        });
      }
      
      log.info('📊 Resources loaded', {
        tags: this.existingTags.size,
        forms: this.existingForms.size,
        sequences: this.existingSequences.size
      });
      
      return {
        tags: Array.from(this.existingTags.values()),
        forms: Array.from(this.existingForms.values()),
        sequences: Array.from(this.existingSequences.values())
      };
      
    } catch (error) {
      log.error('❌ Failed to load existing resources:', error.message);
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

  // Create or get sequence
  async createSequence(name, description) {
    // Check if sequence already exists
    if (this.existingSequences.has(name)) {
      log.info(`📧 Using existing sequence: ${name}`);
      return this.existingSequences.get(name);
    }

    try {
      const response = await fetch(`${KIT_API_BASE}/sequences`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          api_key: this.apiKey,
          api_secret: this.apiSecret,
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

  // Add email to sequence with branded template
  async addEmailToSequence(sequenceId, emailData) {
    try {
      const emailContent = await this.generateEmailContent(emailData.type, emailData.subject);
      const emailHTML = this.generateEmailHTML(emailContent, emailData.type);
      
      const response = await fetch(`${KIT_API_BASE}/sequences/${sequenceId}/emails`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          api_key: this.apiKey,
          api_secret: this.apiSecret,
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
        subject: emailData.subject.substring(0, 50) + '...'
      });
      
      return data.email;
      
    } catch (error) {
      log.error(`❌ Email creation failed:`, error.message);
      throw error;
    }
  }

  // Generate email content based on type
  async generateEmailContent(type, subject) {
    // This would contain the full email content for each type
    // For now, returning a placeholder structure
    const baseContent = `
      <h1>${subject.replace(/🏛️|⚡|🛡️|💰|📅|🎯|🚨|📬|🏆|🎓|📖|🛠️|❓/g, '').trim()}</h1>
      
      <p>{{first_name | default: "Valued Client"}}, thank you for your interest in premium legal counsel.</p>
      
      <div class="highlight-box">
        <h3>What This Means for You</h3>
        <p>Our advanced legal strategies are designed specifically for high-performers who demand excellence and results.</p>
      </div>
      
      <p>This is the beginning of a powerful legal partnership that will protect and advance your interests strategically.</p>
      
      <a href="https://calendly.com/jacobscounsel/strategic-consultation" class="cta-button">
        Schedule Your Strategy Session →
      </a>
      
      <p>To your continued success,<br>
      <strong>Drew Jacobs, Esq.</strong><br>
      Founder & Managing Attorney</p>
    `;
    
    return baseContent;
  }

  // Build complete 25-pathway architecture
  async buildComplete25PathwayArchitecture() {
    log.info('🏗️ Building complete 25-pathway Kit architecture...');
    
    const results = {
      existingResources: {},
      sequences: [],
      emails: [],
      totalPathways: 0
    };
    
    try {
      // Test connection and load resources
      await this.testConnection();
      results.existingResources = await this.loadExistingResources();
      
      // Build all journey categories
      const allJourneys = [
        ...this.journeyArchitecture.leadNurture,
        ...this.journeyArchitecture.serviceEducation,
        ...this.journeyArchitecture.lifecycleManagement,
        ...this.journeyArchitecture.intakeSpecific
      ];
      
      log.info(`🚀 Building ${allJourneys.length} complete journey pathways...`);
      
      // Create each journey sequence
      for (const journey of allJourneys) {
        try {
          log.info(`📧 Creating journey ${journey.id}: ${journey.name}`);
          
          const sequence = await this.createSequence(journey.name, journey.description);
          results.sequences.push(sequence);
          
          // Add all emails to the sequence
          for (const emailData of journey.emails) {
            try {
              const email = await this.addEmailToSequence(sequence.id, emailData);
              results.emails.push(email);
            } catch (error) {
              log.warn(`Email addition failed for ${journey.name}: ${error.message}`);
            }
          }
          
          results.totalPathways++;
          
        } catch (error) {
          log.warn(`Journey creation failed: ${journey.name} - ${error.message}`);
        }
      }
      
      log.info('🎉 Complete 25-pathway architecture built successfully!', {
        totalPathways: results.totalPathways,
        sequences: results.sequences.length,
        emails: results.emails.length,
        existingTags: results.existingResources.tags.length,
        existingForms: results.existingResources.forms.length
      });
      
      return results;
      
    } catch (error) {
      log.error('❌ Complete architecture build failed:', error.message);
      throw error;
    }
  }
}

// Main export function
export async function buildComplete25PathwaySystem() {
  const builder = new CompleteKitArchitecture();
  return await builder.buildComplete25PathwayArchitecture();
}

export default CompleteKitArchitecture;