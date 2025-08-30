// Email Processing Service - Handles scheduled emails and cron jobs
import cron from 'node-cron';
import { processScheduledEmails } from './customEmailAutomation.js';
import { log } from '../utils/logger.js';
import db from '../models/database.js';

class EmailProcessor {
  constructor() {
    this.isRunning = false;
    this.cronJob = null;
    this.stats = {
      lastRun: null,
      totalProcessed: 0,
      successfulSends: 0,
      failedSends: 0,
      uptime: Date.now()
    };
  }

  // Start the email processing service
  start() {
    if (this.cronJob) {
      log.warn('Email processor already running');
      return;
    }

    // Run every minute to check for emails to send
    this.cronJob = cron.schedule('* * * * *', async () => {
      await this.processEmails();
    }, {
      scheduled: true,
      timezone: "America/New_York"
    });

    // Run immediately on startup
    setTimeout(() => this.processEmails(), 5000);

    log.info('📧 Email processor started - checking every minute');
  }

  // Stop the email processing service
  stop() {
    if (this.cronJob) {
      this.cronJob.destroy();
      this.cronJob = null;
      log.info('📧 Email processor stopped');
    }
  }

  // Process scheduled emails
  async processEmails() {
    if (this.isRunning) {
      log.debug('Email processor already running, skipping');
      return;
    }

    this.isRunning = true;
    this.stats.lastRun = new Date();

    try {
      const processed = await processScheduledEmails();
      
      if (processed > 0) {
        log.info(`📧 Processed ${processed} scheduled emails`);
        this.stats.totalProcessed += processed;
        
        // Update success/failure counts
        const results = await this.getRecentResults();
        this.stats.successfulSends += results.successful;
        this.stats.failedSends += results.failed;
      }

      // Clean up old email records periodically
      if (this.shouldCleanup()) {
        await this.cleanupOldRecords();
      }

    } catch (error) {
      log.error('Email processor error:', error);
    } finally {
      this.isRunning = false;
    }
  }

  // Get recent email results for stats
  async getRecentResults() {
    try {
      const results = db.prepare(`
        SELECT status, COUNT(*) as count
        FROM scheduled_emails
        WHERE sent_at >= datetime('now', '-1 hour')
        GROUP BY status
      `).all();

      const successful = results.find(r => r.status === 'sent')?.count || 0;
      const failed = results.find(r => r.status === 'failed')?.count || 0;

      return { successful, failed };
    } catch (error) {
      log.error('Failed to get recent email results:', error);
      return { successful: 0, failed: 0 };
    }
  }

  // Check if we should run cleanup
  shouldCleanup() {
    const now = new Date();
    const lastCleanup = this.stats.lastCleanup || new Date(0);
    const hoursSinceCleanup = (now - lastCleanup) / (1000 * 60 * 60);
    return hoursSinceCleanup >= 24; // Cleanup daily
  }

  // Clean up old email records
  async cleanupOldRecords() {
    try {
      // Delete sent emails older than 30 days
      const deletedEmails = db.prepare(`
        DELETE FROM scheduled_emails 
        WHERE status = 'sent' AND sent_at < datetime('now', '-30 days')
      `).run();

      // Delete old email engagement records
      const deletedEngagement = db.prepare(`
        DELETE FROM email_engagement 
        WHERE created_at < datetime('now', '-30 days')
      `).run();

      // Vacuum the database to reclaim space
      db.exec('VACUUM');

      this.stats.lastCleanup = new Date();

      log.info('🧹 Email cleanup completed', {
        deletedEmails: deletedEmails.changes,
        deletedEngagement: deletedEngagement.changes
      });

    } catch (error) {
      log.error('Email cleanup failed:', error);
    }
  }

  // Get processing statistics
  getStats() {
    return {
      ...this.stats,
      isRunning: this.isRunning,
      uptime: Date.now() - this.stats.uptime,
      cronActive: !!this.cronJob
    };
  }

  // Manual email processing trigger
  async triggerProcessing() {
    log.info('📧 Manual email processing triggered');
    return await this.processEmails();
  }

  // Pause all active automations (emergency stop)
  async pauseAllAutomations() {
    try {
      const result = db.prepare(`
        UPDATE email_automations 
        SET status = 'paused', 
            paused_reason = 'Emergency pause',
            updated_at = datetime('now')
        WHERE status = 'active'
      `).run();

      // Pause all pending emails
      db.prepare(`
        UPDATE scheduled_emails 
        SET status = 'paused'
        WHERE status = 'pending'
      `).run();

      log.warn('🛑 Emergency pause: All email automations paused', {
        automationsPaused: result.changes
      });

      return {
        success: true,
        automationsPaused: result.changes
      };

    } catch (error) {
      log.error('Failed to pause all automations:', error);
      throw error;
    }
  }

  // Resume all paused automations
  async resumeAllAutomations() {
    try {
      const result = db.prepare(`
        UPDATE email_automations 
        SET status = 'active',
            paused_reason = NULL,
            updated_at = datetime('now')
        WHERE status = 'paused' AND paused_reason = 'Emergency pause'
      `).run();

      // Resume all paused emails
      db.prepare(`
        UPDATE scheduled_emails 
        SET status = 'pending'
        WHERE status = 'paused'
      `).run();

      log.info('▶️ All email automations resumed', {
        automationsResumed: result.changes
      });

      return {
        success: true,
        automationsResumed: result.changes
      };

    } catch (error) {
      log.error('Failed to resume all automations:', error);
      throw error;
    }
  }

  // Get queue status
  async getQueueStatus() {
    try {
      const pending = db.prepare(`
        SELECT COUNT(*) as count
        FROM scheduled_emails
        WHERE status = 'pending' AND send_at <= datetime('now', '+1 hour')
      `).get();

      const overdue = db.prepare(`
        SELECT COUNT(*) as count
        FROM scheduled_emails
        WHERE status = 'pending' AND send_at < datetime('now')
      `).get();

      const today = db.prepare(`
        SELECT COUNT(*) as count
        FROM scheduled_emails
        WHERE status = 'pending' 
          AND date(send_at) = date('now')
      `).get();

      return {
        pendingNextHour: pending.count,
        overdue: overdue.count,
        scheduledToday: today.count
      };

    } catch (error) {
      log.error('Failed to get queue status:', error);
      return {
        pendingNextHour: 0,
        overdue: 0,
        scheduledToday: 0
      };
    }
  }

  // Test email functionality
  async testEmail(email = 'test@jacobscounsellaw.com') {
    try {
      const { sendEmail } = await import('./emailService.js');
      
      const testHtml = `
        <html>
          <body style="font-family: Arial, sans-serif; padding: 20px;">
            <h2 style="color: #ff4d00;">Email System Test</h2>
            <p>This is a test email from the Jacobs Counsel email automation system.</p>
            <p><strong>Timestamp:</strong> ${new Date().toISOString()}</p>
            <p><strong>Status:</strong> All systems operational ✅</p>
          </body>
        </html>
      `;

      const result = await sendEmail(
        email,
        'Email System Test - Jacobs Counsel',
        testHtml
      );

      log.info('📧 Test email sent successfully', { 
        to: email, 
        provider: result.provider 
      });

      return {
        success: true,
        provider: result.provider,
        messageId: result.messageId
      };

    } catch (error) {
      log.error('Test email failed:', error);
      throw error;
    }
  }
}

// Create singleton instance
const emailProcessor = new EmailProcessor();

// Export the processor and utility functions
export default emailProcessor;

export const {
  start: startEmailProcessor,
  stop: stopEmailProcessor,
  getStats: getEmailProcessorStats,
  triggerProcessing: triggerEmailProcessing,
  pauseAllAutomations,
  resumeAllAutomations,
  getQueueStatus,
  testEmail
} = emailProcessor;

// Auto-start in production
if (process.env.NODE_ENV === 'production') {
  emailProcessor.start();
}

// Graceful shutdown
process.on('SIGTERM', () => {
  log.info('Shutting down email processor...');
  emailProcessor.stop();
});

process.on('SIGINT', () => {
  log.info('Shutting down email processor...');
  emailProcessor.stop();
});