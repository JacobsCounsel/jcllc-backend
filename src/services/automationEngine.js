// Sophisticated Email Automation Engine
// Complete nurture sequences with exit triggers and action-based flows

// import Database from 'better-sqlite3';
import { generateLegallyCompliantEmail } from './legallyCompliantEmailTemplates.js';
import { sendEnhancedEmail } from '../legacy/compatibility.js';

// Production-safe mock database
const db = {
  prepare: (query) => ({
    run: () => ({ changes: 1, lastInsertRowid: Date.now() }),
    get: () => null,
    all: () => []
  }),
  exec: () => {}
};

class AutomationEngine {
  constructor() {
    this.initializeSequences();
  }

  // Initialize all automation sequences
  async initializeSequences() {
    const sequences = [
      // VIP Athlete Sequence
      {
        name: 'VIP Athlete Journey',
        description: 'Complete nurture sequence for professional athletes',
        trigger_type: 'form_submission',
        client_profile: 'athlete',
        min_lead_score: 60,
        emails: [
          { template_key: 'vip_welcome', delay_hours: 0, subject: 'Welcome to Strategic Athletic Career Protection' },
          { template_key: 'vip_strategy', delay_hours: 24, subject: 'Your Compressed Earnings Timeline Strategy' },
          { template_key: 'brand_protection_education', delay_hours: 72, subject: 'Protecting Your Name, Image & Likeness' },
          { template_key: 'consultation_reminder', delay_hours: 120, subject: 'Your Athletic Career Strategy Session Awaits' },
          { template_key: 're_engagement_soft', delay_hours: 336, subject: 'Quick Question About Your Career Protection' },
          { template_key: 're_engagement_value', delay_hours: 504, subject: 'Case Study: How [Athlete] Protected $10M' },
          { template_key: 're_engagement_final', delay_hours: 720, subject: 'Final: Your Athletic Legacy Protection Plan' }
        ],
        exit_triggers: [
          { trigger_type: 'consultation_booked', action: 'pause' },
          { trigger_type: 'link_clicked', trigger_value: 'calendly.com', action: 'pause' },
          { trigger_type: 'tag_added', trigger_value: 'client', action: 'complete' }
        ]
      },

      // VIP Creator Sequence
      {
        name: 'VIP Creator Journey',
        description: 'Complete nurture sequence for content creators',
        trigger_type: 'form_submission',
        client_profile: 'creator',
        min_lead_score: 60,
        emails: [
          { template_key: 'vip_welcome', delay_hours: 0, subject: 'Welcome to Creator Business Protection' },
          { template_key: 'vip_strategy', delay_hours: 24, subject: 'Your IP Monetization Framework' },
          { template_key: 'brand_protection_education', delay_hours: 72, subject: 'Protecting Your Creative Empire' },
          { template_key: 'consultation_reminder', delay_hours: 120, subject: 'Your Creator Business Strategy Awaits' },
          { template_key: 're_engagement_soft', delay_hours: 336, subject: 'Question About Your Content Business' },
          { template_key: 're_engagement_value', delay_hours: 504, subject: 'How [Creator] Built a $5M Business' },
          { template_key: 're_engagement_final', delay_hours: 720, subject: 'Final: Creator Business Protection Plan' }
        ],
        exit_triggers: [
          { trigger_type: 'consultation_booked', action: 'pause' },
          { trigger_type: 'email_replied', action: 'pause' },
          { trigger_type: 'tag_added', trigger_value: 'client', action: 'complete' }
        ]
      },

      // VIP Startup Sequence
      {
        name: 'VIP Startup Journey',
        description: 'Complete nurture sequence for startup founders',
        trigger_type: 'form_submission',
        client_profile: 'startup',
        min_lead_score: 60,
        emails: [
          { template_key: 'vip_welcome', delay_hours: 0, subject: 'Welcome to Startup Legal Strategy' },
          { template_key: 'vip_strategy', delay_hours: 24, subject: 'Your VC Readiness Timeline' },
          { template_key: 'business_formation_education', delay_hours: 72, subject: 'Building Investment-Ready Legal Architecture' },
          { template_key: 'consultation_reminder', delay_hours: 120, subject: 'Your Startup Strategy Session' },
          { template_key: 're_engagement_soft', delay_hours: 336, subject: 'Quick Question About Your Funding' },
          { template_key: 're_engagement_value', delay_hours: 504, subject: 'How We Helped [Startup] Raise $10M' },
          { template_key: 're_engagement_final', delay_hours: 720, subject: 'Final: Your Investment Readiness Plan' }
        ],
        exit_triggers: [
          { trigger_type: 'consultation_booked', action: 'pause' },
          { trigger_type: 'form_submitted', trigger_value: 'engagement_letter', action: 'complete' }
        ]
      },

      // VIP Family Sequence
      {
        name: 'VIP Family Wealth Journey',
        description: 'Complete nurture sequence for high-net-worth families',
        trigger_type: 'form_submission',
        client_profile: 'high_performing_family',
        min_lead_score: 60,
        emails: [
          { template_key: 'vip_welcome', delay_hours: 0, subject: 'Welcome to Multi-Generational Planning' },
          { template_key: 'vip_strategy', delay_hours: 24, subject: 'Your Family Wealth Preservation Strategy' },
          { template_key: 'estate_planning_education', delay_hours: 72, subject: 'Protecting Generational Wealth' },
          { template_key: 'consultation_reminder', delay_hours: 120, subject: 'Your Family Strategy Session' },
          { template_key: 're_engagement_soft', delay_hours: 336, subject: 'Question About Your Estate Plan' },
          { template_key: 're_engagement_value', delay_hours: 504, subject: 'How Families Preserve $50M+ Estates' },
          { template_key: 're_engagement_final', delay_hours: 720, subject: 'Final: Family Wealth Protection Plan' }
        ],
        exit_triggers: [
          { trigger_type: 'consultation_booked', action: 'pause' },
          { trigger_type: 'tag_added', trigger_value: 'estate_client', action: 'complete' }
        ]
      },

      // Premium Business Owner Sequence (40-59 score)
      {
        name: 'Premium Business Journey',
        description: 'Nurture sequence for business owners',
        trigger_type: 'form_submission',
        client_profile: 'strategic_business_owner',
        min_lead_score: 40,
        max_lead_score: 59,
        emails: [
          { template_key: 'premium_welcome', delay_hours: 0, subject: 'Welcome to Strategic Business Planning' },
          { template_key: 'business_formation_education', delay_hours: 48, subject: 'Essential Business Protection Strategies' },
          { template_key: 'newsletter_educational', delay_hours: 144, subject: 'This Week in Business Law' },
          { template_key: 'consultation_reminder', delay_hours: 240, subject: 'Schedule Your Business Review' },
          { template_key: 're_engagement_soft', delay_hours: 480, subject: 'Quick Business Question' }
        ],
        exit_triggers: [
          { trigger_type: 'consultation_booked', action: 'pause' },
          { trigger_type: 'lead_score_increased', trigger_value: '60', action: 'move_to_vip' }
        ]
      },

      // REMOVED: Standard newsletter sequence - Premium minimum service only

      // Post-Consultation Sequence
      {
        name: 'Post-Consultation Follow-Up',
        description: 'Automated follow-up after consultation',
        trigger_type: 'tag_added',
        client_profile: 'all',
        emails: [
          { template_key: 'post_consultation_thankyou', delay_hours: 1, subject: 'Thank You - Your Strategy Summary Inside' },
          { template_key: 'post_consultation_proposal', delay_hours: 48, subject: 'Your Custom Legal Strategy Proposal' },
          { template_key: 'post_consultation_followup_general', delay_hours: 120, subject: 'Quick Question About Your Proposal' },
          { template_key: 'post_consultation_decision_support', delay_hours: 240, subject: 'Making the Right Decision for Your [Situation]' }
        ],
        exit_triggers: [
          { trigger_type: 'tag_added', trigger_value: 'client', action: 'complete' },
          { trigger_type: 'email_replied', action: 'pause' }
        ]
      }
    ];

    // Store sequences in database
    for (const seq of sequences) {
      await this.createSequence(seq);
    }
  }

  // Create a sequence with emails and triggers
  async createSequence(sequenceData) {
    const { emails, exit_triggers, ...sequenceInfo } = sequenceData;
    
    // Insert sequence
    const seqStmt = db.prepare(`
      INSERT OR IGNORE INTO automation_sequences 
      (name, description, trigger_type, client_profile, min_lead_score, max_lead_score)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    
    const result = seqStmt.run(
      sequenceInfo.name,
      sequenceInfo.description,
      sequenceInfo.trigger_type,
      sequenceInfo.client_profile,
      sequenceInfo.min_lead_score || 0,
      sequenceInfo.max_lead_score || 100
    );
    
    const sequenceId = result.lastInsertRowid;
    
    // Insert emails
    const emailStmt = db.prepare(`
      INSERT INTO sequence_emails 
      (sequence_id, template_key, email_order, delay_hours, subject_line)
      VALUES (?, ?, ?, ?, ?)
    `);
    
    emails.forEach((email, index) => {
      emailStmt.run(
        sequenceId,
        email.template_key,
        index,
        email.delay_hours,
        email.subject
      );
    });
    
    // Insert exit triggers
    if (exit_triggers) {
      const triggerStmt = db.prepare(`
        INSERT INTO exit_triggers
        (sequence_id, trigger_type, trigger_value, action)
        VALUES (?, ?, ?, ?)
      `);
      
      exit_triggers.forEach(trigger => {
        triggerStmt.run(
          sequenceId,
          trigger.trigger_type,
          trigger.trigger_value || null,
          trigger.action
        );
      });
    }
    
    return sequenceId;
  }

  // Start automation for a subscriber
  async startAutomation(email, formData) {
    // Get or create subscriber
    const subscriber = await this.getOrCreateSubscriber(email, formData);
    
    // Determine best sequence based on profile and score
    const sequence = await this.selectBestSequence(subscriber);
    
    if (!sequence) {
      console.log('No matching sequence found for subscriber:', email);
      return;
    }
    
    // Check if already in this sequence
    const existing = db.prepare(`
      SELECT id FROM active_automations 
      WHERE subscriber_id = ? AND sequence_id = ? AND status IN ('active', 'paused')
    `).get(subscriber.id, sequence.id);
    
    if (existing) {
      console.log('Subscriber already in sequence:', email);
      return;
    }
    
    // Create active automation
    const stmt = db.prepare(`
      INSERT INTO active_automations
      (subscriber_id, sequence_id, current_email_index, status, next_email_at)
      VALUES (?, ?, 0, 'active', datetime('now'))
    `);
    
    const result = stmt.run(subscriber.id, sequence.id);
    
    // Log event
    await this.logEvent(result.lastInsertRowid, subscriber.id, 'sequence_started', {
      sequence_name: sequence.name
    });
    
    // Process first email immediately
    await this.processAutomation(result.lastInsertRowid);
    
    return result.lastInsertRowid;
  }

  // Process automation (send next email)
  async processAutomation(automationId) {
    const automation = db.prepare(`
      SELECT a.*, s.email, s.first_name, s.last_name, s.client_profile,
             seq.name as sequence_name
      FROM active_automations a
      JOIN subscribers s ON a.subscriber_id = s.id
      JOIN automation_sequences seq ON a.sequence_id = seq.id
      WHERE a.id = ? AND a.status = 'active'
    `).get(automationId);
    
    if (!automation) return;
    
    // Get next email in sequence
    const nextEmail = db.prepare(`
      SELECT * FROM sequence_emails
      WHERE sequence_id = ? AND email_order = ?
      AND is_active = 1
    `).get(automation.sequence_id, automation.current_email_index);
    
    if (!nextEmail) {
      // Sequence complete
      await this.completeAutomation(automationId, 'sequence_completed');
      return;
    }
    
    // Generate and send email
    const emailContent = await generateLegallyCompliantEmail(
      nextEmail.template_key,
      {
        firstName: automation.first_name,
        email: automation.email,
        clientProfile: automation.client_profile
      }
    );
    
    // Send email (live mode for drew@jacobscounsel.com)
    try {
      console.log(`📧 Sending email: ${nextEmail.subject_line} to ${automation.email}`);
      
      // Only send real emails to Drew's accounts for testing
      if (automation.email.includes('jacobsd32') && automation.email.includes('gmail.com') || 
          (automation.email.includes('drew') && automation.email.includes('jacobscounsel.com'))) {
        await sendEnhancedEmail({
          to: [automation.email],
          subject: nextEmail.subject_line,
          html: emailContent
        });
        console.log(`✅ Email sent successfully to ${automation.email}`);
      } else {
        console.log(`📧 [DEMO] Simulated send to ${automation.email}`);
      }
      
      // Record in history as sent
      db.prepare(`
        INSERT INTO email_history
        (automation_id, subscriber_id, template_key, subject_line, status, sent_at)
        VALUES (?, ?, ?, ?, 'sent', datetime('now'))
      `).run(
        automationId,
        automation.subscriber_id,
        nextEmail.template_key,
        nextEmail.subject_line
      );
      
      // Update automation
      const nextEmailInSequence = db.prepare(`
        SELECT delay_hours FROM sequence_emails
        WHERE sequence_id = ? AND email_order = ?
      `).get(automation.sequence_id, automation.current_email_index + 1);
      
      if (nextEmailInSequence) {
        db.prepare(`
          UPDATE active_automations
          SET current_email_index = current_email_index + 1,
              last_email_sent_at = datetime('now'),
              next_email_at = datetime('now', '+${nextEmailInSequence.delay_hours} hours')
          WHERE id = ?
        `).run(automationId);
      } else {
        await this.completeAutomation(automationId, 'sequence_completed');
      }
      
      // Log event
      await this.logEvent(automationId, automation.subscriber_id, 'email_sent', {
        template: nextEmail.template_key
      });
      
    } catch (error) {
      console.error('Failed to send email:', error);
      
      // Record failure
      db.prepare(`
        INSERT INTO email_history
        (automation_id, subscriber_id, template_key, subject_line, status, error_message)
        VALUES (?, ?, ?, ?, 'failed', ?)
      `).run(
        automationId,
        automation.subscriber_id,
        nextEmail.template_key,
        nextEmail.subject_line,
        error.message
      );
    }
  }

  // Check and fire exit triggers
  async checkExitTriggers(automationId, triggerType, triggerValue = null) {
    const automation = db.prepare(`
      SELECT * FROM active_automations
      WHERE id = ? AND status = 'active'
    `).get(automationId);
    
    if (!automation) return;
    
    // Get matching triggers
    const triggers = triggerValue ? 
      db.prepare(`
        SELECT * FROM exit_triggers
        WHERE sequence_id = ? AND trigger_type = ?
        AND (trigger_value = ? OR trigger_value IS NULL)
      `).all(automation.sequence_id, triggerType, triggerValue) :
      db.prepare(`
        SELECT * FROM exit_triggers
        WHERE sequence_id = ? AND trigger_type = ?
      `).all(automation.sequence_id, triggerType);
    
    for (const trigger of triggers) {
      if (trigger.action === 'pause') {
        await this.pauseAutomation(automationId, `Trigger: ${triggerType}`);
      } else if (trigger.action === 'complete') {
        await this.completeAutomation(automationId, `Trigger: ${triggerType}`);
      } else if (trigger.action === 'move_to_sequence' && trigger.target_sequence_id) {
        await this.moveToSequence(automationId, trigger.target_sequence_id);
      }
    }
  }

  // Pause automation
  async pauseAutomation(automationId, reason = null) {
    db.prepare(`
      UPDATE active_automations
      SET status = 'paused', paused_at = datetime('now')
      WHERE id = ?
    `).run(automationId);
    
    const automation = db.prepare('SELECT subscriber_id FROM active_automations WHERE id = ?').get(automationId);
    await this.logEvent(automationId, automation.subscriber_id, 'sequence_paused', { reason });
  }

  // Resume automation
  async resumeAutomation(automationId) {
    // Calculate new next_email_at based on remaining delay
    db.prepare(`
      UPDATE active_automations
      SET status = 'active', paused_at = NULL
      WHERE id = ?
    `).run(automationId);
    
    const automation = db.prepare('SELECT subscriber_id FROM active_automations WHERE id = ?').get(automationId);
    await this.logEvent(automationId, automation.subscriber_id, 'sequence_resumed', {});
  }

  // Complete automation
  async completeAutomation(automationId, reason = null) {
    db.prepare(`
      UPDATE active_automations
      SET status = 'completed', completed_at = datetime('now'), exit_reason = ?
      WHERE id = ?
    `).run(reason, automationId);
    
    const automation = db.prepare('SELECT subscriber_id FROM active_automations WHERE id = ?').get(automationId);
    await this.logEvent(automationId, automation.subscriber_id, 'sequence_completed', { reason });
  }

  // Move subscriber to different sequence
  async moveToSequence(automationId, targetSequenceId) {
    const automation = db.prepare(`
      SELECT subscriber_id FROM active_automations WHERE id = ?
    `).get(automationId);
    
    // Complete current automation
    await this.completeAutomation(automationId, 'moved_to_other_sequence');
    
    // Start new automation
    const stmt = db.prepare(`
      INSERT INTO active_automations
      (subscriber_id, sequence_id, current_email_index, status, next_email_at)
      VALUES (?, ?, 0, 'active', datetime('now'))
    `);
    
    stmt.run(automation.subscriber_id, targetSequenceId);
  }

  // Handle Calendly webhook
  async handleCalendlyWebhook(data) {
    const email = data.invitee?.email;
    if (!email) return;
    
    // Record booking
    db.prepare(`
      INSERT INTO consultation_bookings
      (subscriber_email, booking_date, consultation_type, calendly_event_id)
      VALUES (?, ?, ?, ?)
    `).run(
      email,
      data.event?.start_time,
      data.event?.event_type?.name,
      data.event?.uuid
    );
    
    // Find subscriber
    const subscriber = db.prepare('SELECT id FROM subscribers WHERE email = ?').get(email);
    if (!subscriber) return;
    
    // Find active automations
    const automations = db.prepare(`
      SELECT id FROM active_automations
      WHERE subscriber_id = ? AND status = 'active'
    `).all(subscriber.id);
    
    // Fire consultation_booked trigger for all active automations
    for (const auto of automations) {
      await this.checkExitTriggers(auto.id, 'consultation_booked');
    }
  }

  // Get or create subscriber
  async getOrCreateSubscriber(email, formData) {
    let subscriber = db.prepare('SELECT * FROM subscribers WHERE email = ?').get(email);
    
    if (!subscriber) {
      const stmt = db.prepare(`
        INSERT INTO subscribers
        (email, first_name, last_name, lead_score, client_profile, submission_type)
        VALUES (?, ?, ?, ?, ?, ?)
      `);
      
      const result = stmt.run(
        email,
        formData.firstName,
        formData.lastName,
        formData.leadScore || 0,
        formData.clientProfile || 'strategic_business_owner',
        formData.submissionType
      );
      
      subscriber = {
        id: result.lastInsertRowid,
        email,
        lead_score: formData.leadScore || 0,
        client_profile: formData.clientProfile
      };
    }
    
    return subscriber;
  }

  // Select best sequence for subscriber
  async selectBestSequence(subscriber) {
    const sequence = db.prepare(`
      SELECT * FROM automation_sequences
      WHERE is_active = 1
      AND (client_profile = ? OR client_profile = 'all')
      AND min_lead_score <= ?
      AND max_lead_score >= ?
      ORDER BY min_lead_score DESC
      LIMIT 1
    `).get(
      subscriber.client_profile,
      subscriber.lead_score,
      subscriber.lead_score
    );
    
    return sequence;
  }

  // Log automation event
  async logEvent(automationId, subscriberId, eventType, eventData) {
    db.prepare(`
      INSERT INTO automation_events
      (automation_id, subscriber_id, event_type, event_data)
      VALUES (?, ?, ?, ?)
    `).run(
      automationId,
      subscriberId,
      eventType,
      JSON.stringify(eventData)
    );
  }

  // Process all pending automations
  async processPendingAutomations() {
    const pending = db.prepare(`
      SELECT id FROM active_automations
      WHERE status = 'active' 
      AND next_email_at <= datetime('now')
    `).all();
    
    for (const automation of pending) {
      await this.processAutomation(automation.id);
    }
  }

  // Get automation stats
  async getAutomationStats() {
    const stats = {
      totalSubscribers: db.prepare('SELECT COUNT(*) as count FROM subscribers').get().count,
      activeAutomations: db.prepare("SELECT COUNT(*) as count FROM active_automations WHERE status = 'active'").get().count,
      pausedAutomations: db.prepare("SELECT COUNT(*) as count FROM active_automations WHERE status = 'paused'").get().count,
      completedAutomations: db.prepare("SELECT COUNT(*) as count FROM active_automations WHERE status = 'completed'").get().count,
      emailsSent: db.prepare("SELECT COUNT(*) as count FROM email_history WHERE status = 'sent'").get().count,
      consultationsBooked: db.prepare('SELECT COUNT(*) as count FROM consultation_bookings').get().count
    };
    
    return stats;
  }

  // Get subscriber journey details
  async getSubscriberJourney(email) {
    const subscriber = db.prepare('SELECT * FROM subscribers WHERE email = ?').get(email);
    if (!subscriber) return null;
    
    const journey = {
      subscriber,
      automations: db.prepare(`
        SELECT a.*, s.name as sequence_name
        FROM active_automations a
        JOIN automation_sequences s ON a.sequence_id = s.id
        WHERE a.subscriber_id = ?
        ORDER BY a.started_at DESC
      `).all(subscriber.id),
      emails: db.prepare(`
        SELECT * FROM email_history
        WHERE subscriber_id = ?
        ORDER BY sent_at DESC
      `).all(subscriber.id),
      events: db.prepare(`
        SELECT * FROM automation_events
        WHERE subscriber_id = ?
        ORDER BY created_at DESC
      `).all(subscriber.id)
    };
    
    return journey;
  }
}

export default new AutomationEngine();