// Jacobs Counsel Clean Backend - All Endpoints with 3-Part Email Flow
// Client Email + Internal Email + Clio Grow + Kit Intelligent Tagging

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import multer from 'multer';
import { config } from './src/config/environment.js';
import { leadDb } from './src/models/database-production.js';
import { calculateLeadScore } from './src/services/leadScoring.js';
import { 
  sendEnhancedEmail,
  createClioLead,
  addToKitWithIntelligentTagging,
  sanitizeInput,
  escapeHtml
} from './src/services/coreServices.js';
import { 
  generateClientEmail, 
  generateInternalEmail, 
  generateResourceThankYouEmail, 
  generateNewsletterWelcomeEmail 
} from './src/simple-email-templates.js';
import { log } from './src/utils/logger.js';

const app = express();
const upload = multer({ storage: multer.memoryStorage() });

// Security and middleware
app.use(helmet());
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Serve static HTML files
app.use(express.static('.', {
  extensions: ['html'],
  index: false
}));

// Helper functions
const getClientSubject = (submissionType) => {
  const subjects = {
    'estate-intake': 'Estate Planning Intake Received',
    'business-formation': 'Business Formation Intake Received',
    'brand-protection': 'Brand Protection Intake Received',
    'gaming-legal-intake': 'Gaming Legal Consultation Request Received',
    'legal-strategy-builder': 'Legal Strategy Assessment Complete',
    'newsletter-signup': 'Welcome to Strategic Legal Insights',
    'resource-guide': 'Your Legal Resource Guide',
    'business-guide': 'Your Business Formation Guide',
    'brand-guide': 'Your Brand Protection Guide',
    'estate-guide': 'Your Estate Planning Guide'
  };
  return subjects[submissionType] || 'Submission Received';
};

const getServiceName = (submissionType) => {
  const names = {
    'estate-intake': 'Estate Planning',
    'business-formation': 'Business Formation',
    'brand-protection': 'Brand Protection',
    'gaming-legal-intake': 'Gaming & Interactive Entertainment Legal',
    'legal-strategy-builder': 'Legal Strategy Builder',
    'newsletter-signup': 'Newsletter Signup',
    'resource-guide': 'Resource Guide',
    'business-guide': 'Business Guide',
    'brand-guide': 'Brand Guide',
    'estate-guide': 'Estate Guide'
  };
  return names[submissionType] || 'Legal Intake';
};

// 🏠 Root endpoint
app.get('/', (req, res) => {
  res.json({
    status: 'active',
    system: 'Jacobs Counsel Legal Intake & Intelligent Automation',
    version: '2.1.0',
    features: ['3-Part Email Flow', 'Kit Intelligent Tagging', 'Clio Integration', 'Lead Scoring'],
    endpoints: [
      '/estate-intake',
      '/business-formation-intake', 
      '/brand-protection-intake',
      '/gaming-legal-intake',
      '/legal-strategy-builder',
      '/newsletter-signup'
    ]
  });
});

// 1. ESTATE INTAKE ENDPOINT
app.post('/estate-intake', upload.array('documents'), async (req, res) => {
  try {
    const formData = sanitizeInput(req.body || {});
    const submissionId = formData.submissionId || `estate-${Date.now()}`;
    const submissionType = 'estate-intake';
    
    console.log(`📥 New ${submissionType} submission:`, formData.email);

    const leadScore = calculateLeadScore(formData, submissionType);
    console.log(`📊 Lead score: ${leadScore.score}/100 (${leadScore.priority})`);

    // Store in database
    const leadId = leadDb.insertLead({
      ...formData,
      submission_type: submissionType,
      lead_score: leadScore.score,
      priority: leadScore.priority,
      submission_id: submissionId
    }).lastInsertRowid;

    // 3-PART EMAIL FLOW
    
    // 1. CLIENT CONFIRMATION EMAIL
    const clientEmail = generateClientEmail(formData, submissionType);
    await sendEnhancedEmail({
      to: [formData.email],
      subject: getClientSubject(submissionType) + ' - Next Steps',
      html: clientEmail
    }).catch(e => console.error('❌ Client email failed:', e.message));

    // 2. INTERNAL ALERT EMAIL
    const internalEmail = generateInternalEmail(formData, leadScore, submissionType);
    const alertRecipients = leadScore.score >= 80 
      ? ['drew@jacobscounsel.com', 'intake@jacobscounsel.com']
      : ['drew@jacobscounsel.com'];
    
    await sendEnhancedEmail({
      to: alertRecipients,
      subject: `${leadScore.score >= 80 ? '🔥 HIGH VALUE' : '📋'} ${getServiceName(submissionType)} — ${formData.email} (Score: ${leadScore.score})`,
      html: internalEmail,
      priority: leadScore.score >= 80 ? 'high' : 'normal'
    }).catch(e => console.error('❌ Internal email failed:', e.message));

    // 3. CLIO GROW INTEGRATION
    await createClioLead(formData, leadScore, submissionType)
      .then(result => {
        if (result.success) {
          leadDb.logInteraction(leadId, 'clio_lead_created', { clioId: result.clioId });
          console.log('✅ Clio lead created:', result.clioId);
        }
      })
      .catch(e => console.error('❌ Clio integration failed:', e.message));

    // 4. KIT INTELLIGENT TAGGING
    await addToKitWithIntelligentTagging(formData, leadScore, submissionType)
      .then(result => {
        if (result.success) {
          console.log(`✅ Kit tagging applied: ${result.tags?.length || 0} tags`);
        }
      })
      .catch(e => console.error('❌ Kit tagging failed:', e.message));

    // Log interaction
    leadDb.logInteraction(leadId, 'form_submitted', { 
      type: submissionType,
      score: leadScore.score,
      priority: leadScore.priority
    });

    res.json({ 
      success: true, 
      message: `${getServiceName(submissionType)} submission received successfully. Check your email for next steps.`,
      submissionId
    });

  } catch (error) {
    console.error(`❌ ${submissionType} error:`, error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error. Please try again.',
      submissionId: req.body?.submissionId || `error-${Date.now()}`
    });
  }
});

// 2. BUSINESS FORMATION ENDPOINT
app.post('/business-formation-intake', upload.array('documents'), async (req, res) => {
  try {
    const formData = sanitizeInput(req.body || {});
    const submissionId = formData.submissionId || `business-${Date.now()}`;
    const submissionType = 'business-formation';
    
    console.log(`📥 New ${submissionType} submission:`, formData.email);

    const leadScore = calculateLeadScore(formData, submissionType);
    console.log(`📊 Lead score: ${leadScore.score}/100 (${leadScore.priority})`);

    const leadId = leadDb.insertLead({
      ...formData,
      submission_type: submissionType,
      lead_score: leadScore.score,
      priority: leadScore.priority,
      submission_id: submissionId
    }).lastInsertRowid;

    // 3-PART EMAIL FLOW
    const clientEmail = generateClientEmail(formData, submissionType);
    await sendEnhancedEmail({
      to: [formData.email],
      subject: getClientSubject(submissionType) + ' - Next Steps',
      html: clientEmail
    }).catch(e => console.error('❌ Client email failed:', e.message));

    const internalEmail = generateInternalEmail(formData, leadScore, submissionType);
    const alertRecipients = leadScore.score >= 80 
      ? ['drew@jacobscounsel.com', 'intake@jacobscounsel.com']
      : ['drew@jacobscounsel.com'];
    
    await sendEnhancedEmail({
      to: alertRecipients,
      subject: `${leadScore.score >= 80 ? '🔥 HIGH VALUE' : '📋'} ${getServiceName(submissionType)} — ${formData.email} (Score: ${leadScore.score})`,
      html: internalEmail,
      priority: leadScore.score >= 80 ? 'high' : 'normal'
    }).catch(e => console.error('❌ Internal email failed:', e.message));

    await createClioLead(formData, leadScore, submissionType)
      .then(result => {
        if (result.success) {
          leadDb.logInteraction(leadId, 'clio_lead_created', { clioId: result.clioId });
          console.log('✅ Clio lead created:', result.clioId);
        }
      })
      .catch(e => console.error('❌ Clio integration failed:', e.message));

    await addToKitWithIntelligentTagging(formData, leadScore, submissionType)
      .then(result => {
        if (result.success) {
          console.log(`✅ Kit tagging applied: ${result.tags?.length || 0} tags`);
        }
      })
      .catch(e => console.error('❌ Kit tagging failed:', e.message));

    leadDb.logInteraction(leadId, 'form_submitted', { 
      type: submissionType,
      score: leadScore.score,
      priority: leadScore.priority
    });

    res.json({ 
      success: true, 
      message: `${getServiceName(submissionType)} submission received successfully. Check your email for next steps.`,
      submissionId
    });

  } catch (error) {
    console.error(`❌ ${submissionType} error:`, error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error. Please try again.',
      submissionId: req.body?.submissionId || `error-${Date.now()}`
    });
  }
});

// 3. BRAND PROTECTION ENDPOINT
app.post('/brand-protection-intake', upload.array('documents'), async (req, res) => {
  try {
    const formData = sanitizeInput(req.body || {});
    const submissionId = formData.submissionId || `brand-${Date.now()}`;
    const submissionType = 'brand-protection';
    
    console.log(`📥 New ${submissionType} submission:`, formData.email);

    const leadScore = calculateLeadScore(formData, submissionType);
    console.log(`📊 Lead score: ${leadScore.score}/100 (${leadScore.priority})`);

    const leadId = leadDb.insertLead({
      ...formData,
      submission_type: submissionType,
      lead_score: leadScore.score,
      priority: leadScore.priority,
      submission_id: submissionId
    }).lastInsertRowid;

    // 3-PART EMAIL FLOW
    const clientEmail = generateClientEmail(formData, submissionType);
    await sendEnhancedEmail({
      to: [formData.email],
      subject: getClientSubject(submissionType) + ' - Next Steps',
      html: clientEmail
    }).catch(e => console.error('❌ Client email failed:', e.message));

    const internalEmail = generateInternalEmail(formData, leadScore, submissionType);
    const alertRecipients = leadScore.score >= 80 
      ? ['drew@jacobscounsel.com', 'intake@jacobscounsel.com']
      : ['drew@jacobscounsel.com'];
    
    await sendEnhancedEmail({
      to: alertRecipients,
      subject: `${leadScore.score >= 80 ? '🔥 HIGH VALUE' : '📋'} ${getServiceName(submissionType)} — ${formData.email} (Score: ${leadScore.score})`,
      html: internalEmail,
      priority: leadScore.score >= 80 ? 'high' : 'normal'
    }).catch(e => console.error('❌ Internal email failed:', e.message));

    await createClioLead(formData, leadScore, submissionType)
      .then(result => {
        if (result.success) {
          leadDb.logInteraction(leadId, 'clio_lead_created', { clioId: result.clioId });
          console.log('✅ Clio lead created:', result.clioId);
        }
      })
      .catch(e => console.error('❌ Clio integration failed:', e.message));

    await addToKitWithIntelligentTagging(formData, leadScore, submissionType)
      .then(result => {
        if (result.success) {
          console.log(`✅ Kit tagging applied: ${result.tags?.length || 0} tags`);
        }
      })
      .catch(e => console.error('❌ Kit tagging failed:', e.message));

    leadDb.logInteraction(leadId, 'form_submitted', { 
      type: submissionType,
      score: leadScore.score,
      priority: leadScore.priority
    });

    res.json({ 
      success: true, 
      message: `${getServiceName(submissionType)} submission received successfully. Check your email for next steps.`,
      submissionId
    });

  } catch (error) {
    console.error(`❌ ${submissionType} error:`, error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error. Please try again.',
      submissionId: req.body?.submissionId || `error-${Date.now()}`
    });
  }
});

// 4. GAMING & INTERACTIVE ENTERTAINMENT LEGAL INTAKE ENDPOINT
app.post('/gaming-legal-intake', upload.array('documents'), async (req, res) => {
  try {
    const formData = sanitizeInput(req.body || {});
    const submissionId = formData.submissionId || `gaming-${Date.now()}`;
    const submissionType = 'gaming-legal-intake';
    
    console.log(`🎮 New ${submissionType} submission:`, formData.email);

    // Gaming-specific lead scoring with high base value
    let leadScore = 40; // Base score (equalized system)
    
    // High-value indicators for gaming legal
    if (formData.hasRealMoney === true || formData.hasRealMoney === 'true') leadScore += 15;
    if (formData.isSkillBased === true || formData.isSkillBased === 'true') leadScore += 20; // Highest complexity
    if (formData.currentStage === 'live' || formData.currentStage === 'scaling') leadScore += 10;
    if (formData.urgencyLevel === 'immediate') leadScore += 15;
    if (formData.monthlyRevenue && ['100k-500k', '500k+'].includes(formData.monthlyRevenue)) leadScore += 10;
    if (formData.specificChallenges && formData.specificChallenges.length > 50) leadScore += 5;
    
    // Gaming-specific services boost
    if (formData.legalServices && Array.isArray(formData.legalServices)) {
      if (formData.legalServices.includes('compliance-analysis')) leadScore += 5;
      if (formData.legalServices.includes('legal-opinions')) leadScore += 10;
      if (formData.legalServices.includes('regulatory-defense')) leadScore += 15;
    }
    
    // Cap the score at 100
    leadScore = Math.min(leadScore, 100);

    // Determine priority - gaming legal clients are inherently high value
    let priority = 'high'; // Default high for all gaming legal
    
    if (formData.isSkillBased === true || formData.isSkillBased === 'true' || 
        formData.hasRealMoney === true || formData.hasRealMoney === 'true' || 
        formData.urgencyLevel === 'immediate' || 
        leadScore >= 80) {
      priority = 'critical';
    }

    const finalLeadScore = { score: leadScore, priority };
    console.log(`🎯 Gaming legal lead score: ${finalLeadScore.score}/100 (${finalLeadScore.priority})`);

    // Store in database with gaming-specific fields
    const leadId = leadDb.insertLead({
      ...formData,
      submission_type: submissionType,
      lead_score: finalLeadScore.score,
      priority: finalLeadScore.priority,
      submission_id: submissionId,
      practice_area: 'Gaming & Interactive Entertainment Legal',
      game_type: formData.gameType || 'Not specified',
      has_real_money: formData.hasRealMoney === true || formData.hasRealMoney === 'true' ? 'Yes' : 'No',
      is_skill_based: formData.isSkillBased === true || formData.isSkillBased === 'true' ? 'Yes' : 'No',
      business_value: 'High' // Gaming legal clients are inherently high value
    }).lastInsertRowid;

    // 3-PART EMAIL FLOW FOR GAMING LEGAL
    
    // 1. CLIENT CONFIRMATION EMAIL
    const clientEmail = generateClientEmail(formData, submissionType);
    await sendEnhancedEmail({
      to: [formData.email],
      subject: getClientSubject(submissionType) + ' - High Priority Response',
      html: clientEmail
    }).catch(e => console.error('❌ Gaming client email failed:', e.message));

    // 2. INTERNAL ALERT EMAIL - Always high priority for gaming
    const internalEmail = generateInternalEmail(formData, finalLeadScore, submissionType);
    const alertRecipients = ['drew@jacobscounsel.com']; // Always alert Drew for gaming legal
    
    const priorityEmoji = finalLeadScore.priority === 'critical' ? '🚨 CRITICAL' : '🎮 HIGH PRIORITY';
    await sendEnhancedEmail({
      to: alertRecipients,
      subject: `${priorityEmoji} Gaming Legal — ${formData.company || formData.firstName} ${formData.lastName} (Score: ${finalLeadScore.score})`,
      html: internalEmail,
      priority: 'high' // Always high priority for gaming
    }).catch(e => console.error('❌ Gaming internal email failed:', e.message));

    // 3. CLIO GROW INTEGRATION
    await createClioLead(formData, finalLeadScore, submissionType)
      .then(result => {
        if (result.success) {
          leadDb.logInteraction(leadId, 'clio_lead_created', { clioId: result.clioId });
          console.log('✅ Gaming Clio lead created:', result.clioId);
        }
      })
      .catch(e => console.error('❌ Gaming Clio integration failed:', e.message));

    // 4. KIT INTELLIGENT TAGGING FOR GAMING LEGAL
    await addToKitWithIntelligentTagging(formData, finalLeadScore, submissionType)
      .then(result => {
        if (result.success) {
          console.log(`✅ Gaming Kit tagging applied: ${result.tags?.length || 0} tags`);
        }
      })
      .catch(e => console.error('❌ Gaming Kit tagging failed:', e.message));

    // Log the interaction
    leadDb.logInteraction(leadId, 'gaming_legal_submission', {
      score: finalLeadScore.score,
      priority: finalLeadScore.priority,
      gameType: formData.gameType,
      hasRealMoney: formData.hasRealMoney,
      isSkillBased: formData.isSkillBased,
      urgencyLevel: formData.urgencyLevel
    });

    // Success response with gaming-specific messaging
    res.json({ 
      success: true, 
      message: `Gaming legal consultation request received with ${finalLeadScore.priority.toUpperCase()} priority status`,
      submissionId,
      leadScore: finalLeadScore.score,
      priority: finalLeadScore.priority,
      nextSteps: {
        responseTime: finalLeadScore.priority === 'critical' ? 'Within 2 hours' : 'Within 24 hours',
        schedulingLink: 'https://calendly.com/jacobscounsel/gaming-consultation',
        emergencyContact: finalLeadScore.priority === 'critical' ? 'Immediate consultation available' : null
      },
      practiceArea: 'Gaming & Interactive Entertainment Legal',
      estimatedValue: finalLeadScore.score > 80 ? 'Very High' : finalLeadScore.score > 60 ? 'High' : 'Medium'
    });

  } catch (error) {
    console.error(`❌ ${submissionType} error:`, error);
    res.status(500).json({ 
      success: false, 
      message: 'An error occurred processing your gaming legal consultation request. Please try again.',
      submissionId: req.body?.submissionId || `gaming-error-${Date.now()}`
    });
  }
});

// 5. LEGAL STRATEGY BUILDER ENDPOINT (The premium assessment tool)
app.post('/legal-strategy-builder', async (req, res) => {
  try {
    const formData = sanitizeInput(req.body || {});
    const submissionId = formData.submissionId || `strategy-${Date.now()}`;
    const submissionType = 'legal-strategy-builder';
    
    console.log(`📥 New ${submissionType} submission:`, formData.email);

    const leadScore = calculateLeadScore(formData, submissionType);
    console.log(`📊 Lead score: ${leadScore.score}/100 (${leadScore.priority})`);

    const leadId = leadDb.insertLead({
      ...formData,
      submission_type: submissionType,
      lead_score: leadScore.score,
      priority: leadScore.priority,
      submission_id: submissionId
    }).lastInsertRowid;

    // 3-PART EMAIL FLOW
    const clientEmail = generateClientEmail(formData, submissionType);
    await sendEnhancedEmail({
      to: [formData.email],
      subject: getClientSubject(submissionType) + ' - Your Results & Next Steps',
      html: clientEmail
    }).catch(e => console.error('❌ Client email failed:', e.message));

    const internalEmail = generateInternalEmail(formData, leadScore, submissionType);
    const alertRecipients = leadScore.score >= 80 
      ? ['drew@jacobscounsel.com', 'intake@jacobscounsel.com']
      : ['drew@jacobscounsel.com'];
    
    await sendEnhancedEmail({
      to: alertRecipients,
      subject: `${leadScore.score >= 80 ? '🔥 HIGH VALUE' : '📋'} ${getServiceName(submissionType)} — ${formData.email} (Score: ${leadScore.score})`,
      html: internalEmail,
      priority: leadScore.score >= 80 ? 'high' : 'normal'
    }).catch(e => console.error('❌ Internal email failed:', e.message));

    await createClioLead(formData, leadScore, submissionType)
      .then(result => {
        if (result.success) {
          leadDb.logInteraction(leadId, 'clio_lead_created', { clioId: result.clioId });
          console.log('✅ Clio lead created:', result.clioId);
        }
      })
      .catch(e => console.error('❌ Clio integration failed:', e.message));

    await addToKitWithIntelligentTagging(formData, leadScore, submissionType)
      .then(result => {
        if (result.success) {
          console.log(`✅ Kit tagging applied: ${result.tags?.length || 0} tags`);
        }
      })
      .catch(e => console.error('❌ Kit tagging failed:', e.message));

    leadDb.logInteraction(leadId, 'form_submitted', { 
      type: submissionType,
      score: leadScore.score,
      priority: leadScore.priority
    });

    res.json({ 
      success: true, 
      message: `${getServiceName(submissionType)} complete. Check your email for detailed results.`,
      submissionId
    });

  } catch (error) {
    console.error(`❌ ${submissionType} error:`, error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error. Please try again.',
      submissionId: req.body?.submissionId || `error-${Date.now()}`
    });
  }
});

// 5. NEWSLETTER SIGNUP ENDPOINT
app.post('/newsletter-signup', async (req, res) => {
  try {
    const formData = sanitizeInput(req.body || {});
    const submissionId = formData.submissionId || `newsletter-${Date.now()}`;
    const submissionType = 'newsletter-signup';
    
    console.log(`📥 New ${submissionType} submission:`, formData.email);

    const leadScore = calculateLeadScore(formData, submissionType);
    console.log(`📊 Lead score: ${leadScore.score}/100 (${leadScore.priority})`);

    const leadId = leadDb.insertLead({
      ...formData,
      submission_type: submissionType,
      lead_score: leadScore.score,
      priority: leadScore.priority,
      submission_id: submissionId
    }).lastInsertRowid;

    // 3-PART EMAIL FLOW
    const clientEmail = generateNewsletterWelcomeEmail(formData, submissionType);
    await sendEnhancedEmail({
      to: [formData.email],
      subject: getClientSubject(submissionType),
      html: clientEmail
    }).catch(e => console.error('❌ Client email failed:', e.message));

    const internalEmail = generateInternalEmail(formData, leadScore, submissionType);
    await sendEnhancedEmail({
      to: ['drew@jacobscounsel.com'],
      subject: `📧 ${getServiceName(submissionType)} — ${formData.email} (Score: ${leadScore.score})`,
      html: internalEmail
    }).catch(e => console.error('❌ Internal email failed:', e.message));

    await createClioLead(formData, leadScore, submissionType)
      .catch(e => console.error('❌ Clio integration failed:', e.message));

    await addToKitWithIntelligentTagging(formData, leadScore, submissionType)
      .then(result => {
        if (result.success) {
          console.log(`✅ Kit tagging applied: ${result.tags?.length || 0} tags`);
        }
      })
      .catch(e => console.error('❌ Kit tagging failed:', e.message));

    leadDb.logInteraction(leadId, 'newsletter_signup', { 
      score: leadScore.score,
      priority: leadScore.priority
    });

    res.json({ 
      success: true, 
      message: 'Successfully subscribed to newsletter. Check your email for confirmation.',
      submissionId
    });

  } catch (error) {
    console.error(`❌ Newsletter signup error:`, error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error. Please try again.',
      submissionId: req.body?.submissionId || `error-${Date.now()}`
    });
  }
});

// 6-9. RESOURCE GUIDE DOWNLOAD ENDPOINTS
const resourceEndpoints = [
  { path: '/resource-guide-download', type: 'resource-guide' },
  { path: '/business-guide-download', type: 'business-guide' },
  { path: '/brand-guide-download', type: 'brand-guide' },
  { path: '/estate-guide-download', type: 'estate-guide' }
];

resourceEndpoints.forEach(({ path, type }) => {
  app.post(path, async (req, res) => {
    try {
      const formData = sanitizeInput(req.body || {});
      const submissionId = formData.submissionId || `${type}-${Date.now()}`;
      const submissionType = type;
      
      console.log(`📥 New ${submissionType} download:`, formData.email);

      const leadScore = calculateLeadScore(formData, submissionType);
      console.log(`📊 Lead score: ${leadScore.score}/100 (${leadScore.priority})`);

      const leadId = leadDb.insertLead({
        ...formData,
        submission_type: submissionType,
        lead_score: leadScore.score,
        priority: leadScore.priority,
        submission_id: submissionId
      }).lastInsertRowid;

      // 3-PART EMAIL FLOW
      const clientEmail = generateResourceThankYouEmail(formData, submissionType);
      await sendEnhancedEmail({
        to: [formData.email],
        subject: getClientSubject(submissionType),
        html: clientEmail
      }).catch(e => console.error('❌ Client email failed:', e.message));

      const internalEmail = generateInternalEmail(formData, leadScore, submissionType);
      await sendEnhancedEmail({
        to: ['drew@jacobscounsel.com'],
        subject: `📚 ${getServiceName(submissionType)} Download — ${formData.email} (Score: ${leadScore.score})`,
        html: internalEmail
      }).catch(e => console.error('❌ Internal email failed:', e.message));

      await createClioLead(formData, leadScore, submissionType)
        .catch(e => console.error('❌ Clio integration failed:', e.message));

      await addToKitWithIntelligentTagging(formData, leadScore, submissionType)
        .then(result => {
          if (result.success) {
            console.log(`✅ Kit tagging applied: ${result.tags?.length || 0} tags`);
          }
        })
        .catch(e => console.error('❌ Kit tagging failed:', e.message));

      leadDb.logInteraction(leadId, 'resource_download', { 
        resource: submissionType,
        score: leadScore.score,
        priority: leadScore.priority
      });

      res.json({ 
        success: true, 
        message: `${getServiceName(submissionType)} sent to your email. Check your inbox!`,
        submissionId
      });

    } catch (error) {
      console.error(`❌ ${type} download error:`, error);
      res.status(500).json({ 
        success: false, 
        message: 'Internal server error. Please try again.',
        submissionId: req.body?.submissionId || `error-${Date.now()}`
      });
    }
  });
});

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    system: 'Jacobs Counsel Clean Backend',
    features: {
      emailFlow: '3-part (Client + Internal + Clio)',
      kitTagging: 'Intelligent 50+ tags',
      clioIntegration: 'Active',
      leadScoring: '0-100 scale'
    }
  });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Jacobs Counsel Clean System running on port ${PORT}`);
  console.log(`📧 3-Part Email Flow: Active`);
  console.log(`🏷️ Kit Intelligent Tagging: Active`);
  console.log(`🎮 Gaming Legal Endpoint: ACTIVE`); 
  console.log(`📊 Clio Grow Integration: Active`);
  console.log(`✅ All endpoints cleaned and operational`);
});