// Smart Consultation Booking Handler
// Automatically pauses email sequences and manages post-consultation flows

import db from "../models/database-production.js";
import { log } from '../utils/logger.js';
import { processCustomEmailAutomation } from './customEmailAutomation.js';
import { sendEmail } from './emailService.js';

class ConsultationHandler {
  constructor() {
    this.consultationTypes = {
      'general': {
        name: 'General Consultation',
        pauseReason: 'General consultation booked',
        followupDelay: 24 * 60 * 60 * 1000, // 24 hours
        followupSequence: 'post-consultation-general'
      },
      'estate-planning': {
        name: 'Estate Planning Consultation', 
        pauseReason: 'Estate planning consultation booked',
        followupDelay: 2 * 60 * 60 * 1000, // 2 hours
        followupSequence: 'post-consultation-estate'
      },
      'business-formation': {
        name: 'Business Formation Consultation',
        pauseReason: 'Business formation consultation booked', 
        followupDelay: 4 * 60 * 60 * 1000, // 4 hours
        followupSequence: 'post-consultation-business'
      },
      'brand-protection': {
        name: 'Brand Protection Consultation',
        pauseReason: 'Brand protection consultation booked',
        followupDelay: 6 * 60 * 60 * 1000, // 6 hours
        followupSequence: 'post-consultation-brand'
      },
      'outside-counsel': {
        name: 'Outside Counsel Consultation',
        pauseReason: 'Outside counsel consultation booked',
        followupDelay: 1 * 60 * 60 * 1000, // 1 hour
        followupSequence: 'post-consultation-counsel'
      },
      'vip': {
        name: 'VIP Strategic Consultation',
        pauseReason: 'VIP consultation booked',
        followupDelay: 30 * 60 * 1000, // 30 minutes
        followupSequence: 'post-consultation-vip'
      }
    };
  }

  // Handle new consultation booking
  async handleConsultationBooking(bookingData) {
    const {
      email,
      consultationType = 'general',
      bookingSource = 'calendly',
      scheduledTime,
      bookingId,
      attendeeInfo = {}
    } = bookingData;

    if (!email) {
      throw new Error('Email is required for consultation booking');
    }

    try {
      log.info('🗓️ Processing consultation booking', {
        email,
        consultationType,
        scheduledTime,
        bookingId
      });

      // Record the consultation booking
      const bookingRecordId = await this.recordConsultationBooking({
        email,
        consultationType,
        bookingSource,
        scheduledTime,
        bookingId,
        attendeeInfo
      });

      // Pause existing email automations
      const pauseResult = await this.pauseEmailAutomations(email, consultationType);

      // Schedule post-consultation follow-up
      await this.schedulePostConsultationFollowup(email, consultationType, scheduledTime);

      // Send immediate confirmation
      await this.sendConsultationConfirmation(email, consultationType, scheduledTime, attendeeInfo);

      // Update lead record if exists
      await this.updateLeadRecord(email, consultationType, bookingId);

      log.info('✅ Consultation booking processed successfully', {
        email,
        bookingRecordId,
        automationsPaused: pauseResult.automationsPaused,
        emailsPaused: pauseResult.emailsPaused
      });

      return {
        success: true,
        bookingRecordId,
        automationsPaused: pauseResult.automationsPaused,
        emailsPaused: pauseResult.emailsPaused
      };

    } catch (error) {
      log.error('❌ Failed to process consultation booking:', error);
      throw error;
    }
  }

  // Record consultation booking in database
  async recordConsultationBooking(bookingData) {
    const stmt = db.prepare(`
      INSERT INTO consultation_bookings (
        email, booking_type, booking_status, booking_data, created_at
      ) VALUES (?, ?, ?, ?, datetime('now'))
    `);

    const result = stmt.run(
      bookingData.email,
      bookingData.consultationType,
      'scheduled',
      JSON.stringify(bookingData)
    );

    return result.lastInsertRowid;
  }

  // Pause existing email automations
  async pauseEmailAutomations(email, consultationType) {
    const consultationConfig = this.consultationTypes[consultationType] || this.consultationTypes.general;

    try {
      // Pause active automations
      const automationResult = db.prepare(`
        UPDATE email_automations 
        SET status = 'paused',
            paused_reason = ?,
            consultation_booked = 'yes',
            updated_at = datetime('now')
        WHERE email = ? AND status = 'active'
      `).run(consultationConfig.pauseReason, email);

      // Pause pending emails
      const emailResult = db.prepare(`
        UPDATE scheduled_emails 
        SET status = 'paused'
        WHERE email = ? AND status = 'pending'
      `).run(email);

      log.info('⏸️ Email automations paused for consultation', {
        email,
        automationsPaused: automationResult.changes,
        emailsPaused: emailResult.changes,
        reason: consultationConfig.pauseReason
      });

      return {
        automationsPaused: automationResult.changes,
        emailsPaused: emailResult.changes
      };

    } catch (error) {
      log.error('Failed to pause email automations:', error);
      throw error;
    }
  }

  // Schedule post-consultation follow-up sequence
  async schedulePostConsultationFollowup(email, consultationType, scheduledTime) {
    const consultationConfig = this.consultationTypes[consultationType] || this.consultationTypes.general;
    
    // Calculate follow-up time (delay after consultation)
    const consultationDateTime = new Date(scheduledTime);
    const followupTime = new Date(consultationDateTime.getTime() + consultationConfig.followupDelay);

    try {
      // Create a special follow-up automation record
      const stmt = db.prepare(`
        INSERT INTO email_automations (
          email, pathway_name, trigger_type, status, created_at
        ) VALUES (?, ?, ?, 'scheduled', datetime('now'))
      `);

      stmt.run(
        email,
        `Post-Consultation ${consultationConfig.name}`,
        consultationConfig.followupSequence
      );

      log.info('📅 Post-consultation follow-up scheduled', {
        email,
        consultationType,
        followupTime: followupTime.toISOString(),
        sequence: consultationConfig.followupSequence
      });

    } catch (error) {
      log.error('Failed to schedule post-consultation follow-up:', error);
      // Don't throw - this is not critical
    }
  }

  // Send consultation confirmation email
  async sendConsultationConfirmation(email, consultationType, scheduledTime, attendeeInfo) {
    const consultationConfig = this.consultationTypes[consultationType] || this.consultationTypes.general;
    const clientName = attendeeInfo.firstName || attendeeInfo.name?.split(' ')[0] || 'there';
    
    const confirmationHtml = this.generateConfirmationEmail(
      clientName,
      consultationType,
      consultationConfig.name,
      scheduledTime,
      attendeeInfo
    );

    try {
      await sendEmail(
        email,
        `Consultation Confirmed: ${consultationConfig.name} - Jacobs Counsel`,
        confirmationHtml
      );

      log.info('📧 Consultation confirmation sent', { email, consultationType });

    } catch (error) {
      log.error('Failed to send consultation confirmation:', error);
      // Don't throw - the main booking should still succeed
    }
  }

  // Generate confirmation email HTML
  generateConfirmationEmail(clientName, consultationType, consultationName, scheduledTime, attendeeInfo) {
    const scheduleDate = new Date(scheduledTime);
    const formattedDate = scheduleDate.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long', 
      day: 'numeric'
    });
    const formattedTime = scheduleDate.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      timeZoneName: 'short'
    });

    // Preparation checklist based on consultation type
    let preparationItems = [];
    
    switch (consultationType) {
      case 'estate-planning':
        preparationItems = [
          'Current will and trust documents',
          'List of assets (real estate, investments, business interests)',
          'Beneficiary preferences and family structure',
          'Current insurance policies'
        ];
        break;
      case 'business-formation':
        preparationItems = [
          'Business concept and structure preferences',
          'Ownership and equity distribution plans',
          'Funding and investment timeline',
          'Intellectual property considerations'
        ];
        break;
      case 'brand-protection':
        preparationItems = [
          'Brand names, logos, and slogans to protect',
          'Evidence of brand use in commerce',
          'Competitor analysis and potential conflicts',
          'International expansion plans'
        ];
        break;
      case 'outside-counsel':
        preparationItems = [
          'Current legal challenges and priorities',
          'Existing legal vendor relationships',
          'Budget parameters for ongoing support',
          'Communication preferences and expectations'
        ];
        break;
      default:
        preparationItems = [
          'List of your specific legal concerns',
          'Any relevant documents or contracts',
          'Timeline for your legal objectives',
          'Budget considerations'
        ];
    }

    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Consultation Confirmed - Jacobs Counsel</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 20px; background-color: #f8fafc; color: #1f2937; line-height: 1.6;">
  <div style="max-width: 650px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);">
    
    <!-- Header -->
    <div style="background: linear-gradient(135deg, #1f2937 0%, #374151 100%); padding: 40px 30px; text-align: center; color: #ffffff;">
      <div style="background: #ffffff; width: 60px; height: 60px; border-radius: 50%; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center; font-size: 24px;">🗓️</div>
      <h1 style="margin: 0 0 8px; font-size: 26px; font-weight: 700; color: #ffffff;">Consultation Confirmed</h1>
      <p style="margin: 0; font-size: 16px; color: #d1d5db; font-weight: 500;">Jacobs Counsel LLC | Strategic Legal Solutions</p>
    </div>
    
    <!-- Main Content -->
    <div style="padding: 40px 30px; color: #1f2937;">
      <h2 style="color: #1f2937; margin: 0 0 16px; font-size: 22px; font-weight: 700;">Hello ${clientName},</h2>
      
      <p style="font-size: 16px; line-height: 1.7; margin: 0 0 24px; color: #374151;">
        Your ${consultationName.toLowerCase()} is confirmed! I'm looking forward to discussing your legal strategy and helping you achieve your objectives.
      </p>
      
      <!-- Consultation Details -->
      <div style="background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%); border: 2px solid #3b82f6; border-radius: 12px; padding: 24px; margin: 24px 0; text-align: center;">
        <h3 style="color: #1d4ed8; margin: 0 0 16px; font-size: 20px; font-weight: 700;">${consultationName}</h3>
        <p style="color: #1d4ed8; font-size: 18px; font-weight: 600; margin: 0 0 8px;">${formattedDate}</p>
        <p style="color: #1d4ed8; font-size: 18px; font-weight: 600; margin: 0;">${formattedTime}</p>
        <div style="margin-top: 16px;">
          <a href="https://calendly.com/jacobscounsel" target="_blank" 
             style="display: inline-block; background: #ffffff; color: #1d4ed8; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: 700; font-size: 14px;">
            View/Modify Appointment
          </a>
        </div>
      </div>
      
      <!-- Preparation Checklist -->
      <div style="background: #f8fafc; border-radius: 12px; padding: 28px; margin: 28px 0; border: 1px solid #e5e7eb;">
        <h3 style="color: #1f2937; margin: 0 0 20px; font-size: 20px; font-weight: 700;">📋 How to Prepare</h3>
        <p style="color: #374151; margin: 0 0 16px;">To maximize our consultation time, please gather:</p>
        <ul style="color: #374151; line-height: 1.7; margin: 0; padding-left: 0; list-style: none; font-size: 15px;">
          ${preparationItems.map(item => 
            `<li style="margin: 12px 0; padding: 12px; background: #ffffff; border-radius: 8px; border-left: 4px solid #f59e0b; font-weight: 500;">
              ✓ ${item}
            </li>`
          ).join('')}
        </ul>
      </div>
      
      <!-- What to Expect -->
      <div style="background: #f0fdf4; border: 2px solid #bbf7d0; border-radius: 12px; padding: 24px; margin: 28px 0;">
        <h3 style="color: #15803d; margin: 0 0 16px; font-size: 18px; font-weight: 700;">What to Expect</h3>
        <ul style="color: #15803d; margin: 0; padding-left: 20px; font-size: 15px; line-height: 1.7;">
          <li>Deep-dive analysis of your specific legal needs and objectives</li>
          <li>Strategic recommendations tailored to your situation</li>
          <li>Clear action plan with priorities and timelines</li>
          <li>Transparent discussion of costs and next steps</li>
        </ul>
      </div>
      
      <!-- Contact Information -->
      <div style="background: #fef7ed; border: 2px solid #fed7aa; border-radius: 8px; padding: 20px; margin: 28px 0;">
        <h4 style="color: #9a3412; margin: 0 0 12px; font-size: 16px; font-weight: 700;">Questions Before Our Meeting?</h4>
        <p style="color: #9a3412; font-size: 14px; line-height: 1.6; margin: 0;">
          Feel free to reach out: <a href="mailto:drew@jacobscounsellaw.com" style="color: #dc2626; text-decoration: none; font-weight: 600;">drew@jacobscounsellaw.com</a> | 
          <a href="tel:6463437227" style="color: #dc2626; text-decoration: none; font-weight: 600;">646-343-7227</a>
        </p>
      </div>
      
      <p style="font-size: 16px; color: #374151; margin: 24px 0 0;">
        I look forward to working with you to build a strategic legal foundation that protects and advances your interests.
      </p>
      
      <p style="font-size: 16px; color: #1f2937; margin: 24px 0 0; font-weight: 600;">
        Best regards,<br>
        <strong>Drew Jacobs, Esq.</strong><br>
        Founder & Managing Attorney<br>
        Jacobs Counsel LLC
      </p>
    </div>
    
    <!-- Footer -->
    <div style="background: #1f2937; padding: 24px 30px; color: #d1d5db; text-align: center; font-size: 12px; line-height: 1.5;">
      <p style="margin: 0 0 8px;">© 2025 Jacobs Counsel LLC. All rights reserved.</p>
      <p style="margin: 0;">This communication may contain confidential information.</p>
    </div>
  </div>
</body>
</html>`;
  }

  // Update lead record with consultation information
  async updateLeadRecord(email, consultationType, bookingId) {
    try {
      const result = db.prepare(`
        UPDATE leads 
        SET updated_at = datetime('now')
        WHERE email = ?
      `).run(email);

      if (result.changes > 0) {
        // Log the interaction
        const leadStmt = db.prepare('SELECT id FROM leads WHERE email = ?');
        const lead = leadStmt.get(email);
        
        if (lead) {
          db.prepare(`
            INSERT INTO lead_interactions (lead_id, interaction_type, details, created_at)
            VALUES (?, ?, ?, datetime('now'))
          `).run(lead.id, 'consultation_booked', JSON.stringify({
            consultationType,
            bookingId,
            timestamp: new Date().toISOString()
          }));
        }
      }

      log.info('📊 Lead record updated for consultation', { email, consultationType });

    } catch (error) {
      log.error('Failed to update lead record:', error);
      // Don't throw - this is not critical
    }
  }

  // Handle consultation completion (post-consultation)
  async handleConsultationCompleted(email, consultationType, outcome = 'completed') {
    try {
      // Update consultation booking status
      db.prepare(`
        UPDATE consultation_bookings
        SET booking_status = ?,
            booking_data = json_set(booking_data, '$.completedAt', datetime('now'))
        WHERE email = ? AND booking_type = ? AND booking_status = 'scheduled'
      `).run(outcome, email, consultationType);

      // Start post-consultation sequence if outcome is positive
      if (outcome === 'completed' || outcome === 'interested') {
        const consultationConfig = this.consultationTypes[consultationType] || this.consultationTypes.general;
        
        // This would trigger a new automation sequence
        // For now, we'll just log it
        log.info('🎯 Starting post-consultation sequence', {
          email,
          consultationType,
          sequence: consultationConfig.followupSequence
        });
      }

      return { success: true };

    } catch (error) {
      log.error('Failed to handle consultation completion:', error);
      throw error;
    }
  }

  // Handle consultation cancellation
  async handleConsultationCancellation(email, consultationType, reason = 'cancelled') {
    try {
      // Update consultation booking status
      db.prepare(`
        UPDATE consultation_bookings
        SET booking_status = 'cancelled',
            booking_data = json_set(booking_data, '$.cancelledAt', datetime('now'), '$.cancelReason', ?)
        WHERE email = ? AND booking_type = ? AND booking_status = 'scheduled'
      `).run(reason, email, consultationType);

      // Resume paused automations
      const resumeResult = db.prepare(`
        UPDATE email_automations
        SET status = 'active',
            paused_reason = NULL,
            consultation_booked = NULL,
            updated_at = datetime('now')
        WHERE email = ? AND status = 'paused' AND paused_reason LIKE '%consultation%'
      `).run(email);

      // Resume paused emails (recalculate send times)
      const pausedEmails = db.prepare(`
        SELECT * FROM scheduled_emails 
        WHERE email = ? AND status = 'paused'
        ORDER BY send_at ASC
      `).all(email);

      // Reschedule paused emails
      for (let i = 0; i < pausedEmails.length; i++) {
        const email_record = pausedEmails[i];
        const newSendTime = new Date(Date.now() + (i * 24 * 60 * 60 * 1000)); // Space them out daily

        db.prepare(`
          UPDATE scheduled_emails
          SET status = 'pending',
              send_at = ?
          WHERE id = ?
        `).run(newSendTime.toISOString(), email_record.id);
      }

      log.info('📅 Consultation cancelled, email sequences resumed', {
        email,
        consultationType,
        automationsResumed: resumeResult.changes,
        emailsRescheduled: pausedEmails.length,
        reason
      });

      return {
        success: true,
        automationsResumed: resumeResult.changes,
        emailsRescheduled: pausedEmails.length
      };

    } catch (error) {
      log.error('Failed to handle consultation cancellation:', error);
      throw error;
    }
  }

  // Get consultation statistics
  async getConsultationStats() {
    try {
      const stats = db.prepare(`
        SELECT 
          booking_type,
          booking_status,
          COUNT(*) as count
        FROM consultation_bookings
        WHERE created_at >= datetime('now', '-30 days')
        GROUP BY booking_type, booking_status
      `).all();

      const automationsPaused = db.prepare(`
        SELECT COUNT(*) as count
        FROM email_automations
        WHERE status = 'paused' AND paused_reason LIKE '%consultation%'
      `).get();

      return {
        consultationStats: stats,
        automationsPausedForConsultations: automationsPaused.count
      };

    } catch (error) {
      log.error('Failed to get consultation stats:', error);
      return {
        consultationStats: [],
        automationsPausedForConsultations: 0
      };
    }
  }
}

// Create singleton instance
const consultationHandler = new ConsultationHandler();

export default consultationHandler;

// Export main functions
export const {
  handleConsultationBooking,
  handleConsultationCompleted,
  handleConsultationCancellation,
  getConsultationStats
} = consultationHandler;