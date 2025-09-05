// Email Automation Dashboard API Routes
import express from 'express';
import db from "../models/database-production.js";
import { log } from '../utils/logger.js';
import { CustomEmailAutomation, processScheduledEmails } from '../services/customEmailAutomation.js';
import consultationHandler from '../services/consultationHandler.js';
import { generateLegallyCompliantEmail } from '../services/legallyCompliantEmailTemplates.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Generate dashboard HTML with server-side data
function generateDashboardWithData(journeys, contacts, emails) {
  const activeContacts = contacts.filter(c => c.status === 'active').length;
  const totalContacts = contacts.length;
  const pendingEmails = emails.filter(e => e.status === 'pending').length;
  
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Email Automation Dashboard | Jacobs Counsel</title>
    <style>
        body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: #f8fafc; 
            margin: 0; 
            padding: 20px; 
        }
        .header { 
            text-align: center; 
            margin-bottom: 30px; 
        }
        .stats { 
            display: flex; 
            gap: 20px; 
            margin-bottom: 30px; 
            justify-content: center;
        }
        .stat-card { 
            background: white; 
            padding: 20px; 
            border-radius: 8px; 
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            text-align: center;
            min-width: 150px;
        }
        .stat-number { 
            font-size: 2em; 
            font-weight: bold; 
            color: #ff4d00; 
        }
        .section { 
            background: white; 
            margin: 20px 0; 
            padding: 20px; 
            border-radius: 8px; 
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .contact-item { 
            padding: 10px; 
            border-bottom: 1px solid #eee; 
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        .email-item { 
            padding: 10px; 
            border-bottom: 1px solid #eee; 
        }
        .status { 
            padding: 4px 8px; 
            border-radius: 4px; 
            font-size: 0.8em; 
            text-transform: uppercase;
        }
        .status-active { background: #dcfce7; color: #166534; }
        .status-paused { background: #fef3c7; color: #92400e; }
        .status-pending { background: #dbeafe; color: #1e40af; }
        .refresh-btn { 
            background: #ff4d00; 
            color: white; 
            border: none; 
            padding: 10px 20px; 
            border-radius: 6px; 
            cursor: pointer;
            margin: 10px 0;
        }
        .refresh-btn:hover { background: #e63900; }
    </style>
</head>
<body>
    <div class="header">
        <h1>⚖️ Email Automation Dashboard</h1>
        <p>AI-Native Email Journey Management</p>
        <button class="refresh-btn" onclick="window.location.reload()">🔄 Refresh Dashboard</button>
    </div>
    
    <div class="stats">
        <div class="stat-card">
            <div class="stat-number">${activeContacts}</div>
            <div>Active Contacts</div>
        </div>
        <div class="stat-card">
            <div class="stat-number">${pendingEmails}</div>
            <div>Pending Emails</div>
        </div>
        <div class="stat-card">
            <div class="stat-number">${totalContacts}</div>
            <div>Total Contacts</div>
        </div>
    </div>
    
    <div class="section">
        <h3>👥 Active Contacts (${contacts.length})</h3>
        ${contacts.map(contact => `
            <div class="contact-item">
                <div>
                    <strong>${contact.email}</strong> 
                    ${contact.first_name ? `(${contact.first_name} ${contact.last_name || ''})` : ''}
                    <br>
                    <small>${contact.pathway_name} • ${contact.emails_pending} pending emails</small>
                </div>
                <span class="status status-${contact.status}">${contact.status}</span>
            </div>
        `).join('')}
    </div>
    
    <div class="section">
        <h3>📧 Scheduled Emails (${emails.length})</h3>
        ${emails.map(email => `
            <div class="email-item">
                <strong>${email.subject}</strong><br>
                <small>To: ${email.email} • Send: ${new Date(email.send_at).toLocaleString()}</small><br>
                <span class="status status-${email.status}">${email.status}</span>
            </div>
        `).join('')}
    </div>
    
    <div class="section">
        <h3>🛤️ Journey Overview</h3>
        ${journeys.map(journey => `
            <div class="contact-item">
                <div>
                    <strong>${journey.pathway_name}</strong><br>
                    <small>${journey.trigger_type}</small>
                </div>
                <div>
                    ${journey.contact_count} contacts 
                    <span class="status status-${journey.status}">${journey.status}</span>
                </div>
            </div>
        `).join('')}
    </div>
    
    <div style="text-align: center; margin-top: 30px; color: #666;">
        <p>🏆 Your "Taj Mahal" Email Automation System is Running!</p>
        <small>Dashboard auto-generated at ${new Date().toLocaleString()}</small>
    </div>
</body>
</html>`;
}

// Serve the dashboard with live data
router.get('/dashboard', async (req, res) => {
  try {
    // Fetch all the data server-side
    const journeyData = await new Promise((resolve) => {
      const journeys = db.prepare(`
        SELECT 
          trigger_type,
          pathway_name,
          status,
          COUNT(*) as contact_count,
          CAST(SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) AS FLOAT) / COUNT(*) as active_rate
        FROM email_automations
        GROUP BY trigger_type, pathway_name, status
      `).all();
      resolve({ success: true, journeys });
    });

    const contactData = await new Promise((resolve) => {
      const contacts = db.prepare(`
        SELECT 
          ea.*,
          (SELECT COUNT(*) FROM scheduled_emails WHERE automation_id = ea.id) as total_emails_scheduled,
          (SELECT COUNT(*) FROM scheduled_emails WHERE automation_id = ea.id AND sent_at IS NOT NULL) as emails_sent,
          (SELECT COUNT(*) FROM scheduled_emails WHERE automation_id = ea.id AND status = 'pending') as emails_pending
        FROM email_automations ea
        ORDER BY ea.created_at DESC
      `).all();
      resolve({ success: true, contacts });
    });

    const emailData = await new Promise((resolve) => {
      const emails = db.prepare(`
        SELECT 
          se.*,
          ea.pathway_name,
          l.first_name,
          l.last_name,
          l.business_name
        FROM scheduled_emails se
        LEFT JOIN email_automations ea ON se.automation_id = ea.id  
        LEFT JOIN leads l ON ea.email = l.email
        ORDER BY se.send_at ASC
        LIMIT 20
      `).all();
      resolve({ success: true, emails });
    });

    // Generate dashboard with server-side rendered data
    const dashboardHTML = generateDashboardWithData(
      journeyData.journeys || [],
      contactData.contacts || [], 
      emailData.emails || []
    );
    
    res.setHeader('Content-Type', 'text/html');
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.send(dashboardHTML);
    
  } catch (error) {
    log.error('Failed to generate dashboard:', error);
    res.status(500).send('<h1>Dashboard Error</h1><p>Failed to load dashboard data.</p>');
  }
});

// Get journey overview statistics
router.get('/journey-overview', async (req, res) => {
  try {
    const journeys = db.prepare(`
      SELECT 
        trigger_type,
        pathway_name,
        status,
        COUNT(*) as contact_count,
        AVG(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active_rate
      FROM email_automations 
      GROUP BY trigger_type, pathway_name, status
      ORDER BY contact_count DESC
    `).all();

    // Get email performance by journey
    const performance = db.prepare(`
      SELECT 
        ea.trigger_type,
        COUNT(se.id) as emails_sent,
        SUM(CASE WHEN se.status = 'sent' THEN 1 ELSE 0 END) as successful_sends,
        COUNT(ee.id) as total_engagements
      FROM email_automations ea
      LEFT JOIN scheduled_emails se ON ea.id = se.automation_id
      LEFT JOIN email_engagement ee ON se.id = ee.scheduled_email_id
      GROUP BY ea.trigger_type
    `).all();

    res.json({
      success: true,
      journeys,
      performance
    });

  } catch (error) {
    log.error('Failed to get journey overview:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch journey data'
    });
  }
});

// Get active contacts with their journey status
router.get('/active-contacts', async (req, res) => {
  try {
    const contacts = db.prepare(`
      SELECT 
        ea.id,
        ea.email,
        l.first_name,
        l.last_name,
        l.business_name,
        ea.pathway_name,
        ea.trigger_type,
        ea.status,
        ea.paused_reason,
        ea.consultation_booked,
        ea.created_at,
        ea.updated_at,
        COUNT(se.id) as total_emails_scheduled,
        SUM(CASE WHEN se.status = 'sent' THEN 1 ELSE 0 END) as emails_sent,
        SUM(CASE WHEN se.status = 'pending' THEN 1 ELSE 0 END) as emails_pending
      FROM email_automations ea
      LEFT JOIN leads l ON ea.email = l.email
      LEFT JOIN scheduled_emails se ON ea.id = se.automation_id
      GROUP BY ea.id
      ORDER BY ea.updated_at DESC
      LIMIT 50
    `).all();

    // Get next scheduled email for each contact
    const contactsWithNext = contacts.map(contact => {
      const nextEmail = db.prepare(`
        SELECT subject, send_at, template_type
        FROM scheduled_emails
        WHERE automation_id = ? AND status = 'pending'
        ORDER BY send_at ASC
        LIMIT 1
      `).get(contact.id);

      return {
        ...contact,
        next_email: nextEmail
      };
    });

    res.json({
      success: true,
      contacts: contactsWithNext
    });

  } catch (error) {
    log.error('Failed to get active contacts:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch contact data'
    });
  }
});

// Get scheduled emails
router.get('/scheduled-emails', async (req, res) => {
  try {
    const emails = db.prepare(`
      SELECT 
        se.*,
        ea.pathway_name,
        l.first_name,
        l.last_name,
        l.business_name
      FROM scheduled_emails se
      LEFT JOIN email_automations ea ON se.automation_id = ea.id
      LEFT JOIN leads l ON se.email = l.email
      WHERE se.status = 'pending'
        AND se.send_at > datetime('now')
      ORDER BY se.send_at ASC
      LIMIT 20
    `).all();

    res.json({
      success: true,
      emails
    });

  } catch (error) {
    log.error('Failed to get scheduled emails:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch scheduled emails'
    });
  }
});

// Get analytics data
router.get('/analytics', async (req, res) => {
  try {
    const timeframe = req.query.timeframe || '7d';
    let dateFilter = '';
    
    switch (timeframe) {
      case '24h':
        dateFilter = "datetime('now', '-1 day')";
        break;
      case '7d':
        dateFilter = "datetime('now', '-7 days')";
        break;
      case '30d':
        dateFilter = "datetime('now', '-30 days')";
        break;
      default:
        dateFilter = "datetime('now', '-7 days')";
    }

    // Email performance
    const emailStats = db.prepare(`
      SELECT 
        COUNT(*) as total_sent,
        SUM(CASE WHEN status = 'sent' THEN 1 ELSE 0 END) as successful_sends,
        SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed_sends
      FROM scheduled_emails
      WHERE sent_at >= ${dateFilter}
    `).get();

    // Engagement metrics
    const engagement = db.prepare(`
      SELECT 
        engagement_type,
        COUNT(*) as count
      FROM email_engagement
      WHERE created_at >= ${dateFilter}
      GROUP BY engagement_type
    `).all();

    // Consultation bookings
    const consultations = db.prepare(`
      SELECT COUNT(*) as count
      FROM consultation_bookings
      WHERE created_at >= ${dateFilter}
    `).get();

    // Calculate rates
    const totalSent = emailStats.successful_sends || 0;
    const opens = engagement.find(e => e.engagement_type === 'open')?.count || 0;
    const clicks = engagement.find(e => e.engagement_type === 'click')?.count || 0;
    
    const openRate = totalSent > 0 ? ((opens / totalSent) * 100).toFixed(1) + '%' : '0%';
    const clickRate = totalSent > 0 ? ((clicks / totalSent) * 100).toFixed(1) + '%' : '0%';
    const conversionRate = totalSent > 0 ? ((consultations.count / totalSent) * 100).toFixed(1) + '%' : '0%';

    res.json({
      success: true,
      timeframe,
      openRate,
      clickRate,
      conversionRate,
      consultations: consultations.count,
      emailStats,
      engagement
    });

  } catch (error) {
    log.error('Failed to get analytics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch analytics data'
    });
  }
});

// Pause a contact's email sequence
router.post('/pause/:email', async (req, res) => {
  try {
    const { email } = req.params;
    const { reason = 'Manual pause' } = req.body;

    const result = db.prepare(`
      UPDATE email_automations 
      SET status = 'paused', 
          paused_reason = ?,
          updated_at = datetime('now')
      WHERE email = ?
    `).run(reason, email);

    if (result.changes === 0) {
      return res.status(404).json({
        success: false,
        error: 'Contact not found in automation system'
      });
    }

    // Also pause all pending emails
    db.prepare(`
      UPDATE scheduled_emails 
      SET status = 'paused'
      WHERE email = ? AND status = 'pending'
    `).run(email);

    log.info(`Email automation paused for ${email}`, { reason });

    res.json({
      success: true,
      message: 'Email sequence paused successfully'
    });

  } catch (error) {
    log.error('Failed to pause contact:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to pause contact'
    });
  }
});

// Resume a contact's email sequence
router.post('/resume/:email', async (req, res) => {
  try {
    const { email } = req.params;

    const result = db.prepare(`
      UPDATE email_automations 
      SET status = 'active',
          paused_reason = NULL,
          updated_at = datetime('now')
      WHERE email = ?
    `).run(email);

    if (result.changes === 0) {
      return res.status(404).json({
        success: false,
        error: 'Contact not found in automation system'
      });
    }

    // Resume pending emails and recalculate send times
    const automation = db.prepare(`
      SELECT * FROM email_automations WHERE email = ?
    `).get(email);

    if (automation) {
      // Get paused emails and reschedule them
      const pausedEmails = db.prepare(`
        SELECT * FROM scheduled_emails 
        WHERE email = ? AND status = 'paused'
        ORDER BY send_at ASC
      `).all(email);

      // Resume emails with adjusted timing
      for (let i = 0; i < pausedEmails.length; i++) {
        const email = pausedEmails[i];
        const newSendTime = new Date(Date.now() + (i * 24 * 60 * 60 * 1000)); // Space them out daily

        db.prepare(`
          UPDATE scheduled_emails
          SET status = 'pending',
              send_at = ?
          WHERE id = ?
        `).run(newSendTime.toISOString(), email.id);
      }
    }

    log.info(`Email automation resumed for ${email}`);

    res.setHeader('Content-Type', 'application/json');
    res.json({
      success: true,
      message: 'Email sequence resumed successfully'
    });

  } catch (error) {
    log.error('Failed to resume contact:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to resume contact'
    });
  }
});

// Preview an email
router.get('/preview/:emailId', async (req, res) => {
  try {
    const { emailId } = req.params;
    
    const emailRecord = db.prepare(`
      SELECT * FROM scheduled_emails WHERE id = ?
    `).get(emailId);

    if (!emailRecord) {
      return res.status(404).json({
        success: false,
        error: 'Email not found'
      });
    }

    const automation = new CustomEmailAutomation();
    const content = automation.getEmailContent(emailRecord.template_type, emailRecord.first_name);
    const html = automation.generateEmailHTML(emailRecord.template_type, content, emailRecord.first_name);

    res.setHeader('Content-Type', 'text/html');
    res.send(html);

  } catch (error) {
    log.error('Failed to preview email:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate email preview'
    });
  }
});

// Send email immediately
router.post('/send-now/:emailId', async (req, res) => {
  try {
    const { emailId } = req.params;

    // Update the send time to now
    const result = db.prepare(`
      UPDATE scheduled_emails 
      SET send_at = datetime('now')
      WHERE id = ? AND status = 'pending'
    `).run(emailId);

    if (result.changes === 0) {
      return res.status(404).json({
        success: false,
        error: 'Email not found or already sent'
      });
    }

    // Process this specific email
    await processScheduledEmails();

    log.info(`Email ${emailId} sent immediately`);

    res.json({
      success: true,
      message: 'Email sent successfully'
    });

  } catch (error) {
    log.error('Failed to send email immediately:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to send email'
    });
  }
});

// Handle consultation booking (pause sequences)
router.post('/consultation-booked', async (req, res) => {
  try {
    const { email, bookingType, bookingData } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        error: 'Email is required'
      });
    }

    // Record the consultation booking
    db.prepare(`
      INSERT INTO consultation_bookings (email, booking_type, booking_data, created_at)
      VALUES (?, ?, ?, datetime('now'))
    `).run(email, bookingType || 'general', JSON.stringify(bookingData || {}));

    // Pause the email automation
    const result = db.prepare(`
      UPDATE email_automations 
      SET status = 'paused',
          paused_reason = 'Consultation booked',
          consultation_booked = 'yes',
          updated_at = datetime('now')
      WHERE email = ?
    `).run(email);

    // Pause all pending emails
    db.prepare(`
      UPDATE scheduled_emails 
      SET status = 'paused'
      WHERE email = ? AND status = 'pending'
    `).run(email);

    log.info(`Email automation paused for consultation booking: ${email}`, {
      bookingType,
      automationUpdated: result.changes > 0
    });

    res.json({
      success: true,
      message: 'Consultation booking recorded and email sequence paused',
      automationPaused: result.changes > 0
    });

  } catch (error) {
    log.error('Failed to handle consultation booking:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process consultation booking'
    });
  }
});

// Get detailed contact information
router.get('/contact/:email', async (req, res) => {
  try {
    const { email } = req.params;

    const contact = db.prepare(`
      SELECT 
        ea.*,
        l.first_name,
        l.last_name,
        l.business_name,
        l.phone,
        l.form_data,
        l.lead_score,
        l.created_at as lead_created_at
      FROM email_automations ea
      LEFT JOIN leads l ON ea.email = l.email
      WHERE ea.email = ?
    `).get(email);

    if (!contact) {
      return res.status(404).json({
        success: false,
        error: 'Contact not found'
      });
    }

    // Get email history
    const emailHistory = db.prepare(`
      SELECT * FROM scheduled_emails
      WHERE email = ?
      ORDER BY send_at DESC
    `).all(email);

    // Get engagement history
    const engagement = db.prepare(`
      SELECT ee.*, se.subject
      FROM email_engagement ee
      LEFT JOIN scheduled_emails se ON ee.scheduled_email_id = se.id
      WHERE ee.email = ?
      ORDER BY ee.created_at DESC
    `).all(email);

    res.json({
      success: true,
      contact,
      emailHistory,
      engagement
    });

  } catch (error) {
    log.error('Failed to get contact details:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch contact details'
    });
  }
});

// Manual email processing endpoint
router.post('/process-emails', async (req, res) => {
  try {
    const processed = await processScheduledEmails();
    
    res.json({
      success: true,
      processed,
      message: `Processed ${processed} scheduled emails`
    });

  } catch (error) {
    log.error('Failed to process emails manually:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process emails'
    });
  }
});

// Calendly webhook for consultation bookings
router.post('/calendly-webhook', async (req, res) => {
  try {
    const { event, payload } = req.body;
    
    if (event === 'invitee.created') {
      const { email, name, event_type_name, scheduled_event } = payload;
      
      // Determine consultation type from event name
      let consultationType = 'general';
      if (event_type_name.toLowerCase().includes('estate')) consultationType = 'estate-planning';
      else if (event_type_name.toLowerCase().includes('business')) consultationType = 'business-formation';
      else if (event_type_name.toLowerCase().includes('brand')) consultationType = 'brand-protection';
      else if (event_type_name.toLowerCase().includes('counsel')) consultationType = 'outside-counsel';
      else if (event_type_name.toLowerCase().includes('vip')) consultationType = 'vip';
      
      await consultationHandler.handleConsultationBooking({
        email,
        consultationType,
        bookingSource: 'calendly',
        scheduledTime: scheduled_event?.start_time,
        bookingId: payload.uuid,
        attendeeInfo: {
          name,
          firstName: name?.split(' ')[0],
          eventName: event_type_name
        }
      });
      
      log.info('✅ Calendly consultation booking processed', { email, consultationType });
    }
    
    else if (event === 'invitee.canceled') {
      const { email } = payload;
      await consultationHandler.handleConsultationCancellation(email, 'general', 'calendly_cancelled');
      log.info('📅 Calendly consultation cancelled', { email });
    }

    res.json({ success: true });

  } catch (error) {
    log.error('Calendly webhook failed:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Manual consultation booking endpoint
router.post('/consultation/book', async (req, res) => {
  try {
    const result = await consultationHandler.handleConsultationBooking(req.body);
    
    res.json({
      success: true,
      ...result
    });

  } catch (error) {
    log.error('Manual consultation booking failed:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Consultation completion endpoint
router.post('/consultation/completed', async (req, res) => {
  try {
    const { email, consultationType, outcome } = req.body;
    
    const result = await consultationHandler.handleConsultationCompleted(email, consultationType, outcome);
    
    res.json({
      success: true,
      ...result
    });

  } catch (error) {
    log.error('Consultation completion failed:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get consultation statistics
router.get('/consultation/stats', async (req, res) => {
  try {
    const stats = await consultationHandler.getConsultationStats();
    
    res.json({
      success: true,
      ...stats
    });

  } catch (error) {
    log.error('Failed to get consultation stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch consultation statistics'
    });
  }
});

// Preview email templates
router.get('/preview-template/:templateType', (req, res) => {
  try {
    const { templateType } = req.params;
    const firstName = req.query.firstName || 'Client';
    const submissionType = req.query.submissionType || 'estate-intake';
    
    // Build form data from query parameters for strategic email generation
    const formData = {
      profession: req.query.profession,
      industry: req.query.industry,
      businessType: req.query.businessType,
      businessStage: req.query.businessStage,
      fundingStage: req.query.fundingStage,
      socialFollowing: req.query.socialFollowing ? parseInt(req.query.socialFollowing) : undefined,
      estateValue: req.query.estateValue ? parseInt(req.query.estateValue) : undefined,
      businessRevenue: req.query.businessRevenue ? parseInt(req.query.businessRevenue) : undefined,
      hasIntellectualProperty: req.query.hasIntellectualProperty === 'true',
      brandPartnerships: req.query.brandPartnerships === 'true',
      careerType: req.query.careerType,
      familyOffice: req.query.familyOffice === 'true',
      generationalWealth: req.query.generationalWealth === 'true',
      timeline: req.query.timeline,
      growthPlans: req.query.growthPlans?.split(','),
      revenueStreams: req.query.revenueStreams?.split(',')
    };
    
    const emailHTML = generateLegallyCompliantEmail(templateType, firstName, { 
      submissionType: submissionType,
      formData: formData,
      email: 'preview@example.com'
    });
    
    res.setHeader('Content-Type', 'text/html');
    res.send(emailHTML);
    
  } catch (error) {
    log.error('Failed to generate email preview:', error);
    res.status(500).send('<h1>Preview Error</h1><p>Failed to generate email preview.</p>');
  }
});

export default router;