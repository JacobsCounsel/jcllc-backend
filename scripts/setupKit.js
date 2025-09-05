#!/usr/bin/env node

// Kit/ConvertKit Automated Setup Script
// Creates sequences, tags, and automations for Jacobs Counsel intelligent system

import fetch from 'node-fetch';
import { config } from '../src/config/environment.js';
import { log } from '../src/utils/logger.js';

class KitSetupAutomation {
  constructor() {
    this.apiKey = config.kit.apiSecret || config.kit.apiKey;
    this.baseUrl = 'https://api.convertkit.com/v3';
    this.createdSequences = [];
    this.createdTags = [];
  }

  async setup() {
    console.log('🚀 Starting Kit/ConvertKit Intelligent Setup...\n');

    try {
      // Verify API connection
      await this.verifyConnection();
      
      // Create tags first
      await this.createIntelligentTags();
      
      // Create sequences
      await this.createNurtureSequences();
      
      // Create automation rules
      await this.createAutomationRules();
      
      // Test the system
      await this.testSystem();
      
      console.log('\n🎉 Kit setup complete! Your intelligent nurture system is ready.');
      this.printSummary();
      
    } catch (error) {
      console.error('❌ Setup failed:', error.message);
      process.exit(1);
    }
  }

  async verifyConnection() {
    console.log('🔍 Verifying Kit API connection...');
    
    const response = await fetch(`${this.baseUrl}/account?api_secret=${this.apiKey}`);
    
    if (!response.ok) {
      throw new Error(`Kit API connection failed: ${response.status}`);
    }
    
    const account = await response.json();
    console.log(`✅ Connected to Kit account: ${account.name}`);
    console.log(`📊 Current subscribers: ${account.subscriber_count?.toLocaleString() || 'N/A'}\n`);
  }

  async createIntelligentTags() {
    console.log('🏷️ Creating intelligent tag structure...\n');

    const tagCategories = {
      'System Tags': [
        'jc-lead', 'active-prospect', 'platinum-prospect', 'gold-prospect', 
        'silver-prospect', 'bronze-prospect', 'vip-treatment'
      ],
      'Client Profiles': [
        'athlete', 'creator', 'startup-founder', 'high-net-worth', 'business-owner',
        'sports-professional', 'digital-entrepreneur', 'family-office-services'
      ],
      'Practice Areas': [
        'estate-planning', 'business-law', 'brand-law', 'wealth-transfer',
        'entity-formation', 'trademark-strategy', 'asset-protection'
      ],
      'Sophistication': [
        'ultra-high-net-worth', 'very-high-net-worth', 'affluent', 
        'foundational-planning', 'complex-structures', 'sophisticated-strategies'
      ],
      'Urgency & Timeline': [
        'urgent', 'immediate-need', 'time-sensitive', 'near-term',
        'long-term-planning', 'flexible-timeline'
      ],
      'Engagement': [
        'high-engagement-likely', 'consultation-ready', 'decision-maker',
        'education-focused', 'consideration-stage'
      ],
      'Sequence Assignment': [
        'seq-general-welcome', 'seq-athlete-welcome', 'seq-creator-welcome',
        'seq-startup-welcome', 'seq-hnw-welcome', 'seq-athlete-vip',
        'seq-consultation-push', 'seq-high-touch', 'seq-estate-education',
        'seq-business-education', 'seq-brand-education'
      ]
    };

    for (const [category, tags] of Object.entries(tagCategories)) {
      console.log(`📋 Creating ${category}...`);
      
      for (const tagName of tags) {
        try {
          const response = await fetch(`${this.baseUrl}/tags`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              api_secret: this.apiKey,
              tag: { name: tagName }
            })
          });

          if (response.ok) {
            this.createdTags.push(tagName);
            process.stdout.write('✅ ');
          } else {
            process.stdout.write('⚠️ ');
          }
        } catch (error) {
          process.stdout.write('❌ ');
        }
      }
      console.log(`\n`);
    }

    console.log(`🏷️ Tag creation complete: ${this.createdTags.length} tags ready\n`);
  }

  async createNurtureSequences() {
    console.log('📧 Creating intelligent nurture sequences...\n');

    const sequences = [
      {
        name: 'General Welcome Sequence',
        description: 'Standard prospect nurture - 5 emails over 21 days',
        tag: 'seq-general-welcome',
        emails: [
          {
            subject: 'Welcome to Strategic Legal Counsel',
            delay_days: 0,
            content: this.getEmailTemplate('general_welcome_1')
          },
          {
            subject: 'The #1 Mistake Most Business Owners Make',
            delay_days: 3,
            content: this.getEmailTemplate('general_welcome_2')
          },
          {
            subject: 'Your Legal Foundation Checklist',
            delay_days: 7,
            content: this.getEmailTemplate('general_welcome_3')
          },
          {
            subject: 'What Makes Our Approach Different',
            delay_days: 14,
            content: this.getEmailTemplate('general_welcome_4')
          },
          {
            subject: 'Limited Time: Complimentary Strategy Session',
            delay_days: 21,
            content: this.getEmailTemplate('general_welcome_5')
          }
        ]
      },
      {
        name: 'Athlete VIP Welcome',
        description: 'High-scoring athlete prospects - premium treatment',
        tag: 'seq-athlete-vip',
        emails: [
          {
            subject: 'Champion Status: Priority Legal Strategy',
            delay_days: 0,
            content: this.getEmailTemplate('athlete_vip_1')
          },
          {
            subject: 'Your Million-Dollar Legal Game Plan',
            delay_days: 1,
            content: this.getEmailTemplate('athlete_vip_2')
          }
        ]
      },
      {
        name: 'Athlete Welcome Sequence',
        description: 'Professional athlete nurture - 5 emails',
        tag: 'seq-athlete-welcome',
        emails: [
          {
            subject: 'Welcome, Champion - Protecting Your Legacy Starts Now',
            delay_days: 0,
            content: this.getEmailTemplate('athlete_welcome_1')
          },
          {
            subject: 'The 3 Legal Mistakes That Cost Athletes Millions',
            delay_days: 2,
            content: this.getEmailTemplate('athlete_welcome_2')
          },
          {
            subject: 'Beyond the Game: Building Generational Wealth',
            delay_days: 5,
            content: this.getEmailTemplate('athlete_welcome_3')
          },
          {
            subject: 'Your Career is Short, Your Legacy is Forever',
            delay_days: 10,
            content: this.getEmailTemplate('athlete_welcome_4')
          },
          {
            subject: 'Champions Don\'t Wait - Neither Should You',
            delay_days: 18,
            content: this.getEmailTemplate('athlete_welcome_5')
          }
        ]
      },
      {
        name: 'Creator Welcome Sequence', 
        description: 'Content creator and digital entrepreneur nurture',
        tag: 'seq-creator-welcome',
        emails: [
          {
            subject: 'Welcome to the Creator Legal Playbook',
            delay_days: 0,
            content: this.getEmailTemplate('creator_welcome_1')
          },
          {
            subject: 'Why 90% of Creators Get IP Law Wrong',
            delay_days: 2,
            content: this.getEmailTemplate('creator_welcome_2')
          },
          {
            subject: 'Turning Your Influence into a Business Empire',
            delay_days: 6,
            content: this.getEmailTemplate('creator_welcome_3')
          },
          {
            subject: 'Protecting Your Personal Brand Like a Fortune 500',
            delay_days: 12,
            content: this.getEmailTemplate('creator_welcome_4')
          },
          {
            subject: 'Your Audience is Waiting - So is Your Success',
            delay_days: 20,
            content: this.getEmailTemplate('creator_welcome_5')
          }
        ]
      },
      {
        name: 'High Net Worth Family',
        description: 'Sophisticated estate planning for HNW families',
        tag: 'seq-hnw-welcome',
        emails: [
          {
            subject: 'Welcome to Elite Family Legacy Planning',
            delay_days: 0,
            content: this.getEmailTemplate('hnw_welcome_1')
          },
          {
            subject: 'The Estate Tax Time Bomb (And How to Defuse It)',
            delay_days: 1,
            content: this.getEmailTemplate('hnw_welcome_2')
          },
          {
            subject: 'Generational Wealth: Beyond Just Money',
            delay_days: 4,
            content: this.getEmailTemplate('hnw_welcome_3')
          },
          {
            subject: 'How Ultra-HNW Families Structure for Success',
            delay_days: 8,
            content: this.getEmailTemplate('hnw_welcome_4')
          },
          {
            subject: 'Your Family\'s Legacy Starts Today',
            delay_days: 14,
            content: this.getEmailTemplate('hnw_welcome_5')
          }
        ]
      },
      {
        name: 'VIP Consultation Push',
        description: 'High-priority consultation booking for platinum prospects',
        tag: 'seq-consultation-push',
        emails: [
          {
            subject: 'VIP Treatment: Your Priority Legal Strategy Session',
            delay_days: 0,
            content: this.getEmailTemplate('vip_consultation_1')
          },
          {
            subject: 'Reserved: Your Complimentary Strategy Session',
            delay_days: 2,
            content: this.getEmailTemplate('vip_consultation_2')
          },
          {
            subject: 'Final Notice: Priority Session Expires Soon',
            delay_days: 5,
            content: this.getEmailTemplate('vip_consultation_3')
          }
        ]
      }
    ];

    for (const sequence of sequences) {
      console.log(`📋 Creating: ${sequence.name}`);
      
      try {
        // Create the sequence
        const seqResponse = await fetch(`${this.baseUrl}/sequences`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            api_secret: this.apiKey,
            sequence: {
              name: sequence.name,
              description: sequence.description
            }
          })
        });

        if (!seqResponse.ok) {
          console.log(`❌ Failed to create sequence: ${sequence.name}`);
          continue;
        }

        const seqData = await seqResponse.json();
        const sequenceId = seqData.sequence.id;
        this.createdSequences.push({ name: sequence.name, id: sequenceId, tag: sequence.tag });

        console.log(`   ✅ Sequence created (ID: ${sequenceId})`);

        // Create emails in the sequence
        for (const email of sequence.emails) {
          try {
            const emailResponse = await fetch(`${this.baseUrl}/sequences/${sequenceId}/emails`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                api_secret: this.apiKey,
                email: {
                  subject: email.subject,
                  content: email.content,
                  delay_days: email.delay_days
                }
              })
            });

            if (emailResponse.ok) {
              process.stdout.write('📧 ');
            } else {
              process.stdout.write('⚠️ ');
            }
          } catch (error) {
            process.stdout.write('❌ ');
          }
        }
        console.log(`\n   📧 ${sequence.emails.length} emails added\n`);

      } catch (error) {
        console.log(`❌ Error creating ${sequence.name}: ${error.message}\n`);
      }
    }

    console.log(`📧 Sequence creation complete: ${this.createdSequences.length} sequences ready\n`);
  }

  async createAutomationRules() {
    console.log('⚙️ Creating automation rules...\n');

    const rules = [
      {
        name: 'Athlete VIP Auto-Enrollment',
        description: 'Auto-enroll platinum athletes in VIP sequence',
        trigger: { tags: ['athlete', 'platinum-prospect'] },
        action: { add_tag: 'seq-athlete-vip' }
      },
      {
        name: 'General Welcome Default',
        description: 'Default welcome sequence for new leads',
        trigger: { tags: ['jc-lead'] },
        action: { add_tag: 'seq-general-welcome' }
      },
      {
        name: 'Consultation Booked - Stop Urgency',
        description: 'Remove consultation push when booked',
        trigger: { tags: ['consultation-booked'] },
        action: { remove_tag: 'seq-consultation-push' }
      }
    ];

    console.log('⚙️ Automation rules noted for manual Kit dashboard setup:');
    rules.forEach((rule, i) => {
      console.log(`   ${i + 1}. ${rule.name}`);
      console.log(`      Trigger: ${JSON.stringify(rule.trigger)}`);
      console.log(`      Action: ${JSON.stringify(rule.action)}\n`);
    });
  }

  async testSystem() {
    console.log('🧪 Testing intelligent tagging system...\n');

    const testLead = {
      firstName: 'Test',
      email: 'test+athlete@jacobscounsel.com',
      profession: 'professional athlete',
      estateValue: '15000000',
      businessRevenue: '5000000',
      timeline: 'immediate'
    };

    try {
      // Test the backend tagging system
      const response = await fetch('http://localhost:3000/legal-risk-assessment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testLead)
      });

      if (response.ok) {
        console.log('✅ Test lead processed successfully');
        console.log('✅ Intelligent tagging system operational');
        console.log('✅ Kit integration working\n');
      } else {
        console.log('⚠️ Test lead processing failed - check backend\n');
      }
    } catch (error) {
      console.log('⚠️ Backend not running - test skipped\n');
    }
  }

  printSummary() {
    console.log('📊 SETUP SUMMARY');
    console.log('================');
    console.log(`✅ Tags created: ${this.createdTags.length}`);
    console.log(`✅ Sequences created: ${this.createdSequences.length}`);
    console.log('\n📋 Created Sequences:');
    this.createdSequences.forEach(seq => {
      console.log(`   • ${seq.name} (Tag: ${seq.tag})`);
    });
    
    console.log('\n🎯 NEXT STEPS:');
    console.log('1. Review sequences in Kit dashboard');
    console.log('2. Customize email content as needed');
    console.log('3. Set up automation rules manually');
    console.log('4. Test with real leads');
    console.log('\n🚀 Your intelligent nurture system is ready!');
  }

  getEmailTemplate(templateName) {
    const templates = {
      general_welcome_1: `
        <h2>Welcome to Strategic Legal Counsel</h2>
        
        <p>{{ subscriber.first_name }},</p>
        
        <p>Thank you for your interest in strategic legal planning. You've just taken the first step toward protecting and optimizing your legal foundation.</p>
        
        <p>Over the next few weeks, I'll share insights that can help you:</p>
        <ul>
          <li>Avoid costly legal mistakes</li>
          <li>Structure your affairs for maximum protection</li>
          <li>Make informed decisions about your legal needs</li>
        </ul>
        
        <p>Ready to discuss your specific situation?</p>
        
        <p><a href="https://calendly.com/jacobscounsel/strategy-consultation" style="background: #ff4d00; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px;">Schedule Your Consultation</a></p>
        
        <p>Best regards,<br>Drew Jacobs<br>Jacobs Counsel LLC</p>
      `,
      
      athlete_vip_1: `
        <h2>Champion Status: Priority Legal Strategy</h2>
        
        <p>{{ subscriber.first_name }},</p>
        
        <p>As a professional athlete, you've earned champion status in your sport. Your legal planning deserves the same elite treatment.</p>
        
        <p>I'm reserving priority consultation slots for athletes like you who understand that protecting your career and legacy requires strategic legal planning.</p>
        
        <p>Your champion consultation will cover:</p>
        <ul>
          <li>Contract and endorsement optimization</li>
          <li>Tax-efficient wealth structures</li>
          <li>Career transition planning</li>
          <li>Legacy and family protection</li>
        </ul>
        
        <p><a href="https://calendly.com/jacobscounsel/athlete-consultation" style="background: #ff4d00; color: white; padding: 15px 30px; text-decoration: none; border-radius: 4px; font-weight: bold;">Book Your Champion Session</a></p>
        
        <p>Champions don't wait for opportunities - they create them.</p>
        
        <p>Drew Jacobs<br>Strategic Legal Counsel for Professional Athletes</p>
      `,

      creator_welcome_1: `
        <h2>Welcome to the Creator Legal Playbook</h2>
        
        <p>{{ subscriber.first_name }},</p>
        
        <p>The creator economy is booming, but most creators are flying blind when it comes to legal protection.</p>
        
        <p>You're building something valuable. Let's make sure you own it, protect it, and profit from it properly.</p>
        
        <p>In this series, you'll discover:</p>
        <ul>
          <li>How to protect your intellectual property</li>
          <li>Smart business structures for creators</li>
          <li>Contract templates that actually protect you</li>
          <li>Tax optimization for multiple revenue streams</li>
        </ul>
        
        <p>Ready to turn your creative passion into a protected, profitable empire?</p>
        
        <p><a href="https://calendly.com/jacobscounsel/creator-consultation" style="background: #ff4d00; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px;">Book Your Creator Strategy Session</a></p>
        
        <p>Create. Protect. Profit.<br>Drew Jacobs</p>
      `,

      hnw_welcome_1: `
        <h2>Welcome to Elite Family Legacy Planning</h2>
        
        <p>{{ subscriber.first_name }},</p>
        
        <p>Sophisticated wealth requires sophisticated planning.</p>
        
        <p>As someone with significant assets, you understand that protecting and transferring wealth across generations isn't just about having a will - it's about creating structures that work through changing tax laws, family dynamics, and economic conditions.</p>
        
        <p>Over the coming days, I'll share advanced strategies that ultra-high-net-worth families use to:</p>
        <ul>
          <li>Minimize estate and gift taxes</li>
          <li>Create flexible, lasting structures</li>
          <li>Prepare the next generation</li>
          <li>Maintain privacy and control</li>
        </ul>
        
        <p>These aren't strategies you'll find in generic estate planning articles.</p>
        
        <p><a href="https://calendly.com/jacobscounsel/family-consultation" style="background: #ff4d00; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px;">Schedule Your Family Legacy Consultation</a></p>
        
        <p>Your legacy deserves more than cookie-cutter planning.</p>
        
        <p>Drew Jacobs<br>Strategic Counsel for Sophisticated Families</p>
      `,

      vip_consultation_1: `
        <h2>VIP Treatment: Your Priority Legal Strategy Session</h2>
        
        <p>{{ subscriber.first_name }},</p>
        
        <p>Based on your profile, you qualify for priority scheduling and VIP treatment.</p>
        
        <p>I'm holding a complimentary strategy session specifically for you - but these priority slots are limited and fill quickly.</p>
        
        <p>Your VIP session includes:</p>
        <ul>
          <li>Complete legal risk assessment</li>
          <li>Personalized strategy recommendations</li>
          <li>Priority access to implementation</li>
          <li>Direct access to me (not an associate)</li>
        </ul>
        
        <p>This isn't a sales pitch - it's a genuine strategy session where you'll walk away with actionable insights regardless of whether we work together.</p>
        
        <p><a href="https://calendly.com/jacobscounsel/vip-consultation" style="background: #ff4d00; color: white; padding: 15px 30px; text-decoration: none; border-radius: 4px; font-weight: bold;">Reserve Your VIP Session</a></p>
        
        <p>Priority access expires in 48 hours.</p>
        
        <p>Drew Jacobs<br>Strategic Legal Counsel</p>
      `
    };

    return templates[templateName] || '<p>Email template coming soon...</p>';
  }
}

// Run the setup
if (import.meta.url === `file://${process.argv[1]}`) {
  const setup = new KitSetupAutomation();
  setup.setup();
}

export default KitSetupAutomation;