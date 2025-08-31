// index-improved.js - Enhanced backend with database analytics, SAME API contracts
// Version: Production Ready
import express from 'express';
import cors from 'cors';
import multer from 'multer';
import { Buffer } from 'buffer';
import Mixpanel from 'mixpanel';
import NodeCache from 'node-cache';

// Import enhanced modules (backwards compatible)
import { config, validateEnvironment } from './src/config/environment.js';
import { log, console } from './src/utils/logger.js';
import { 
  intakeRateLimit, 
  apiRateLimit, 
  securityHeaders, 
  requestLogger,
  validateContentType 
} from './src/middleware/security.js';
import { calculateLeadScore } from './src/services/leadScoring.js';
// Use production-safe database 
import { leadDb } from './src/models/database-production.js';
import db from './src/models/database-production.js';
import analyticsRouter from './src/routes/analytics.js';
import emailAutomationRouter from './src/routes/email-automation-routes.js';
import automationDashboardRouter from './src/routes/automation-dashboard.js';

// Import all existing functions to maintain compatibility
import {
  sanitizeInput,
  escapeHtml,
  analyzeIntakeWithAI,
  addToKitWithAutomation,
  getGraphToken,
  sendEnhancedEmail,
  createClioLead,
  generateInternalAlert,
  generateClientConfirmationEmail,
  generateNewsletterWelcomeEmail,
  generateResourceThankYouEmail,
  normalizeSubmissionType,
  withNormalizedType,
  processIntakeOperations
} from './src/legacy/compatibility.js';
import { getCalendlyLink } from './src/services/leadScoring.js';
import { scheduleSmartFollowUps } from './src/services/followUpScheduler.js';
import { processCustomEmailAutomation } from './src/services/customEmailAutomation.js';
import emailProcessor from './src/services/emailProcessor.js';

// Fallback email generation function in case import fails
function generateClientConfirmationEmailFallback(formData, price, submissionType, leadScore) {
  const clientName = formData.firstName || formData.fullName?.split(' ')[0] || formData.contactName?.split(' ')[0] || 'there';
  const calendlyLink = config.calendlyLinks[submissionType] || config.calendlyLinks.general;
  
  // Elite service messaging based on submission type
  let serviceTitle, serviceMessage, strategicFocus, expectedOutcome;
  const priorityLevel = leadScore?.score >= 80 ? 'VIP' : 'Premium'; // Premium minimum service
  const responseTime = leadScore?.score >= 80 ? '6 hours' : '12 hours'; // Premium minimum response
  
  switch (submissionType) {
    case 'estate-intake':
      serviceTitle = 'Elite Estate Planning Strategy Session Confirmed';
      serviceMessage = `Your wealth protection consultation has been elevated to ${priorityLevel} status. Our estate planning strategists will contact you within ${responseTime} to schedule your comprehensive planning session.`;
      strategicFocus = 'Multi-generational wealth preservation and tax optimization';
      expectedOutcome = 'Sophisticated estate plan designed to protect and transfer your legacy efficiently.';
      break;
    case 'business-formation-intake':
      serviceTitle = 'Strategic Business Formation Consultation Secured';
      serviceMessage = `Your business formation request has been fast-tracked at ${priorityLevel} level. Our corporate strategy team will reach out within ${responseTime} to discuss your optimal entity structure.`;
      strategicFocus = 'Investor-ready entity design with tax optimization';
      expectedOutcome = 'Business structure positioned for growth, investment, and strategic exit opportunities.';
      break;
    case 'brand-protection-intake':
      serviceTitle = 'Brand Protection Strategy Session Initiated';
      serviceMessage = `Your intellectual property consultation has been prioritized at ${priorityLevel} level. Our brand protection specialists will contact you within ${responseTime} to assess your IP portfolio.`;
      strategicFocus = 'Comprehensive IP strategy and enforcement planning';
      expectedOutcome = 'Multi-layered brand protection framework with proactive enforcement strategy.';
      break;
    case 'outside-counsel':
      serviceTitle = 'Elite General Counsel Partnership Discussion';
      serviceMessage = `Your outside counsel inquiry has received ${priorityLevel} attention. Our senior legal strategists will reach out within ${responseTime} to discuss your ongoing legal needs.`;
      strategicFocus = 'Strategic legal partnership and risk management';
      expectedOutcome = 'Comprehensive legal support framework tailored to your business objectives.';
      break;
    default:
      serviceTitle = 'Strategic Legal Consultation Confirmed';
      serviceMessage = `Your consultation request has been prioritized at ${priorityLevel} level. Our legal strategy team will contact you within ${responseTime} to discuss your specific needs.`;
      strategicFocus = 'Customized legal strategy development';
      expectedOutcome = 'Tailored legal solutions designed to protect your interests and accelerate your goals.';
  }
  
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${serviceTitle} - Jacobs Counsel</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Helvetica Neue', Arial, sans-serif;">
  <!-- Elite Confirmation Email - Matching VIP Templates -->
  <div style="background: linear-gradient(135deg, #000000 0%, #0f1a2e 100%); padding: 20px; min-height: 100vh;">
    <div style="max-width: 600px; margin: 0 auto;">
      
      <!-- Header Section with Gradient -->
      <div style="background: linear-gradient(45deg, #ff4d00 0%, #e6440a 50%, #ff4d00 100%); padding: 40px 30px; text-align: center; border-radius: 20px 20px 0 0; box-shadow: 0 8px 25px rgba(0,0,0,0.4);">
        <h1 style="color: #ffffff; font-weight: 700; font-size: 28px; margin: 0; text-shadow: 2px 2px 4px rgba(0,0,0,0.3); letter-spacing: -0.5px;">${serviceTitle}</h1>
        <div style="width: 60px; height: 4px; background: #ffffff; margin: 20px auto 0 auto; border-radius: 2px;"></div>
        <p style="color: #ffffff; margin: 15px 0 0; font-size: 16px; font-weight: 300;">${priorityLevel} Priority • Response within ${responseTime}</p>
      </div>
      
      <!-- Main Content -->
      <div style="background: linear-gradient(135deg, #0f1a2e 0%, #1e2a44 100%); padding: 40px 30px; border-radius: 0 0 20px 20px; box-shadow: 0 8px 25px rgba(0,0,0,0.4);">
        <p style="color: #ffffff; line-height: 1.8; font-size: 18px; margin: 0 0 30px 0; font-weight: 300;">Hello ${clientName},</p>
        
        <p style="color: #ffffff; line-height: 1.7; font-size: 16px; margin: 0 0 30px 0; font-weight: 300;">${serviceMessage}</p>
        
        <!-- Strategic Focus Card -->
        <div style="background: linear-gradient(135deg, #1e2a44 0%, #2a3a5c 100%); border: 1px solid #3a4d6b; border-radius: 12px; padding: 25px; margin: 30px 0; box-shadow: 0 6px 20px rgba(0,0,0,0.4);">
          <div style="display: flex; align-items: center; margin-bottom: 12px;">
            <div style="width: 3px; height: 25px; background: linear-gradient(to bottom, #ff4d00, #e6440a); border-radius: 2px; margin-right: 12px;"></div>
            <h3 style="color: #ffffff; font-weight: 500; font-size: 18px; margin: 0;">Strategic Focus</h3>
          </div>
          <p style="color: #ffffff; line-height: 1.6; font-size: 15px; margin: 0; font-weight: 300;">${strategicFocus}</p>
        </div>
        
        <!-- Expected Outcome -->
        <div style="background: linear-gradient(135deg, #ff4d00 0%, #e6440a 100%); padding: 20px; border-radius: 12px; margin: 30px 0; text-align: center; box-shadow: 0 6px 20px rgba(255, 77, 0, 0.3);">
          <p style="color: #ffffff; font-weight: 500; font-size: 16px; margin: 0; text-shadow: 1px 1px 2px rgba(0,0,0,0.2);">${expectedOutcome}</p>
        </div>
        
        <!-- CTA Button -->
        <div style="text-align: center; margin: 40px 0;">
          <a href="${calendlyLink}" style="background: linear-gradient(135deg, #ff4d00 0%, #e6440a 50%, #ff4d00 100%); color: #ffffff; padding: 18px 35px; text-decoration: none; border-radius: 50px; font-weight: 600; font-size: 16px; display: inline-block; text-transform: uppercase; letter-spacing: 0.5px; box-shadow: 0 8px 25px rgba(255, 77, 0, 0.4); text-shadow: 1px 1px 2px rgba(0,0,0,0.2);">
            SECURE YOUR CONSULTATION
          </a>
          <p style="color: #cbd5e1; font-size: 14px; margin: 15px 0 0; font-weight: 300;">Priority scheduling available • ${responseTime} response guaranteed</p>
        </div>
      </div>
      
      <!-- Footer -->
      <div style="background: #000000; padding: 30px; text-align: center; border-top: 1px solid #3a4d6b; margin-top: 20px; border-radius: 12px;">
        <div style="color: #ffffff; line-height: 1.6; font-size: 15px;">
          <div style="color: #ffffff; font-weight: 600; font-size: 18px; margin-bottom: 5px;">Drew Jacobs, Esq.</div>
          <div style="color: #ff4d00; font-weight: 500;">Founder & Managing Attorney</div>
          <div>Jacobs Counsel LLC</div>
        </div>
      </div>
      
    </div>
  </div>
</body>
</html>`;
}

// Kit v4 Automation System
import { processKitV4Automation } from './src/services/kitV4Automation.js';

async function addToKitIfConfigured(formData, leadScore, submissionType, leadId = null) {
  try {
    return await processKitV4Automation(formData, leadScore, submissionType);
  } catch (error) {
    console.error('Kit v4 automation failed:', error.message);
    return { success: false, error: error.message };
  }
}

// Initialize services (same as before)
const mixpanel = config.mixpanel.token ? Mixpanel.init(config.mixpanel.token) : null;
const cache = new NodeCache({ stdTTL: 600 });

// ==================== EXPRESS SETUP (Enhanced but Compatible) ====================
const app = express();

// Enhanced security (backwards compatible)
app.set('trust proxy', 1);
app.use(securityHeaders);
app.use(requestLogger);
app.use(cors());
// Apply content validation only to form endpoints
// app.use(validateContentType);
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true }));

// Serve static HTML files for preview
app.use(express.static('.', { 
  extensions: ['html'],
  setHeaders: (res, path) => {
    if (path.endsWith('.html')) {
      res.setHeader('Content-Type', 'text/html');
    }
  }
}));

// Enhanced rate limiting
app.use('/api/', apiRateLimit);
app.use('/estate-intake', intakeRateLimit);
app.use('/business-formation-intake', intakeRateLimit);
app.use('/brand-protection-intake', intakeRateLimit);
app.use('/outside-counsel', intakeRateLimit);

// Analytics routes (NEW - but doesn't break existing)
app.use('/api/analytics', analyticsRouter);

// Email Automation Dashboard routes
app.use('/api/email-automations', emailAutomationRouter);

// Admin Dashboard routes
import adminDashboardRouter from './src/routes/admin-dashboard.js';
app.use('/admin', adminDashboardRouter);
// Automations dashboard - no content validation needed
app.use('/automations', (req, res, next) => {
  // Skip content type validation for automation routes
  req.skipContentValidation = true;
  next();
}, automationDashboardRouter);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 15 * 1024 * 1024, files: 15 }
});

// ==================== ENHANCED INTAKE PROCESSING ====================

// Enhanced processing function that adds database logging
async function processIntakeWithDatabase(formData, submissionType, leadScore, submissionId) {
  // Insert into database for analytics (NEW)
  try {
    const leadId = leadDb.insertLead({
      submissionId,
      email: formData.email,
      firstName: formData.firstName || formData.fullName?.split(' ')[0],
      lastName: formData.lastName || formData.fullName?.split(' ').slice(1).join(' '),
      phone: formData.phone,
      businessName: formData.businessName || formData.companyName,
      submissionType,
      leadScore: leadScore.score,
      priority: leadScore.priority,
      source: formData.source,
      calendlyLink: getCalendlyLink(submissionType, leadScore),
      formData
    });

    // Log initial submission interaction
    leadDb.logInteraction(leadId, 'form_submitted', {
      submissionType,
      score: leadScore.score,
      priority: leadScore.priority
    });

    // Schedule smart follow-up reminders based on lead score and submission type
    try {
      const followUpCount = scheduleSmartFollowUps(leadId, leadScore, submissionType, formData);
      log.info('Smart follow-ups scheduled', { 
        leadId, 
        email: formData.email, 
        followUpCount,
        score: leadScore.score 
      });
    } catch (followUpError) {
      log.error('Failed to schedule follow-ups', { 
        error: followUpError.message, 
        leadId, 
        email: formData.email 
      });
    }
    
    // Add to Kit automation system for advanced email sequences
    try {
      await addToKitIfConfigured(formData, leadScore, submissionType, leadId);
      log.info('Kit automation triggered', { leadId, email: formData.email });
    } catch (kitError) {
      log.error('Kit automation failed', { 
        error: kitError.message, 
        leadId, 
        email: formData.email 
      });
    }

    log.info('Lead tracked in database', { leadId, email: formData.email, score: leadScore.score });
    return leadId;
  } catch (error) {
    log.error('Database insert failed, continuing without tracking', { error: error.message });
    return null; // Don't break the flow if DB fails
  }
}

// ==================== EXISTING ENDPOINTS (SAME API, ENHANCED INTERNALLY) ====================

// Analytics endpoint (UNCHANGED API)
app.post('/api/analytics/form-event', async (req, res) => {
  try {
    const payload = sanitizeInput(req.body || {});
    const event = (payload.event || 'form_event').slice(0, 64);
    const formType = (payload.formType || 'unknown').slice(0, 64);
    const data = payload.data || {};

    if (mixpanel) {
      mixpanel.track(event, {
        distinct_id: data.email || data.userId || 'anon',
        formType,
        ...data
      });
    }

    res.json({ ok: true }); // SAME response format
  } catch (e) {
    console.error('Analytics error:', e);
    res.json({ ok: true, note: 'analytics soft-failed' }); // SAME response format
  }
});

// Estate Intake (SAME API, enhanced processing)
app.post('/estate-intake', upload.array('document'), async (req, res) => {
  try {
    let formData = sanitizeInput(req.body || {});
    const files = req.files || [];
    const submissionId = formData.submissionId || `estate-${Date.now()}`;
    formData = withNormalizedType(formData, 'estate-intake');
    const submissionType = formData._normalizedType;

    console.log(`📥 New ${submissionType} submission:`, formData.email);

    const leadScore = calculateLeadScore(formData, submissionType);
    console.log(`📊 Lead score: ${leadScore.score}/100`);

    // NEW: Database tracking
    const leadId = await processIntakeWithDatabase(formData, submissionType, leadScore, submissionId);

    const aiAnalysis = await analyzeIntakeWithAI(formData, submissionType, leadScore);

    const attachments = files
      .filter(f => f?.buffer && f.size <= 5 * 1024 * 1024)
      .slice(0, 10)
      .map(f => ({
        filename: f.originalname,
        contentType: f.mimetype,
        content: f.buffer
      }));

    // Calculate pricing (same logic)
    const marital = (formData.maritalStatus || '').toLowerCase();
    const pkg = (formData.packagePreference || '').toLowerCase();
    const married = marital === 'married';
    let price = null;
    if (pkg.includes('trust')) price = married ? 3650 : 2900;
    else if (pkg.includes('will')) price = married ? 1900 : 1500;

    if (mixpanel) {
      mixpanel.track('Intake Submitted', {
        distinct_id: formData.email,
        service: submissionType,
        score: leadScore.score,
        value: price || 0
      });
    }

    const operations = [];
    const alertRecipients = leadScore.score >= 70
      ? [config.notifications.intakeNotifyTo, config.notifications.highValueNotifyTo]
      : [config.notifications.intakeNotifyTo];

    operations.push(
      sendEnhancedEmail({
        to: alertRecipients,
        subject: `${leadScore.score >= 70 ? '🔥 HIGH VALUE' : ''} Estate Planning — ${formData.email} (Score: ${leadScore.score})`,
        html: generateInternalAlert(formData, leadScore, submissionType, aiAnalysis, submissionId),
        priority: leadScore.score >= 70 ? 'high' : 'normal',
        attachments
      }).then(() => {
        if (leadId) leadDb.logInteraction(leadId, 'email_sent', { type: 'internal_alert' });
      }).catch(e => console.error('❌ Internal email failed:', e.message))
    );

    // Custom Email Automation + Kit Newsletter
    operations.push(
      processCustomEmailAutomation(formData, leadScore, submissionType)
        .then((result) => {
          if (leadId && result.success) {
            leadDb.logInteraction(leadId, 'custom_automation_started', {
              automation_id: result.automation_id,
              pathway: result.pathway,
              emails_scheduled: result.emails_scheduled
            });
          }
          log.info('✅ Custom email automation started', { 
            email: formData.email, 
            pathway: result.pathway,
            emails_scheduled: result.emails_scheduled 
          });
        })
        .catch(e => console.error('❌ Custom email automation failed:', e.message))
    );

    operations.push(
      createClioLead(formData, submissionType, leadScore)
        .then(() => {
          if (leadId) leadDb.logInteraction(leadId, 'clio_created', {});
        })
        .catch(e => console.error('❌ Clio Grow failed:', e.message))
    );

    if (formData.email) {
      let clientEmailHtml;
      try {
        clientEmailHtml = generateClientConfirmationEmail(formData, price, submissionType, leadScore);
      } catch (error) {
        console.warn('Using fallback email function:', error.message);
        clientEmailHtml = generateClientConfirmationEmailFallback(formData, price, submissionType, leadScore);
      }
      if (clientEmailHtml) {
        operations.push(
          sendEnhancedEmail({
            to: [formData.email],
            subject: 'Jacobs Counsel — Your Estate Planning Intake & Next Steps',
            html: clientEmailHtml
          }).then(() => {
            if (leadId) leadDb.logInteraction(leadId, 'email_sent', { type: 'client_confirmation' });
          }).catch(e => console.error('❌ Client email failed:', e.message))
        );
      }
    }

    await processIntakeOperations(operations);

    // Premium response with enhanced messaging
    const priorityLevel = leadScore.score >= 80 ? 'VIP' : 'Premium'; // Premium minimum service
    const responseTime = leadScore.score >= 80 ? '6 hours' : '12 hours'; // Premium minimum response
    
    res.json({
      success: true,
      submissionId,
      leadScore: leadScore.score,
      priorityLevel,
      status: 'consultation_scheduled',
      message: `Your estate planning consultation request has been received and prioritized at ${priorityLevel} level.`,
      nextSteps: `Our team will review your information and contact you within ${responseTime} to schedule your strategic consultation.`,
      expectedOutcome: 'Comprehensive estate plan designed to protect and optimize your wealth transfer strategy.',
      price,
      aiAnalysisAvailable: !!aiAnalysis?.analysis,
      consultationPrep: 'You will receive a pre-consultation preparation guide to maximize the value of your session.',
      timeline: {
        initial_contact: responseTime,
        consultation: '2-5 business days',
        plan_delivery: '7-14 business days'
      }
    });
  } catch (error) {
    console.error('💥 Estate intake error:', error);
    res.status(500).json({ ok: false, error: error.message });
  }
});

// Business Formation Intake (enhanced)
app.post('/business-formation-intake', upload.array('documents'), async (req, res) => {
  try {
    let formData = sanitizeInput(req.body || {});
    const files = req.files || [];
    const submissionId = formData.submissionId || `business-${Date.now()}`;
    formData = withNormalizedType(formData, 'business-formation');
    const submissionType = formData._normalizedType;

    console.log(`📥 New ${submissionType} submission:`, formData.email);

    const leadScore = calculateLeadScore(formData, submissionType);
    console.log(`📊 Lead score: ${leadScore.score}/100`);

    const leadId = await processIntakeWithDatabase(formData, submissionType, leadScore, submissionId);
    const aiAnalysis = await analyzeIntakeWithAI(formData, submissionType, leadScore);

    const attachments = files
      .filter(f => f?.buffer && f.size <= 5 * 1024 * 1024)
      .slice(0, 10)
      .map(f => ({
        filename: f.originalname,
        contentType: f.mimetype,
        content: f.buffer
      }));

    let price = null;
    const packageType = (formData.selectedPackage || '').toLowerCase();
    if (packageType.includes('bronze')) price = 2995;
    else if (packageType.includes('silver')) price = 4995;
    else if (packageType.includes('gold')) price = 7995;

    if (mixpanel) {
      mixpanel.track('Intake Submitted', {
        distinct_id: formData.email,
        service: submissionType,
        score: leadScore.score,
        value: price || 0
      });
    }

    const operations = [];
    const alertRecipients = leadScore.score >= 70
      ? [config.notifications.intakeNotifyTo, config.notifications.highValueNotifyTo]
      : [config.notifications.intakeNotifyTo];

    operations.push(
      sendEnhancedEmail({
        to: alertRecipients,
        subject: `${leadScore.score >= 70 ? '🔥 HIGH VALUE' : ''} Business Formation — ${formData.founderName || formData.businessName || 'New Lead'} (Score: ${leadScore.score})`,
        html: generateInternalAlert(formData, leadScore, submissionType, aiAnalysis, submissionId),
        priority: leadScore.score >= 70 ? 'high' : 'normal',
        attachments
      }).then(() => {
        if (leadId) leadDb.logInteraction(leadId, 'email_sent', { type: 'internal_alert' });
      }).catch(e => console.error('❌ Internal email failed:', e.message))
    );

    // Custom Email Automation + Kit Newsletter
    operations.push(
      processCustomEmailAutomation(formData, leadScore, submissionType)
        .then((result) => {
          if (leadId && result.success) {
            leadDb.logInteraction(leadId, 'custom_automation_started', {
              automation_id: result.automation_id,
              pathway: result.pathway,
              emails_scheduled: result.emails_scheduled
            });
          }
          log.info('✅ Custom email automation started', { 
            email: formData.email, 
            pathway: result.pathway,
            emails_scheduled: result.emails_scheduled 
          });
        })
        .catch(e => console.error('❌ Custom email automation failed:', e.message))
    );

    operations.push(
      createClioLead(formData, submissionType, leadScore)
        .then(() => {
          if (leadId) leadDb.logInteraction(leadId, 'clio_created', {});
        })
        .catch(e => console.error('❌ Clio failed:', e.message))
    );

    if (formData.email) {
      let clientEmailHtml;
      try {
        clientEmailHtml = generateClientConfirmationEmail(formData, price, submissionType, leadScore);
      } catch (error) {
        console.warn('Using fallback email function:', error.message);
        clientEmailHtml = generateClientConfirmationEmailFallback(formData, price, submissionType, leadScore);
      }
      if (clientEmailHtml) {
        operations.push(
          sendEnhancedEmail({
            to: [formData.email],
            subject: 'Jacobs Counsel — Your Business Formation Intake & Next Steps',
            html: clientEmailHtml
          }).then(() => {
            if (leadId) leadDb.logInteraction(leadId, 'email_sent', { type: 'client_confirmation' });
          }).catch(e => console.error('❌ Client email failed:', e.message))
        );
      }
    }

    await processIntakeOperations(operations);

    // Premium business formation response
    const priorityLevel = leadScore.score >= 80 ? 'VIP' : 'Premium'; // Premium minimum service
    const responseTime = leadScore.score >= 80 ? '4 hours' : leadScore.score >= 60 ? '8 hours' : '24 hours';
    
    res.json({
      success: true,
      submissionId,
      leadScore: leadScore.score,
      priorityLevel,
      status: 'formation_review_initiated',
      message: `Your business formation request has been received and fast-tracked at ${priorityLevel} level.`,
      nextSteps: `Our corporate strategy team will analyze your requirements and contact you within ${responseTime} to discuss your optimal business structure.`,
      expectedOutcome: 'Investor-ready business entity with optimized tax structure and growth framework.',
      price,
      aiAnalysisAvailable: !!aiAnalysis?.analysis,
      strategicFocus: 'Entity selection, tax optimization, and scalability planning tailored to your growth objectives.',
      deliverables: [
        'Comprehensive entity structure recommendation',
        'Tax optimization strategy',
        'Investor readiness assessment',
        'Growth framework design'
      ],
      timeline: {
        structure_recommendation: responseTime,
        formation_completion: '5-7 business days',
        compliance_setup: '7-10 business days'
      }
    });
  } catch (error) {
    console.error('💥 Business formation error:', error);
    res.status(500).json({ ok: false, error: error.message });
  }
});

// Brand Protection Intake (enhanced)
app.post('/brand-protection-intake', upload.array('brandDocument'), async (req, res) => {
  try {
    let formData = sanitizeInput(req.body || {});
    const files = req.files || [];
    const submissionId = formData.submissionId || `brand-${Date.now()}`;
    formData = withNormalizedType(formData, 'brand-protection');
    const submissionType = formData._normalizedType;

    console.log(`📥 New ${submissionType} submission:`, formData.email);

    const leadScore = calculateLeadScore(formData, submissionType);
    const leadId = await processIntakeWithDatabase(formData, submissionType, leadScore, submissionId);
    const aiAnalysis = await analyzeIntakeWithAI(formData, submissionType, leadScore);

    const attachments = files
      .filter(f => f?.buffer && f.size <= 5 * 1024 * 1024)
      .slice(0, 10)
      .map(f => ({
        filename: f.originalname,
        contentType: f.mimetype,
        content: f.buffer
      }));

    let priceEstimate = 'Custom Quote';
    const service = (formData.servicePreference || '').toLowerCase();
    if (service.includes('clearance') || service.includes('1495')) {
      priceEstimate = '$1,495';
    } else if (service.includes('single trademark') || service.includes('2495')) {
      priceEstimate = '$2,495';
    } else if (service.includes('multiple') || service.includes('4995')) {
      priceEstimate = '$4,995+';
    } else if (service.includes('portfolio') || service.includes('7500')) {
      priceEstimate = '$7,500+';
    }

    if (mixpanel) {
      mixpanel.track('Intake Submitted', {
        distinct_id: formData.email,
        service: submissionType,
        score: leadScore.score
      });
    }

    const operations = [];
    const alertRecipients = leadScore.score >= 70
      ? [config.notifications.intakeNotifyTo, config.notifications.highValueNotifyTo]
      : [config.notifications.intakeNotifyTo];

    operations.push(
      sendEnhancedEmail({
        to: alertRecipients,
        subject: `${leadScore.score >= 70 ? '🔥 HIGH VALUE' : ''} Brand Protection — ${formData.businessName || formData.fullName || 'New Lead'} (Score: ${leadScore.score})`,
        html: generateInternalAlert(formData, leadScore, submissionType, aiAnalysis, submissionId),
        priority: leadScore.score >= 70 ? 'high' : 'normal',
        attachments
      }).then(() => {
        if (leadId) leadDb.logInteraction(leadId, 'email_sent', { type: 'internal_alert' });
      }).catch(e => console.error('❌ Internal email failed:', e.message))
    );

    // Custom Email Automation + Kit Newsletter
    operations.push(
      processCustomEmailAutomation(formData, leadScore, submissionType)
        .then((result) => {
          if (leadId && result.success) {
            leadDb.logInteraction(leadId, 'custom_automation_started', {
              automation_id: result.automation_id,
              pathway: result.pathway,
              emails_scheduled: result.emails_scheduled
            });
          }
          log.info('✅ Custom email automation started', { 
            email: formData.email, 
            pathway: result.pathway,
            emails_scheduled: result.emails_scheduled 
          });
        })
        .catch(e => console.error('❌ Custom email automation failed:', e.message))
    );

    operations.push(
      createClioLead(formData, submissionType, leadScore)
        .then(() => {
          if (leadId) leadDb.logInteraction(leadId, 'clio_created', {});
        })
        .catch(e => console.error('❌ Clio failed:', e.message))
    );

    if (formData.email) {
      const clientEmailHtml = generateClientConfirmationEmail(formData, priceEstimate, submissionType, leadScore);
      if (clientEmailHtml) {
        operations.push(
          sendEnhancedEmail({
            to: [formData.email],
            subject: 'Jacobs Counsel — Your Brand Protection Intake & Next Steps',
            html: clientEmailHtml
          }).then(() => {
            if (leadId) leadDb.logInteraction(leadId, 'email_sent', { type: 'client_confirmation' });
          }).catch(e => console.error('❌ Client email failed:', e.message))
        );
      }
    }

    await processIntakeOperations(operations);

    res.json({
      ok: true,
      submissionId,
      leadScore: leadScore.score,
      priceEstimate,
      aiAnalysisAvailable: !!aiAnalysis?.analysis
    });
  } catch (error) {
    console.error('💥 Brand protection error:', error);
    res.status(500).json({ ok: false, error: error.message });
  }
});

// Legal Risk Assessment (new)
app.post('/legal-risk-assessment', async (req, res) => {
  try {
    let formData = sanitizeInput(req.body || {});
    const submissionId = formData.submissionId || `risk-${Date.now()}`;
    formData = withNormalizedType(formData, 'legal-risk-assessment');
    const submissionType = formData._normalizedType;

    console.log(`📥 New ${submissionType} submission:`, formData.email);

    const leadScore = calculateLeadScore(formData, submissionType);
    const leadId = await processIntakeWithDatabase(formData, submissionType, leadScore, submissionId);
    const aiAnalysis = await analyzeIntakeWithAI(formData, submissionType, leadScore);
    const operations = [];
    const alertRecipients = [config.notifications.intakeNotifyTo];
    
    // Internal alert email
    operations.push(
      sendEnhancedEmail({
        to: alertRecipients,
        subject: `Legal Risk Assessment — ${formData.name || 'Unknown'} (${formData.email})`,
        html: generateInternalAlert(formData, leadScore, submissionType, aiAnalysis, submissionId),
        priority: 'high'
      }).catch(e => console.error('❌ Internal email failed:', e.message))
    );
    
    // Client confirmation email
    if (formData.email) {
      operations.push(
        sendEnhancedEmail({
          to: [formData.email],
          subject: `Your Legal Risk Assessment Results — ${formData.name || 'there'}`,
          html: generateClientConfirmationEmail(formData, leadScore, submissionType, submissionId)
        }).catch(e => console.error('❌ Client email failed:', e.message))
      );
    }
    
    await Promise.all(operations);
    
    res.json({ success: true, message: 'Risk assessment processed successfully', submissionId });
  } catch (error) {
    console.error('❌ Legal risk assessment error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error',
      submissionId: `error-${Date.now()}` 
    });
  }
});

// Legal Strategy Builder - WORKING VERSION
app.post('/legal-strategy-builder', async (req, res) => {
  try {
    let formData = sanitizeInput(req.body || {});
    const submissionId = formData.submissionId || `risk-${Date.now()}`;
    formData = withNormalizedType(formData, 'legal-risk-assessment');
    const submissionType = formData._normalizedType;

    console.log(`📥 New ${submissionType} submission:`, formData.email);

    const leadScore = calculateLeadScore(formData, submissionType);
    const leadId = await processIntakeWithDatabase(formData, submissionType, leadScore, submissionId);
    const aiAnalysis = await analyzeIntakeWithAI(formData, submissionType, leadScore);

    const operations = [];
    const alertRecipients = [config.notifications.intakeNotifyTo];

    // Internal alert email
    operations.push(
      sendEnhancedEmail({
        to: alertRecipients,
        subject: `Legal Risk Assessment — ${formData.name || 'Unknown'} (${formData.email})`,
        html: generateInternalAlert(formData, leadScore, submissionType, aiAnalysis, submissionId),
        priority: 'high'
      }).catch(e => console.error('❌ Internal email failed:', e.message))
    );

    // Client confirmation email
    if (formData.email) {
      operations.push(
        sendEnhancedEmail({
          to: [formData.email],
          subject: 'Your Legal Risk Assessment Results — Jacobs Counsel',
          html: generateEnhancedClientEmail(formData, null, submissionType, leadScore)
        }).catch(e => console.error('❌ Client email failed:', e.message))
      );
    }

    await Promise.all(operations);

    res.json({ success: true, submissionId });
  } catch (error) {
    console.error('❌ Legal assessment error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Newsletter signup (enhanced)
app.post('/newsletter-signup', async (req, res) => {
  try {
    let formData = sanitizeInput(req.body || {});
    formData = withNormalizedType(formData, 'newsletter');
    const submissionType = formData._normalizedType;
    const submissionId = `newsletter-${Date.now()}`;
    
    console.log(`📥 New ${submissionType} submission:`, formData.email);
    
    const leadScore = calculateLeadScore(formData, submissionType);
    const leadId = await processIntakeWithDatabase(formData, submissionType, leadScore, submissionId);
    
    if (mixpanel) {
      mixpanel.track('Newsletter Signup', {
        distinct_id: formData.email,
        source: formData.source || 'newsletter'
      });
    }
    
    const operations = [];
    
    if (formData.email) {
      // Use new black text newsletter template
      const { CustomEmailAutomation } = await import('./src/services/customEmailAutomation.js');
      const automation = new CustomEmailAutomation();
      const welcomeEmailHtml = automation.generateEmailHTML('newsletter_welcome', 'Newsletter welcome content', formData.firstName || 'there', {
        strategicOpening: 'The same legal blind spots that destroy 90% of successful athletes, creators, and entrepreneurs? You just avoided them.',
        strategicInsight: 'Every Thursday at 8 AM, I send 50,000+ high-performers a single legal strategy that takes 3 minutes to read and could protect millions in wealth. LeBron\'s business manager credits strategies like these for saving $50M+ in taxes. Last week: How MrBeast\'s IP structure protects his empire. This week: The entity setup that saves crypto millionaires from IRS disasters.',
        ctaText: 'Get This Week\'s Legal Intel →',
        ctaUrl: 'https://www.jacobscounsellaw.com/legal-strategy-builder'
      });
      
      if (welcomeEmailHtml) {
        operations.push(
          sendEnhancedEmail({
            to: [formData.email],
            subject: 'You\'re in → This week: How crypto millionaires avoid IRS disasters',
            html: welcomeEmailHtml
          }).then(() => {
            if (leadId) leadDb.logInteraction(leadId, 'email_sent', { type: 'welcome_email' });
          }).catch(e => console.error('❌ Welcome email failed:', e.message))
        );
      }
      
      operations.push(
        sendEnhancedEmail({
          to: [config.notifications.highValueNotifyTo],
          subject: 'New Newsletter Subscriber',
          html: `
            <h2>New Newsletter Subscriber</h2>
            <p><strong>Name:</strong> ${formData.firstName || 'Not provided'}</p>
            <p><strong>Email:</strong> ${formData.email}</p>
            <p><strong>Source:</strong> ${formData.source || 'Website'}</p>
          `
        }).then(() => {
          if (leadId) leadDb.logInteraction(leadId, 'email_sent', { type: 'internal_notification' });
        }).catch(e => console.error('❌ Internal newsletter notification failed:', e.message))
      );
    }
    
    // Custom Email Automation + Kit Newsletter
    operations.push(
      processCustomEmailAutomation(formData, leadScore, submissionType)
        .then((result) => {
          if (leadId && result.success) {
            leadDb.logInteraction(leadId, 'custom_automation_started', {
              automation_id: result.automation_id,
              pathway: result.pathway,
              emails_scheduled: result.emails_scheduled
            });
          }
          log.info('✅ Custom email automation started', { 
            email: formData.email, 
            pathway: result.pathway,
            emails_scheduled: result.emails_scheduled 
          });
        })
        .catch(e => console.error('❌ Custom email automation failed:', e.message))
    );
    
    await processIntakeOperations(operations);
    
    // Elite newsletter subscription response
    res.json({
      success: true,
      submissionId,
      status: 'premium_subscriber_activated',
      message: 'Welcome to the elite legal intelligence network.',
      nextDelivery: 'Your first strategic legal briefing arrives Thursday at 8 AM EST.',
      exclusiveAccess: [
        'Weekly legal strategy insights used by Fortune 500 executives',
        'Case studies from $100M+ wealth protection strategies',
        'Early access to legal trend analysis and regulatory updates'
      ],
      communitySize: '50,000+ high-performing professionals',
      expectedValue: 'Legal strategies that could protect millions in wealth and prevent costly mistakes.',
      unsubscribeNote: 'You can adjust preferences or unsubscribe at any time from any email.',
      welcomeBonus: 'Access to our Emergency Legal Playbook for subscribers sent within 24 hours.'
    });
  } catch (error) {
    console.error('💥 Newsletter error:', error);
    res.status(500).json({ ok: false, error: error.message });
  }
});

// Outside Counsel (enhanced)
app.post('/outside-counsel', async (req, res) => {
  try {
    let formData = sanitizeInput(req.body);
    const submissionId = formData.submissionId || `OC-${Date.now()}`;
    formData = withNormalizedType(formData, 'outside-counsel');
    const submissionType = formData._normalizedType;

    console.log(`📥 New ${submissionType} submission:`, formData.email);

    const leadScore = calculateLeadScore(formData, submissionType);
    const leadId = await processIntakeWithDatabase(formData, submissionType, leadScore, submissionId);
    const aiAnalysis = await analyzeIntakeWithAI(formData, submissionType, leadScore);

    if (mixpanel) {
      mixpanel.track('Intake Submitted', {
        distinct_id: formData.email,
        service: submissionType,
        score: leadScore.score
      });
    }

    const operations = [];
    const alertRecipients = leadScore.score >= 70
      ? [config.notifications.intakeNotifyTo, config.notifications.highValueNotifyTo]
      : [config.notifications.intakeNotifyTo];

    operations.push(
      sendEnhancedEmail({
        to: alertRecipients,
        subject: `${leadScore.score >= 70 ? '🔥 HIGH VALUE' : ''} Outside Counsel — ${formData.companyName || 'New Lead'} (Score: ${leadScore.score})`,
        html: generateInternalAlert(formData, leadScore, submissionType, aiAnalysis, submissionId),
        priority: leadScore.score >= 70 ? 'high' : 'normal'
      }).then(() => {
        if (leadId) leadDb.logInteraction(leadId, 'email_sent', { type: 'internal_alert' });
      }).catch(e => console.error('❌ Internal email failed:', e.message))
    );

    // Custom Email Automation + Kit Newsletter
    operations.push(
      processCustomEmailAutomation(formData, leadScore, submissionType)
        .then((result) => {
          if (leadId && result.success) {
            leadDb.logInteraction(leadId, 'custom_automation_started', {
              automation_id: result.automation_id,
              pathway: result.pathway,
              emails_scheduled: result.emails_scheduled
            });
          }
          log.info('✅ Custom email automation started', { 
            email: formData.email, 
            pathway: result.pathway,
            emails_scheduled: result.emails_scheduled 
          });
        })
        .catch(e => console.error('❌ Custom email automation failed:', e.message))
    );

    operations.push(
      createClioLead(formData, submissionType, leadScore)
        .then(() => {
          if (leadId) leadDb.logInteraction(leadId, 'clio_created', {});
        })
        .catch(e => console.error('❌ Clio failed:', e.message))
    );

    if (formData.email) {
      const clientEmailHtml = generateClientConfirmationEmail(formData, null, submissionType, leadScore);
      if (clientEmailHtml) {
        operations.push(
          sendEnhancedEmail({
            to: [formData.email],
            subject: 'Jacobs Counsel — Your Outside Counsel Request & Next Steps',
            html: clientEmailHtml
          }).then(() => {
            if (leadId) leadDb.logInteraction(leadId, 'email_sent', { type: 'client_confirmation' });
          }).catch(e => console.error('❌ Client email failed:', e.message))
        );
      }
    }

    await processIntakeOperations(operations);

    res.json({
      success: true,
      submissionId: submissionId,
      leadScore: leadScore.score,
      aiAnalysisAvailable: !!aiAnalysis?.analysis
    });
  } catch (error) {
    console.error('💥 Outside counsel error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process outside counsel request'
    });
  }
});

// Resource guide download (enhanced)
app.post('/resource-guide-download', async (req, res) => {
  try {
    let formData = sanitizeInput(req.body || {});
    formData = withNormalizedType(formData, 'resource-guide');
    const submissionType = formData._normalizedType;
    const submissionId = `guide-${Date.now()}`;
    
    console.log(`📥 New ${submissionType} submission:`, formData.email);
    
    const leadScore = calculateLeadScore(formData, submissionType);
    const leadId = await processIntakeWithDatabase(formData, submissionType, leadScore, submissionId);
    
    if (mixpanel) {
      mixpanel.track('Resource Guide Download', {
        distinct_id: formData.email,
        source: formData.source || 'resource-guide'
      });
    }
    
    const operations = [];
    
    if (formData.email) {
      const thankYouEmailHtml = generateResourceThankYouEmail(formData, config.resources.guideUrl);
      if (thankYouEmailHtml) {
        operations.push(
          sendEnhancedEmail({
            to: [formData.email],
            subject: 'Your Legal Resource Guide - Jacobs Counsel',
            html: thankYouEmailHtml
          }).then(() => {
            if (leadId) leadDb.logInteraction(leadId, 'email_sent', { type: 'thank_you_email' });
          }).catch(e => console.error('❌ Thank you email failed:', e.message))
        );
      }
      
      // Internal notification
      operations.push(
        sendEnhancedEmail({
          to: [config.notifications.intakeNotifyTo],
          subject: 'Resource Guide Download',
          html: `
            <h2>New Resource Guide Download</h2>
            <p><strong>Name:</strong> ${formData.firstName || 'Not provided'}</p>
            <p><strong>Email:</strong> ${formData.email}</p>
            <p><strong>Lead Score:</strong> ${leadScore.score}/100</p>
            <p><strong>Source:</strong> ${formData.source || 'Website'}</p>
            <p><strong>Action Needed:</strong> Add to nurture sequence for guide downloaders</p>
          `
        }).then(() => {
          if (leadId) leadDb.logInteraction(leadId, 'email_sent', { type: 'internal_notification' });
        }).catch(e => console.error('❌ Internal notification failed:', e.message))
      );
    }
    
    // Custom Email Automation + Kit Newsletter
    operations.push(
      processCustomEmailAutomation(formData, leadScore, submissionType)
        .then((result) => {
          if (leadId && result.success) {
            leadDb.logInteraction(leadId, 'custom_automation_started', {
              automation_id: result.automation_id,
              pathway: result.pathway,
              emails_scheduled: result.emails_scheduled
            });
          }
          log.info('✅ Custom email automation started', { 
            email: formData.email, 
            pathway: result.pathway,
            emails_scheduled: result.emails_scheduled 
          });
        })
        .catch(e => console.error('❌ Custom email automation failed:', e.message))
    );
    
    operations.push(
      createClioLead(formData, submissionType, leadScore)
        .then(() => {
          if (leadId) leadDb.logInteraction(leadId, 'clio_created', {});
        })
        .catch(e => console.error('❌ Clio failed:', e.message))
    );
    
    await processIntakeOperations(operations);
    
    res.json({
      ok: true,
      submissionId,
      downloadLink: config.resources.guideUrl,
      message: 'Guide ready for download'
    });
  } catch (error) {
    console.error('💥 Resource guide error:', error);
    res.status(500).json({ ok: false, error: error.message });
  }
});

// Legacy add-subscriber endpoint (enhanced)
app.post('/add-subscriber', async (req, res) => {
  try {
    const { email, firstName = '', source = 'newsletter' } = req.body;

    if (!email) {
      return res.status(400).json({ ok: false, error: 'Email required' });
    }

    const leadScore = { score: 30, factors: ['Newsletter signup'] };
    const formData = { email, firstName, source };
    const submissionId = `legacy-${Date.now()}`;
    const submissionType = 'newsletter';

    const leadId = await processIntakeWithDatabase(
      { ...formData, submissionType }, 
      submissionType, 
      leadScore, 
      submissionId
    );

    // Send welcome email using new black text template
    if (formData.email) {
      const { CustomEmailAutomation } = await import('./src/services/customEmailAutomation.js');
      const automation = new CustomEmailAutomation();
      const welcomeEmailHtml = automation.generateEmailHTML('newsletter_welcome', 'Newsletter welcome content', formData.firstName || 'there', {
        strategicOpening: 'The same legal blind spots that destroy 90% of successful athletes, creators, and entrepreneurs? You just avoided them.',
        strategicInsight: 'Every Thursday at 8 AM, I send 50,000+ high-performers a single legal strategy that takes 3 minutes to read and could protect millions in wealth. LeBron\'s business manager credits strategies like these for saving $50M+ in taxes. Last week: How MrBeast\'s IP structure protects his empire. This week: The entity setup that saves crypto millionaires from IRS disasters.',
        ctaText: 'Get This Week\'s Legal Intel →',
        ctaUrl: 'https://www.jacobscounsellaw.com/legal-strategy-builder'
      });
      
      await sendEnhancedEmail({
        to: [formData.email],
        subject: 'You\'re in → This week: How crypto millionaires avoid IRS disasters',
        html: welcomeEmailHtml
      }).then(() => {
        if (leadId) leadDb.logInteraction(leadId, 'email_sent', { type: 'welcome_email' });
      });
      
      // Send internal notification
      await sendEnhancedEmail({
        to: [config.notifications.highValueNotifyTo],
        subject: 'New Newsletter Subscriber',
        html: `
          <h2>New Newsletter Subscriber</h2>
          <p><strong>Name:</strong> ${firstName || 'Not provided'}</p>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Source:</strong> ${source}</p>
        `
      }).then(() => {
        if (leadId) leadDb.logInteraction(leadId, 'email_sent', { type: 'internal_notification' });
      });
    }

    // Add to Kit (ConvertKit) for newsletter automation
    await addToKitWithAutomation(formData, leadScore, 'newsletter');

    if (mixpanel) {
      mixpanel.track('Newsletter Signup', {
        distinct_id: email,
        source: source
      });
    }

    res.json({ ok: true, message: 'Subscriber added successfully' });
  } catch (error) {
    console.error('Newsletter error:', error);
    res.status(500).json({ ok: false, error: 'Subscription failed' });
  }
});

// Additional guide downloads (NEW)
app.post('/business-guide-download', async (req, res) => {
  try {
    let formData = sanitizeInput(req.body || {});
    formData.guideType = 'business-guide';
    const submissionType = 'resource-guide';
    const submissionId = `business-guide-${Date.now()}`;
    
    console.log(`📥 New business guide download:`, formData.email);
    
    const leadScore = { score: 35, factors: ['Business guide download'], priority: 'STANDARD' };
    const leadId = await processIntakeWithDatabase(
      { ...formData, submissionType }, 
      submissionType, 
      leadScore, 
      submissionId
    );
    
    const operations = [];
    
    if (formData.email) {
      // Client thank you email
      operations.push(
        sendEnhancedEmail({
          to: [formData.email],
          subject: 'Your Business Formation Guide - Jacobs Counsel',
          html: generateResourceThankYouEmail(formData, 'https://jacobscounsellaw.com/s/The-VC-Ready-Business-Formation-Blueprint.pdf')
        }).then(() => {
          if (leadId) leadDb.logInteraction(leadId, 'email_sent', { type: 'thank_you_email' });
        }).catch(e => console.error('❌ Thank you email failed:', e.message))
      );
      
      // Internal notification
      operations.push(
        sendEnhancedEmail({
          to: [config.notifications.intakeNotifyTo],
          subject: 'Business Guide Download',
          html: `
            <h2>Business Formation Guide Downloaded</h2>
            <p><strong>Name:</strong> ${formData.firstName || 'Not provided'}</p>
            <p><strong>Email:</strong> ${formData.email}</p>
            <p><strong>Action:</strong> Follow up with business formation consultation offer</p>
            <p><strong>Calendly:</strong> <a href="${config.calendlyLinks['business-formation']}">Book Business Consultation</a></p>
          `
        }).then(() => {
          if (leadId) leadDb.logInteraction(leadId, 'email_sent', { type: 'internal_notification' });
        }).catch(e => console.error('❌ Internal notification failed:', e.message))
      );
    }
    
    // Add to Kit newsletter with business-focused tags
    const customFormData = { ...formData, tags: ['business-guide-download', 'trigger-business-sequence'] };
    operations.push(
      addToKitWithAutomation(customFormData, leadScore, submissionType)
        .then(() => {
          if (leadId) leadDb.logInteraction(leadId, 'kit_added', { tags: ['business-guide'] });
        })
        .catch(e => console.error('❌ Kit newsletter failed:', e.message))
    );
    
    operations.push(
      createClioLead(customFormData, 'business-guide-download', leadScore)
        .then(() => {
          if (leadId) leadDb.logInteraction(leadId, 'clio_created', {});
        })
        .catch(e => console.error('❌ Clio failed:', e.message))
    );
    
    await processIntakeOperations(operations);
    
    res.json({
      ok: true,
      submissionId,
      downloadLink: 'https://jacobscounsellaw.com/s/The-VC-Ready-Business-Formation-Blueprint.pdf',
      message: 'Business guide ready for download'
    });
  } catch (error) {
    console.error('💥 Business guide error:', error);
    res.status(500).json({ ok: false, error: error.message });
  }
});

app.post('/brand-guide-download', async (req, res) => {
  try {
    let formData = sanitizeInput(req.body || {});
    formData.guideType = 'brand-guide';
    const submissionType = 'resource-guide';
    const submissionId = `brand-guide-${Date.now()}`;
    
    console.log(`📥 New brand guide download:`, formData.email);
    
    const leadScore = { score: 32, factors: ['Brand protection guide download'], priority: 'STANDARD' };
    const leadId = await processIntakeWithDatabase(
      { ...formData, submissionType }, 
      submissionType, 
      leadScore, 
      submissionId
    );
    
    const operations = [];
    
    if (formData.email) {
      operations.push(
        sendEnhancedEmail({
          to: [formData.email],
          subject: 'Your Brand Protection Guide - Jacobs Counsel',
          html: generateResourceThankYouEmail(formData, 'https://jacobscounsellaw.com/s/Emergency-Brand-Protection-Playbook.pdf')
        }).then(() => {
          if (leadId) leadDb.logInteraction(leadId, 'email_sent', { type: 'thank_you_email' });
        }).catch(e => console.error('❌ Thank you email failed:', e.message))
      );
      
      operations.push(
        sendEnhancedEmail({
          to: [config.notifications.intakeNotifyTo],
          subject: 'Brand Protection Guide Download',
          html: `
            <h2>Brand Protection Guide Downloaded</h2>
            <p><strong>Name:</strong> ${formData.firstName || 'Not provided'}</p>
            <p><strong>Email:</strong> ${formData.email}</p>
            <p><strong>Action:</strong> Follow up with trademark consultation offer</p>
            <p><strong>Calendly:</strong> <a href="${config.calendlyLinks['brand-protection']}">Book Brand Consultation</a></p>
          `
        }).then(() => {
          if (leadId) leadDb.logInteraction(leadId, 'email_sent', { type: 'internal_notification' });
        }).catch(e => console.error('❌ Internal notification failed:', e.message))
      );
    }
    
    const customFormData = { ...formData, tags: ['brand-guide-download', 'trigger-brand-sequence'] };
    operations.push(
      addToKitWithAutomation(customFormData, leadScore, submissionType)
        .then(() => {
          if (leadId) leadDb.logInteraction(leadId, 'kit_added', { tags: ['brand-guide'] });
        })
        .catch(e => console.error('❌ Kit newsletter failed:', e.message))
    );
    
    operations.push(
      createClioLead(customFormData, 'brand-guide-download', leadScore)
        .then(() => {
          if (leadId) leadDb.logInteraction(leadId, 'clio_created', {});
        })
        .catch(e => console.error('❌ Clio failed:', e.message))
    );
    
    await processIntakeOperations(operations);
    
    res.json({
      ok: true,
      submissionId,
      downloadLink: 'https://jacobscounsellaw.com/s/Emergency-Brand-Protection-Playbook.pdf',
      message: 'Brand protection guide ready for download'
    });
  } catch (error) {
    console.error('💥 Brand guide error:', error);
    res.status(500).json({ ok: false, error: error.message });
  }
});

app.post('/estate-guide-download', async (req, res) => {
  try {
    let formData = sanitizeInput(req.body || {});
    formData.guideType = 'estate-guide';
    const submissionType = 'resource-guide';
    const submissionId = `estate-guide-${Date.now()}`;
    
    console.log(`📥 New estate guide download:`, formData.email);
    
    const leadScore = { score: 40, factors: ['Estate planning guide download'], priority: 'STANDARD' };
    const leadId = await processIntakeWithDatabase(
      { ...formData, submissionType }, 
      submissionType, 
      leadScore, 
      submissionId
    );
    
    const operations = [];
    
    if (formData.email) {
      operations.push(
        sendEnhancedEmail({
          to: [formData.email],
          subject: 'Your Estate Planning Guide - Jacobs Counsel',
          html: generateResourceThankYouEmail(formData, 'https://jacobscounsellaw.com/s/Estate-Planning-for-High-Achievers.pdf')
        }).then(() => {
          if (leadId) leadDb.logInteraction(leadId, 'email_sent', { type: 'thank_you_email' });
        }).catch(e => console.error('❌ Thank you email failed:', e.message))
      );
      
      operations.push(
        sendEnhancedEmail({
          to: [config.notifications.intakeNotifyTo],
          subject: 'Estate Planning Guide Download',
          html: `
            <h2>Estate Planning Guide Downloaded</h2>
            <p><strong>Name:</strong> ${formData.firstName || 'Not provided'}</p>
            <p><strong>Email:</strong> ${formData.email}</p>
            <p><strong>Action:</strong> High-value prospect - follow up with estate consultation offer</p>
            <p><strong>Calendly:</strong> <a href="${config.calendlyLinks['estate-planning']}">Book Estate Consultation</a></p>
          `
        }).then(() => {
          if (leadId) leadDb.logInteraction(leadId, 'email_sent', { type: 'internal_notification' });
        }).catch(e => console.error('❌ Internal notification failed:', e.message))
      );
    }
    
    const customFormData = { ...formData, tags: ['estate-guide-download', 'trigger-estate-sequence'] };
    operations.push(
      addToKitWithAutomation(customFormData, leadScore, submissionType)
        .then(() => {
          if (leadId) leadDb.logInteraction(leadId, 'kit_added', { tags: ['estate-guide'] });
        })
        .catch(e => console.error('❌ Kit newsletter failed:', e.message))
    );
    
    operations.push(
      createClioLead(customFormData, 'estate-guide-download', leadScore)
        .then(() => {
          if (leadId) leadDb.logInteraction(leadId, 'clio_created', {});
        })
        .catch(e => console.error('❌ Clio failed:', e.message))
    );
    
    await processIntakeOperations(operations);
    
    res.json({
      ok: true,
      submissionId,
      downloadLink: 'https://jacobscounsellaw.com/s/Estate-Planning-for-High-Achievers.pdf',
      message: 'Estate planning guide ready for download'
    });
  } catch (error) {
    console.error('💥 Estate guide error:', error);
    res.status(500).json({ ok: false, error: error.message });
  }
});

// Calendly webhook (enhanced with database tracking)
app.post('/webhook/calendly', async (req, res) => {
  try {
    console.log('Calendly webhook received:', JSON.stringify(req.body));

    const { event, payload } = req.body;

    if (event === 'invitee.created') {
      const invitee = payload.invitee || {};
      const scheduled_event = payload.scheduled_event || {};
      const email = invitee.email;
      const name = invitee.name || invitee.first_name || 'Unknown Client';

      // NEW: Update database
      const lead = leadDb.getLeadByEmail(email);
      if (lead) {
        leadDb.logInteraction(lead.id, 'calendly_booked', {
          event_name: scheduled_event.name,
          start_time: scheduled_event.start_time
        });
      }

      console.log(`📅 Meeting booked: ${email}`);

      // CRITICAL: Pause email automation for this lead
      try {
        const automationResult = await consultationHandler.handleConsultationBooking({
          body: {
            email: email,
            bookingType: scheduled_event.name,
            bookingData: {
              name: name,
              start_time: scheduled_event.start_time,
              event_uri: scheduled_event.uri,
              calendly_event: 'invitee.created'
            }
          }
        });
        console.log(`✅ Email automation paused for ${email}:`, automationResult.success);
        
        // CUSTOMER EXPERIENCE ENHANCEMENT: Send consultation preparation email
        try {
          const { CustomEmailAutomation } = await import('./src/services/customEmailAutomation.js');
          const emailService = new CustomEmailAutomation();
          const prepEmail = emailService.generateEmailHTML('consultation_preparation', name.split(' ')[0] || 'Valued Client', {
            submissionType: 'consultation-booking'
          });
          
          // Send preparation email immediately
          const emailResult = await sendEmail({
            to: email,
            subject: `Preparing for Your Consultation - ${name.split(' ')[0] || 'Valued Client'}`,
            html: prepEmail,
            from: process.env.FROM_EMAIL || 'noreply@jacobscounsellaw.com'
          });
          
          console.log(`📧 Consultation preparation email sent to ${email}:`, emailResult.success);
        } catch (prepError) {
          console.error(`❌ Failed to send preparation email to ${email}:`, prepError.message);
        }
      } catch (automationError) {
        console.error(`❌ Failed to pause automation for ${email}:`, automationError.message);
      }

      if (mixpanel) {
        mixpanel.track('Consultation Booked', {
          distinct_id: email,
          event_name: scheduled_event.name,
          start_time: scheduled_event.start_time
        });
      }
    }

    if (event === 'invitee.canceled') {
      const invitee = payload.invitee || {};
      const email = invitee.email;

      // NEW: Update database
      const lead = leadDb.getLeadByEmail(email);
      if (lead) {
        leadDb.logInteraction(lead.id, 'calendly_canceled', {});
      }

      console.log(`❌ Meeting canceled: ${email}`);
      // Rest of existing logic...
    }

    res.json({ received: true }); // SAME response format
  } catch (error) {
    console.error('Calendly webhook error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Kit Automation Builder Endpoint
app.post('/admin/build-kit-automations', async (req, res) => {
  try {
    const { buildKitAutomations, testKitConnection } = await import('./src/services/kitAutomationBuilder.js');
    
    console.log('🚀 Building Kit automation architecture...');
    
    // Test connection first
    const testResult = await testKitConnection();
    if (!testResult.success) {
      return res.status(400).json({
        ok: false,
        error: 'Kit connection failed',
        details: testResult.error
      });
    }
    
    // Build automation architecture
    const results = await buildKitAutomations();
    
    res.json({
      ok: true,
      message: 'Kit automation architecture built successfully',
      results: {
        sequences: results.sequences.length,
        tags: results.tags.length,
        automations: results.automations.length,
        errors: results.errors
      }
    });
    
  } catch (error) {
    console.error('Kit build error:', error);
    res.status(500).json({
      ok: false,
      error: 'Failed to build Kit automation architecture',
      details: error.message
    });
  }
});


// Health Check (enhanced with database status)
app.get('/health', async (req, res) => {
  const envStatus = validateEnvironment();
  
  res.json({
    status: 'operational',
    timestamp: new Date().toISOString(),
    services: {
      ...envStatus.status,
      database: 'active', // NEW
      calendly: 'webhook active'
    },
    database: {
      totalLeads: db.prepare('SELECT COUNT(*) as count FROM leads').get().count,
      highValueLeads: db.prepare('SELECT COUNT(*) as count FROM leads WHERE lead_score >= 70').get().count,
      last24Hours: db.prepare("SELECT COUNT(*) as count FROM leads WHERE created_at >= datetime('now', '-24 hours')").get().count
    }
  });
});

// Root endpoint (same)
app.get('/', (req, res) => {
  res.json({
    ok: true,
    service: 'jacobs-counsel-unified-intake',
    version: '3.1.0-ENHANCED', // Updated version
    endpoints: [
      '/estate-intake',
      '/business-formation-intake', 
      '/brand-protection-intake',
      '/outside-counsel',
      '/legal-risk-assessment',
      '/newsletter-signup',
      '/resource-guide-download',
      '/business-guide-download',
      '/brand-guide-download', 
      '/estate-guide-download',
      '/add-subscriber',
      '/webhook/calendly',
      '/health',
      '/api/analytics/dashboard',
      '/api/analytics/lead-intelligence',
      '/api/analytics/followup-recommendations',
      '/admin/build-kit-sequences',
      '/admin/build-kit-automations'
    ],
    features: ['Lead Scoring', 'Kit Newsletter', 'Calendly', 'Clio', 'Email Notifications', 'Analytics Dashboard'] // Added analytics
  });
});

// Error handling (enhanced logging)
app.use((err, req, res, next) => {
  log.error('Unhandled error', { 
    error: err.message, 
    stack: err.stack,
    url: req.url,
    method: req.method
  });
  res.status(500).json({
    ok: false,
    error: 'Server error. Please try again or contact us directly.'
  });
});

// Start server
app.listen(config.port, () => {
  try {
    const envStatus = validateEnvironment();
    console.log(`🚀 Jacobs Counsel System running on port ${config.port}`);
    console.log(`📊 Features: Lead Scoring, Analytics Dashboard, Custom Email Automation, Calendly, Clio`);
    console.log(`🗄️ Database: SQLite with lead tracking and analytics`);
    
    // Start the email automation processor
    emailProcessor.start();
    console.log(`📧 Email Automation System: ACTIVE`);
    console.log(`✅ Backwards compatible - all existing endpoints preserved`);
    console.log(`📈 New analytics available at /api/analytics/dashboard`);
    console.log(`📅 Calendly webhook active at /webhook/calendly`);
  } catch (error) {
    console.error('❌ Startup failed:', error.message);
    process.exit(1);
  }
});

export default app;