// index.js - Simplified with Calendly integration, no database
import express from 'express';
import cors from 'cors';
import multer from 'multer';
import fetch from 'node-fetch';
import { Buffer } from 'buffer';
import rateLimit from 'express-rate-limit';
import validator from 'validator';
import NodeCache from 'node-cache';
import Mixpanel from 'mixpanel';
const mixpanel = process.env.MIXPANEL_TOKEN ? Mixpanel.init(process.env.MIXPANEL_TOKEN) : null;
const cache = new NodeCache({ stdTTL: 600 });
// ==================== CONFIGURATION ====================
const PORT = process.env.PORT || 3000;
// AI Configuration
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || '';
const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini';
// Microsoft Graph
const MS_TENANT_ID = process.env.MS_TENANT_ID || '';
const MS_CLIENT_ID = process.env.MS_CLIENT_ID || '';
const MS_CLIENT_SECRET = process.env.MS_CLIENT_SECRET || '';
const MS_GRAPH_SENDER = process.env.MS_GRAPH_SENDER || '';
// Mailchimp
const MAILCHIMP_API_KEY = process.env.MAILCHIMP_API_KEY || '';
const MAILCHIMP_SERVER = process.env.MAILCHIMP_SERVER || 'us21';
const MAILCHIMP_AUDIENCE_ID = process.env.MAILCHIMP_AUDIENCE_ID || '';
// Calendly - YOUR ACTUAL LINKS
const CALENDLY_LINKS = {
  'estate-planning': 'https://calendly.com/jacobscounsel/wealth-protection-consultation',
  'business-formation': 'https://calendly.com/jacobscounsel/business-protection-consultation',
  'brand-protection': 'https://calendly.com/jacobscounsel/brand-protection-consultation',
  'outside-counsel': 'https://calendly.com/jacobscounsel/outside-counsel-consultation',
  'priority': 'https://calendly.com/jacobscounsel/priority-consultation',
  'general': 'https://calendly.com/jacobscounsel/general-consultation'
};
// Clio Grow
const CLIO_GROW_BASE = process.env.CLIO_GROW_BASE || 'https://grow.clio.com';
const CLIO_GROW_INBOX_TOKEN = process.env.CLIO_GROW_INBOX_TOKEN || '';
// Internal notifications
const INTAKE_NOTIFY_TO = process.env.INTAKE_NOTIFY_TO || 'intake@jacobscounsellaw.com';
const HIGH_VALUE_NOTIFY_TO = process.env.HIGH_VALUE_NOTIFY_TO || 'drew@jacobscounsellaw.com';
// Resource Guide
const RESOURCE_GUIDE_URL = process.env.RESOURCE_GUIDE_URL || 'https://jacobscounsellaw.com/downloads/legal-guide.pdf';
// ==================== ENVIRONMENT VALIDATION ====================
function validateEnvironment() {
  const requiredEmail = MS_CLIENT_ID && MS_CLIENT_SECRET && MS_TENANT_ID && MS_GRAPH_SENDER;
  const requiredMailchimp = MAILCHIMP_API_KEY && MAILCHIMP_AUDIENCE_ID;
  console.log('🔍 Environment Check:');
  console.log(` Email Service: ${requiredEmail ? '✅ Configured' : '⚠️ Not configured (emails disabled)'}`);
  console.log(` Mailchimp: ${requiredMailchimp ? '✅ Configured' : '⚠️ Not configured (nurture disabled)'}`);
  // Don’t throw; just operate in degraded mode.
  if (!requiredEmail) {
    console.warn('Email not configured. Client/internal emails will be skipped.');
  }
}
// ==================== EXPRESS SETUP ====================
const app = express();
app.set('trust proxy', 1);
app.use(cors());
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true }));
// Rate limiting
const standardLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', standardLimiter);
app.use('/estate-intake', standardLimiter);
app.use('/business-formation-intake', standardLimiter);
app.use('/brand-protection-intake', standardLimiter);
app.use('/outside-counsel', standardLimiter);
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 15 * 1024 * 1024, files: 15 }
});
// ==================== ANALYTICS ENDPOINT (used by Squarespace pages) ====================
app.post('/api/analytics/form-event', async (req, res) => {
  try {
    const payload = sanitizeInput(req.body || {});
    // Minimal validation
    const event = (payload.event || 'form_event').slice(0, 64);
    const formType = (payload.formType || 'unknown').slice(0, 64);
    const data = payload.data || {};
    // Send to Mixpanel if configured
    if (mixpanel) {
      mixpanel.track(event, {
        distinct_id: data.email || data.userId || 'anon',
        formType,
        ...data
      });
    }
    // You can also log or fan-out to Mailchimp or Clio later if helpful.
    res.json({ ok: true });
  } catch (e) {
    console.error('Analytics error:', e);
    // Don’t break the website over analytics.
    res.json({ ok: true, note: 'analytics soft-failed' });
  }
});
// ==================== HELPER FUNCTIONS ====================
function escapeHtml(unsafe) {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
function sanitizeInput(data) {
  if (!data || typeof data !== 'object') return {};
  const sanitized = {};
  for (const [key, value] of Object.entries(data)) {
    if (value === null || value === undefined) {
      sanitized[key] = '';
      continue;
    }
    if (typeof value === 'string') {
      let cleanValue = value.trim();
      cleanValue = escapeHtml(cleanValue);
      if (key === 'email' && cleanValue) {
        sanitized[key] = validator.isEmail(cleanValue) ? validator.normalizeEmail(cleanValue) : '';
      } else if (key === 'phone' && cleanValue) {
        sanitized[key] = cleanValue.replace(/[^\d\s\-\(\)\+]/g, '');
      } else {
        sanitized[key] = cleanValue.substring(0, 1000);
      }
    } else if (typeof value === 'object') {
      sanitized[key] = sanitizeInput(value);
    } else {
      sanitized[key] = value;
    }
  }
  return sanitized;
}
// Get appropriate Calendly link based on type and score
function getCalendlyLink(submissionType, leadScore) {
  // High value leads get priority booking
  if (leadScore.score >= 70) {
    return CALENDLY_LINKS['priority'];
  }
  // Map intake types to appropriate Calendly links
  const typeMap = {
    'estate-intake': 'estate-planning',
    'business-formation': 'business-formation',
    'brand-protection': 'brand-protection',
    'outside-counsel': 'outside-counsel',
    'legal-strategy-builder': 'general',
    'newsletter': 'general',
    'resource-guide': 'general'
  };
  return CALENDLY_LINKS[typeMap[submissionType]] || CALENDLY_LINKS['general'];
}
// ==================== LEAD SCORING ====================
function calculateLeadScore(formData, submissionType) {
  let score = 0;
  let scoreFactors = [];
  const baseScores = {
    'estate-intake': 40,
    'business-formation': 50,
    'brand-protection': 35,
    'outside-counsel': 45,
    'legal-guide-download': 30,
    'resource-guide': 30,
    'newsletter': 25
  };
  if (submissionType === 'legal-strategy-builder') {
    score = parseInt(formData.assessmentScore) || 0;
    scoreFactors.push(`Frontend Assessment Score: +${score}`);
    if (formData.fromAssessment === 'true' || formData.source === 'legal-strategy-builder-conversion') {
      score += 20;
      scoreFactors.push('Strategy Builder conversion: +20');
    }
  } else {
    score += baseScores[submissionType] || 30;
    scoreFactors.push(`Base ${submissionType}: +${baseScores[submissionType] || 30}`);
  }
  // Estate Planning Scoring
  if (submissionType === 'estate-intake') {
    const grossEstate = parseFloat(formData.grossEstate?.replace(/[,$]/g, '') || '0');
    if (grossEstate > 5000000) { score += 50; scoreFactors.push('High net worth (>$5M): +50'); }
    else if (grossEstate > 2000000) { score += 35; scoreFactors.push('Significant assets (>$2M): +35'); }
    else if (grossEstate > 1000000) { score += 25; scoreFactors.push('Substantial assets (>$1M): +25'); }
    if (formData.packagePreference?.toLowerCase().includes('trust')) {
      score += 30; scoreFactors.push('Trust preference: +30');
    }
    if (formData.ownBusiness === 'Yes') { score += 20; scoreFactors.push('Business owner: +20'); }
    if (formData.otherRealEstate === 'Yes') { score += 15; scoreFactors.push('Multiple properties: +15'); }
    if (formData.planningGoal === 'complex') { score += 25; scoreFactors.push('Complex situation: +25'); }
  }
  // Business Formation Scoring
  if (submissionType === 'business-formation') {
    if (formData.investmentPlan === 'vc') { score += 60; scoreFactors.push('VC-backed startup: +60'); }
    else if (formData.investmentPlan === 'angel') { score += 40; scoreFactors.push('Angel funding: +40'); }
    const revenue = formData.projectedRevenue || '';
    if (revenue.includes('over25m')) { score += 50; scoreFactors.push('High revenue projection: +50'); }
    else if (revenue.includes('5m-25m')) { score += 35; scoreFactors.push('Significant revenue: +35'); }
    if (formData.businessGoal === 'startup') { score += 20; scoreFactors.push('High-growth startup: +20'); }
    if (formData.selectedPackage === 'gold') { score += 25; scoreFactors.push('Premium package: +25'); }
  }
  // Brand Protection Scoring
  if (submissionType === 'brand-protection') {
    if (formData.servicePreference?.includes('Portfolio') || formData.servicePreference?.includes('7500')) {
      score += 40; scoreFactors.push('Comprehensive portfolio: +40');
    }
    if (formData.businessStage === 'Mature (5+ years)') { score += 20; scoreFactors.push('Established business: +20'); }
    if (formData.protectionGoal === 'enforcement') { score += 35; scoreFactors.push('Enforcement need: +35'); }
  }
  // Outside Counsel Scoring
  if (submissionType === 'outside-counsel') {
    if (formData.budget?.includes('10K+')) { score += 40; scoreFactors.push('High budget (>$10K): +40'); }
    else if (formData.budget?.includes('5K-10K')) { score += 25; scoreFactors.push('Substantial budget: +25'); }
    if (formData.timeline === 'Immediately') { score += 30; scoreFactors.push('Immediate need: +30'); }
  }
  // Universal scoring factors
  if (formData.urgency?.includes('Immediate') || formData.urgency?.includes('urgent')) {
    score += 40; scoreFactors.push('Urgent timeline: +40');
  }
  const email = formData.email || '';
  if (email && !email.includes('@gmail.com') && !email.includes('@yahoo.com') && !email.includes('@hotmail.com')) {
    score += 10; scoreFactors.push('Business email: +10');
  }
  return { score: Math.min(score, 100), factors: scoreFactors };
}

// ==================== EMAIL GENERATION ====================
function generateClientConfirmationEmail(formData, price, submissionType, leadScore) {
  const clientName = formData.firstName || formData.fullName?.split(' ')[0] || formData.contactName?.split(' ')[0] || 'there';
  const calendlyLink = CALENDLY_LINKS[submissionType] || CALENDLY_LINKS.general;
  
  let serviceTitle = 'Consultation Request Received';
  let serviceMessage = 'Thank you for your interest in our legal services. We\'ve received your request and will be in touch soon.';
  let nextSteps = 'We will review your request and contact you within 24 hours to discuss next steps.';
  
  // Customize based on service type
  switch (submissionType) {
    case 'estate-intake':
      serviceTitle = 'Estate Planning Consultation Request';
      serviceMessage = 'Thank you for your interest in estate planning services. Your submission has been received and we will be in touch soon.';
      break;
    case 'business-formation':
      serviceTitle = 'Business Formation Consultation';
      serviceMessage = 'Thank you for your business formation inquiry. We will review your needs and contact you shortly.';
      break;
    case 'brand-protection':
      serviceTitle = 'Brand Protection Consultation';
      serviceMessage = 'Thank you for your brand protection inquiry. We will assess your needs and be in touch soon.';
      break;
    case 'outside-counsel':
      serviceTitle = 'Outside Counsel Inquiry';
      serviceMessage = 'Thank you for your outside counsel inquiry. We will review your requirements and contact you shortly.';
      break;
  }
  
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${serviceTitle} - Jacobs Counsel</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #f8fafc; color: #374151;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); margin-top: 20px; margin-bottom: 20px;">
    
    <div style="background: linear-gradient(135deg, #1f2937, #374151); padding: 40px 30px; text-align: center;">
      <h1 style="color: #ffffff; font-size: 24px; font-weight: 700; margin: 0; line-height: 1.3;">${serviceTitle}</h1>
      <p style="color: #e5e7eb; margin: 8px 0 0; font-size: 16px;">Confirmation & Next Steps</p>
    </div>
    
    <div style="padding: 40px 30px;">
      <p style="font-size: 18px; margin: 0 0 20px; font-weight: 600;">Hello ${clientName},</p>
      
      <p style="font-size: 16px; line-height: 1.6; margin: 0 0 24px; color: #4b5563;">${serviceMessage}</p>
      
      <div style="text-align: center; margin: 32px 0;">
        <a href="${calendlyLink}" 
           style="display: inline-block; background-color: #ff4d00; color: #ffffff; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
          Schedule Your Consultation
        </a>
        <p style="color: #6b7280; font-size: 14px; margin: 12px 0 0;">We typically respond within 24 hours.</p>
      </div>
      
      <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
        <p style="font-size: 14px; color: #6b7280; margin: 0;">
          Best regards,<br>
          <strong>Drew Jacobs</strong><br>
          Jacobs Counsel LLC
        </p>
      </div>
    </div>
  </div>
</body>
</html>`;
}

// ==================== AI ANALYSIS (Optional - can remove if not using) ====================
async function analyzeIntakeWithAI(formData, submissionType, leadScore) {
  if (!OPENAI_API_KEY) return { analysis: null, recommendations: null, riskFlags: [] };
  const cacheKey = `ai_analysis_${submissionType}_${leadScore.score}_${JSON.stringify(formData).substring(0, 50)}`;
  const cached = cache.get(cacheKey);
  if (cached) return cached;
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: OPENAI_MODEL,
        temperature: 0.3,
        max_tokens: 500,
        messages: [
          { role: 'system', content: 'Analyze this legal intake briefly. Provide: ANALYSIS: [2-3 sentences] RECOMMENDATIONS: [Brief suggestions] RISK_FLAGS: [Any concerns]' },
          { role: 'user', content: `${submissionType}: ${JSON.stringify(formData)}` }
        ]
      })
    });
  
    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';
  
    const sections = {
      analysis: content.match(/ANALYSIS: (.+?)(?=RECOMMENDATIONS:|$)/s)?.[1]?.trim(),
      recommendations: content.match(/RECOMMENDATIONS: (.+?)(?=RISK_FLAGS:|$)/s)?.[1]?.trim(),
      riskFlags: content.match(/RISK_FLAGS: (.+?)$/s)?.[1]?.trim()
    };
  
    cache.set(cacheKey, sections);
    return sections;
  } catch (error) {
    console.error('AI analysis failed:', error);
    return { analysis: null, recommendations: null, riskFlags: [] };
  }
}
// ==================== MAILCHIMP FUNCTIONS ====================
function generateSmartTags(formData, leadScore, submissionType) {
  const tags = [
    `intake-${submissionType}`,
    `date-${new Date().toISOString().split('T')[0]}`
  ];
  if (leadScore.score >= 70) {
    tags.push('high-priority');
    tags.push('trigger-vip-sequence');
  } else if (leadScore.score >= 50) {
    tags.push('medium-priority');
    tags.push('trigger-premium-nurture');
  } else {
    tags.push('standard-priority');
    tags.push('trigger-standard-nurture');
  }
  // Service-specific tags
  if (submissionType === 'estate-intake') {
    const estate = parseFloat(formData.grossEstate || '0');
    if (estate > 5000000) tags.push('sequence-estate-tax');
    else if (estate > 2000000) tags.push('sequence-wealth-protection');
    else if (estate > 1000000) tags.push('sequence-asset-protection');
    else tags.push('sequence-basic-planning');
    if (formData.packagePreference?.includes('trust')) tags.push('sequence-trust-planning');
    if (formData.ownBusiness === 'Yes') tags.push('sequence-business-succession');
  }
  if (submissionType === 'business-formation') {
    if (formData.investmentPlan?.includes('vc')) tags.push('sequence-vc-startup');
    if (formData.investmentPlan?.includes('angel')) tags.push('sequence-angel-funding');
  }
  if (submissionType === 'brand-protection') {
    if (formData.protectionGoal?.includes('enforcement')) tags.push('sequence-ip-enforcement');
    if (formData.protectionGoal?.includes('registration')) tags.push('sequence-trademark-registration');
  }
  if (submissionType === 'newsletter') {
    tags.push('newsletter-signup');
    tags.push('trigger-newsletter-sequence');
  }
  if (submissionType === 'resource-guide') {
    tags.push('resource-guide-download');
    tags.push('trigger-guide-sequence');
  }
  return tags;
}
function buildSmartFields(formData, leadScore, submissionType) {
  const calendlyLink = getCalendlyLink(submissionType, leadScore);
  
  const fields = {
    FNAME: formData.firstName || formData.fullName?.split(' ')[0] || formData.contactName?.split(' ')[0] || '',
    LNAME: formData.lastName || formData.fullName?.split(' ').slice(1).join(' ') || '',
    EMAIL: formData.email,
    PHONE: formData.phone || '',
    BUSINESS: formData.businessName || formData.companyName || '',
    LEAD_SCORE: leadScore.score,
    PRIORITY: leadScore.score >= 70 ? 'High Priority' : leadScore.score >= 50 ? 'Medium Priority' : 'Standard',
    SERVICE: submissionType.replace('-', ' '),
    SIGNUP: new Date().toISOString().split('T')[0],
    SOURCE: 'Website Intake Form',
    CALENDLY: calendlyLink,
    URGENCY: formData.urgency || '',
    TIMELINE: formData.timeline || '',
    BUDGET: formData.budget || ''
  };

  // Estate planning fields
  if (submissionType === 'estate-intake') {
    const estate = parseFloat(formData.grossEstate?.replace(/[,$]/g, '') || '0');
    fields.ESTATE = estate > 0 ? '$' + estate.toLocaleString() : 'Not specified';
    fields.HASBIZ = formData.ownBusiness === 'Yes' ? 'Yes' : 'No';
    fields.HAS_KIDS = formData.hasMinorChildren || 'Not specified';
    fields.MARITAL = formData.maritalStatus || '';
    fields.REALESTATE = formData.otherRealEstate || '';
    fields.GOAL = formData.planningGoal || '';
  }

  // Business formation fields
  if (submissionType === 'business-formation') {
    fields.STARTUP = formData.investmentPlan || 'Not specified';
    fields.BIZTYPE = formData.businessType || 'Not specified';
    fields.REVENUE = formData.projectedRevenue || '';
    fields.BIZ_GOAL = formData.businessGoal || '';
  }

  // Brand protection fields
  if (submissionType === 'brand-protection') {
    fields.BIZ_STAGE = formData.businessStage || '';
    fields.PROTECT = formData.protectionGoal || '';
  }

  // Legal strategy builder fields
  if (submissionType === 'legal-strategy-builder') {
    fields.ROLE = formData.q1 || '';
    fields.STAGE = formData.q2 || '';
    fields.STRUCTURE = formData.q3 || '';
    fields.IP_STATUS = formData.q4 || '';
    fields.CONTRACTS = formData.q5 || '';
    fields.ASSETS = formData.q6 || '';
    fields.RISKS = Array.isArray(formData.q7) ? formData.q7.join(', ') : (formData.q7 || '');
    fields.GOAL_12M = formData.q8 || '';
    fields.SCORE = formData.assessmentScore || leadScore.score;
  }

  return fields;
}
async function addToMailchimpWithAutomation(formData, leadScore, submissionType) {
  if (!MAILCHIMP_API_KEY || !MAILCHIMP_AUDIENCE_ID) {
    console.log('Mailchimp not configured, skipping');
    return { skipped: true };
  }
  const tags = generateSmartTags(formData, leadScore, submissionType);
  const mergeFields = buildSmartFields(formData, leadScore, submissionType);
  const memberData = {
    email_address: formData.email,
    status: 'subscribed',
    merge_fields: mergeFields,
    tags: tags,
    timestamp_signup: new Date().toISOString()
  };
  try {
    const response = await fetch(
      `https://${MAILCHIMP_SERVER}.api.mailchimp.com/3.0/lists/${MAILCHIMP_AUDIENCE_ID}/members`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${MAILCHIMP_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(memberData)
      }
    );
  
    if (response.status === 400) {
      const crypto = await import('crypto');
      const hashedEmail = crypto.createHash('md5').update(formData.email.toLowerCase()).digest('hex');
    
      const updateResponse = await fetch(
        `https://${MAILCHIMP_SERVER}.api.mailchimp.com/3.0/lists/${MAILCHIMP_AUDIENCE_ID}/members/${hashedEmail}`,
        {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${MAILCHIMP_API_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            merge_fields: mergeFields,
            tags: tags
          })
        }
      );
      return await updateResponse.json();
    }
  
    return await response.json();
  } catch (error) {
    console.error('Mailchimp error:', error);
    return { error: error.message };
  }
}
// ==================== MICROSOFT GRAPH ====================
async function getGraphToken() {
  if (!MS_TENANT_ID || !MS_CLIENT_ID || !MS_CLIENT_SECRET) {
    throw new Error('MS Graph credentials missing');
  }
  const body = new URLSearchParams({
    client_id: MS_CLIENT_ID,
    client_secret: MS_CLIENT_SECRET,
    scope: 'https://graph.microsoft.com/.default',
    grant_type: 'client_credentials'
  });
  const response = await fetch(
    `https://login.microsoftonline.com/${MS_TENANT_ID}/oauth2/v2.0/token`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body
    }
  );
  if (!response.ok) throw new Error(`Token error ${response.status}`);
  const json = await response.json();
  return json.access_token;
}
async function sendEnhancedEmail({ to, subject, html, priority = 'normal', attachments = [] }) {
  if (!MS_GRAPH_SENDER) throw new Error('MS_GRAPH_SENDER not configured');
  const token = await getGraphToken();
  const mail = {
    message: {
      subject,
      body: { contentType: 'HTML', content: html },
      toRecipients: to.map(address => ({ emailAddress: { address } })),
      importance: priority === 'high' ? 'high' : 'normal',
      attachments: attachments.slice(0, 10).map(att => ({
        '@odata.type': '#microsoft.graph.fileAttachment',
        name: att.filename || 'attachment',
        contentType: att.contentType || 'application/octet-stream',
        contentBytes: Buffer.isBuffer(att.content)
          ? att.content.toString('base64')
          : Buffer.from(att.content).toString('base64')
      }))
    },
    saveToSentItems: true
  };
  const response = await fetch(
    `https://graph.microsoft.com/v1.0/users/${encodeURIComponent(MS_GRAPH_SENDER)}/sendMail`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(mail)
    }
  );
  if (!response.ok) {
    const errorText = await response.text().catch(() => '');
    throw new Error(`sendMail failed ${response.status} ${errorText}`);
  }
}
// ==================== CLIO GROW INTEGRATION ====================
async function createClioLead(formData, submissionType, leadScore) {
  if (!CLIO_GROW_INBOX_TOKEN) {
    console.log('Clio Grow not configured, skipping');
    return { skipped: true };
  }
  let firstName = 'Not Provided';
  let lastName = 'Not Provided';
  const nameSources = [
    { first: formData.firstName, last: formData.lastName },
    { full: formData.fullName },
    { full: formData.contactName },
    { full: formData.founderName },
    { first: formData.email?.split('@')[0], last: 'Client' }
  ];
  for (const source of nameSources) {
    if (source.first && source.last) {
      firstName = source.first;
      lastName = source.last;
      break;
    } else if (source.full) {
      const parts = source.full.trim().split(' ');
      if (parts.length > 0) {
        firstName = parts[0];
        lastName = parts.slice(1).join(' ') || 'Client';
        break;
      }
    }
  }
  let message = `${submissionType.replace('-', ' ').toUpperCase()} Lead (Score: ${leadScore.score}/100)\n\n`;
  message += `Calendly Link: ${getCalendlyLink(submissionType, leadScore)}\n\n`;
  message += `Details:\n${JSON.stringify(formData, null, 2)}`;
  const clioPayload = {
    inbox_lead: {
      from_first: firstName,
      from_last: lastName,
      from_email: formData.email || '',
      from_phone: formData.phone || '',
      from_message: message,
      referring_url: `https://jacobscounsellaw.com/${submissionType}`,
      from_source: `Website ${submissionType}`
    },
    inbox_lead_token: CLIO_GROW_INBOX_TOKEN
  };
  try {
    const response = await fetch(`${CLIO_GROW_BASE}/inbox_leads`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(clioPayload)
    });
  
    if (response.ok) {
      console.log('✅ Pushed to Clio Grow');
      return await response.json();
    } else {
      console.error('❌ Clio Grow failed:', response.status);
      return { error: `Clio error ${response.status}` };
    }
  } catch (error) {
    console.error('❌ Clio Grow failed:', error.message);
    return { error: error.message };
  }
}
// ==================== EMAIL TEMPLATES ====================
function generateInternalAlert(formData, leadScore, submissionType, aiAnalysis, submissionId) {
  const isHighValue = leadScore.score >= 70;
  const calendlyLink = getCalendlyLink(submissionType, leadScore);
  // Extract key business context based on submission type
let businessContext = '';
let legalNeeds = '';
let talkingPoints = '';
let risks = 'Not specified';
let risksArray = [];
  if (submissionType === 'legal-strategy-builder') {
    const role = formData.q1 || 'unknown';
    const stage = formData.q2 || 'unknown';
    const structure = formData.q3 || 'unknown';
    const ip = formData.q4 || 'unknown';
    risksArray = Array.isArray(formData.q7) ? formData.q7 : [];
    risks = risksArray.length > 0 ? risksArray.join(', ') : 'none specified';
    const goal = formData.q8 || 'unknown';
  
    businessContext = `${role.charAt(0).toUpperCase() + role.slice(1)} in ${stage} stage`;
  
    // Determine primary legal needs
    const needsArray = [];
    if (structure === 'none' || structure === 'unsure') needsArray.push('Entity formation');
    if (ip === 'none' || ip === 'basic') needsArray.push('IP protection');
    if (risksArray.includes('liability')) needsArray.push('Asset protection');
    if (risksArray.includes('estate')) needsArray.push('Estate planning');
    if (goal === 'fundraise') needsArray.push('Investment readiness');
  
    legalNeeds = needsArray.length > 0 ? needsArray.join(' + ') : 'General strategy';
  
    talkingPoints = `
      <li><strong>Current Gap:</strong> ${structure === 'none' ? 'No business entity' : structure === 'unsure' ? 'Unclear entity structure' : 'Has ' + structure}</li>
      <li><strong>IP Status:</strong> ${ip === 'none' ? 'No protection' : ip}</li>
      <li><strong>Main Concerns:</strong> ${risks || 'Not specified'}</li>
      <li><strong>12-Month Goal:</strong> ${goal}</li>
      <li><strong>Assessment Score:</strong> ${formData.assessmentScore || leadScore.score}/100 (${(formData.assessmentScore || leadScore.score) >= 70 ? 'Strong foundation' : (formData.assessmentScore || leadScore.score) >= 50 ? 'Developing foundation' : 'Early stage'})</li>
    `;
  } else if (submissionType === 'estate-intake') {
    const estate = parseFloat(formData.grossEstate?.replace(/[,$]/g, '') || '0');
    const pkg = formData.packagePreference || 'not specified';
    const business = formData.ownBusiness === 'Yes';
  
    businessContext = `Estate: $${estate > 0 ? estate.toLocaleString() : 'not specified'}${business ? ' + Business owner' : ''}`;
    legalNeeds = pkg.includes('trust') ? 'Trust-based planning' : pkg.includes('will') ? 'Will-based planning' : 'Planning type TBD';
  
    talkingPoints = `
      <li><strong>Estate Size:</strong> $${estate > 0 ? estate.toLocaleString() : 'Not provided'}</li>
      <li><strong>Package Interest:</strong> ${pkg}</li>
      <li><strong>Business Owner:</strong> ${business ? 'Yes' : 'No'}</li>
      <li><strong>Minor Children:</strong> ${formData.hasMinorChildren || 'Not specified'}</li>
      <li><strong>Tax Concerns:</strong> ${estate > 12920000 ? 'Federal estate tax exposure' : 'Below federal threshold'}</li>
    `;
  } else if (submissionType === 'business-formation') {
    const revenue = formData.projectedRevenue || 'not specified';
    const investment = formData.investmentPlan || 'self-funded';
    const packageType = formData.selectedPackage || 'not specified';
  
    businessContext = `${investment} startup, ${revenue} revenue projection`;
    legalNeeds = investment === 'vc' ? 'VC-ready formation' : investment === 'angel' ? 'Investment-ready formation' : 'Standard formation';
  
    talkingPoints = `
      <li><strong>Investment Plan:</strong> ${investment}</li>
      <li><strong>Revenue Target:</strong> ${revenue}</li>
      <li><strong>Package Interest:</strong> ${packageType}</li>
      <li><strong>Business Type:</strong> ${formData.businessType || 'Not specified'}</li>
      <li><strong>Timeline:</strong> ${formData.timeline || 'Not specified'}</li>
    `;
  }
  return `
<!DOCTYPE html>
<html>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; padding: 20px; background: #f8fafc;">
    <div style="max-width: 800px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);">
      
        ${isHighValue ? `
        <div style="background: linear-gradient(135deg, #dc2626, #ef4444); color: white; padding: 24px; text-align: center;">
            <h1 style="margin: 0; font-size: 24px; font-weight: 800;">HIGH VALUE LEAD - Score: ${leadScore.score}/100</h1>
            <p style="margin: 8px 0 0; opacity: 0.9;">Priority consultation recommended</p>
        </div>
        ` : `
        <div style="background: linear-gradient(135deg, #0f172a, #374151); color: white; padding: 24px; text-align: center;">
            <h1 style="margin: 0; font-size: 24px; font-weight: 800;">New ${submissionType.replace('-', ' ').toUpperCase()} Lead</h1>
            <p style="margin: 8px 0 0; opacity: 0.9;">Score: ${leadScore.score}/100</p>
        </div>
        `}
      
        <div style="padding: 32px;">
          
            <!-- Quick Context -->
            <div style="background: #f1f5f9; padding: 20px; border-radius: 8px; margin-bottom: 24px;">
                <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 16px;">
                    <div>
                        <h2 style="margin: 0 0 8px; color: #0f172a; font-size: 20px;">${formData.firstName || formData.fullName || formData.email?.split('@')[0] || 'Name not provided'}</h2>
                        <p style="margin: 0; color: #64748b; font-size: 16px;">${businessContext}</p>
                    </div>
                    <div style="text-align: right;">
                        <div style="background: ${isHighValue ? '#dc2626' : '#059669'}; color: white; padding: 4px 12px; border-radius: 20px; font-size: 14px; font-weight: 600;">
                            ${isHighValue ? 'HIGH PRIORITY' : 'STANDARD'}
                        </div>
                    </div>
                </div>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
                    <div>
                        <p style="margin: 0; color: #374151;"><strong>Email:</strong> <a href="mailto:${formData.email}" style="color: #2563eb;">${formData.email}</a></p>
                        <p style="margin: 4px 0 0; color: #374151;"><strong>Phone:</strong> ${formData.phone || 'Not provided'}</p>
                    </div>
                    <div>
                        <p style="margin: 0; color: #374151;"><strong>Primary Need:</strong> ${legalNeeds}</p>
                        <p style="margin: 4px 0 0; color: #374151;"><strong>Submitted:</strong> ${new Date().toLocaleString()}</p>
                    </div>
                </div>
            </div>
            <!-- Consultation Prep -->
            <div style="background: #fffbeb; border-left: 4px solid #f59e0b; padding: 20px; margin-bottom: 24px;">
                <h3 style="margin: 0 0 12px; color: #92400e; font-size: 18px;">Consultation Talking Points:</h3>
                <ul style="margin: 0; padding-left: 20px; color: #78350f;">
                    ${talkingPoints}
                </ul>
            </div>
             <!-- Detailed Quiz Responses -->
<div style="background: #f8fafc; padding: 20px; margin-bottom: 24px; border-radius: 8px;">
    <h3 style="margin: 0 0 16px; color: #374151; font-size: 18px;">Assessment Responses:</h3>
    <div style="font-size: 14px; color: #374151;">
        <p><strong>Q1 - Role:</strong> ${formData.q1 || 'Not answered'}</p>
        <p><strong>Q2 - Stage:</strong> ${formData.q2 || 'Not answered'}</p>
        <p><strong>Q3 - Structure:</strong> ${formData.q3 || 'Not answered'}</p>
        <p><strong>Q4 - IP Protection:</strong> ${formData.q4 || 'Not answered'}</p>
        <p><strong>Q5 - Contracts:</strong> ${formData.q5 || 'Not answered'}</p>
        <p><strong>Q6 - Revenue/Assets:</strong> ${formData.q6 || 'Not answered'}</p>
        <p><strong>Q7 - Risk Concerns:</strong> ${risks}</p>
        <p><strong>Q8 - 12-Month Goal:</strong> ${formData.q8 || 'Not answered'}</p>
    </div>
</div>
            <!-- Immediate Actions -->
            <div style="background: #ecfdf5; border-left: 4px solid #10b981; padding: 20px; margin-bottom: 24px;">
                <h3 style="margin: 0 0 16px; color: #065f46; font-size: 18px;">Next Steps:</h3>
                <div style="display: flex; gap: 12px; flex-wrap: wrap;">
                    <a href="mailto:${formData.email}?subject=Your Legal Consultation - Next Steps&body=Hi ${formData.firstName || 'there'},%0D%0A%0D%0AI've reviewed your submission and have some specific recommendations for your situation. Are you available for a quick consultation this week?"
                       style="background: #2563eb; color: white; padding: 12px 20px; text-decoration: none; border-radius: 6px; font-weight: 600;">
                        Send Personal Email
                    </a>
                    <a href="${calendlyLink}"
                       style="background: #059669; color: white; padding: 12px 20px; text-decoration: none; border-radius: 6px; font-weight: 600;">
                        ${isHighValue ? 'Priority Calendar Link' : 'Standard Calendar Link'}
                    </a>
                </div>
                <p style="margin: 16px 0 0; color: #065f46; font-size: 14px;">
                    <strong>Recommended follow-up:</strong> ${isHighValue ? 'Personal email within 2 hours, then calendar link' : 'Send calendar link within 24 hours'}
                </p>
            </div>
            <!-- Lead Score Breakdown -->
            <details style="margin-bottom: 24px;">
                <summary style="cursor: pointer; font-weight: 600; color: #374151; padding: 8px 0;">Lead Score Breakdown (${leadScore.score}/100)</summary>
                <div style="background: #f8fafc; padding: 16px; border-radius: 6px; margin-top: 8px;">
                    ${leadScore.factors.map(factor => `<p style="margin: 4px 0; color: #64748b; font-size: 14px;">• ${factor}</p>`).join('')}
                </div>
            </details>
            <!-- Full Submission Data -->
            <details>
                <summary style="cursor: pointer; font-weight: 600; color: #374151; padding: 8px 0;">Complete Submission Data</summary>
                <pre style="background: #f1f5f9; padding: 16px; border-radius: 6px; overflow-x: auto; font-size: 12px; color: #374151; margin-top: 8px;">${JSON.stringify(formData, null, 2)}</pre>
            </details>
        </div>
      
        <div style="background: #f8fafc; padding: 16px; border-top: 1px solid #e2e8f0; text-align: center; color: #64748b; font-size: 14px;">
            Submission ID: ${submissionId} | ${new Date().toLocaleString()}
        </div>
    </div>
</body>
</html>`;
}
function generateNewsletterWelcomeEmail(formData) {
  const clientName = formData.firstName || formData.fullName?.split(' ')[0] || 'there';
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your Legal Playbook Starts Here</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #f4f4f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
    
    <!-- Header -->
    <tr>
      <td style="background-color: #ff4d00; padding: 40px 30px; text-align: center;">
        <h1 style="color: #ffffff; font-size: 28px; margin: 0; font-weight: 800;">Your Legal Playbook Starts Here</h1>
      </td>
    </tr>
    
    <!-- Body -->
    <tr>
      <td style="padding: 40px 30px; color: #333333;">
        <p style="font-size: 18px; margin: 0 0 20px;">Hi ${clientName},</p>
        
        <p style="margin: 0 0 20px;">Welcome to Jacobs Counsel's inner circle.</p>

        <p style="margin: 0 0 20px;">You've just joined high-performers who view legal as offense as they grow on the way to success.</p>

        <p style="margin: 0 0 20px; font-weight: 600;">Here's what you get:</p>

        <ul style="margin: 0 0 20px; padding-left: 20px;">
          <li style="margin-bottom: 10px;">Insights on protecting IP, structuring deals, and avoiding costly legal mistakes</li>
          <li style="margin-bottom: 10px;">Real case studies from the field (anonymized, always actionable)</li>
          <li style="margin-bottom: 10px;">Early access to our legal frameworks and strategies</li>
        </ul>

        <p style="margin: 0 0 20px; font-weight: 600;">Your starter toolkit (download now):</p>

        <ul style="margin: 0 0 20px; padding-left: 20px;">
          <li style="margin-bottom: 10px;">
            <a href="https://www.jacobscounsellaw.com/s/The-VC-Ready-Business-Formation-Blueprint.pdf" style="color: #ff4d00; text-decoration: none; font-weight: 600;">Entity Selection Guide for Startups</a> - Choose the right structure from day one
          </li>
          <li style="margin-bottom: 10px;">
            <a href="https://www.jacobscounsellaw.com/s/Protect-Your-Dreams-Maximize-Your-Impact-and-Grow-Smart.pdf" style="color: #ff4d00; text-decoration: none; font-weight: 600;">Creator Contract Checklist</a> - Never miss critical terms again
          </li>
          <li style="margin-bottom: 10px;">
            <a href="https://www.jacobscounsellaw.com/s/Emergency-Brand-Protection-Playbook.pdf" style="color: #ff4d00; text-decoration: none; font-weight: 600;">Emergency Brand Protection Playbook</a> - Safeguard your brand quickly
          </li>
          <li style="margin-bottom: 10px;">
            <a href="https://www.jacobscounsellaw.com/s/Estate-Planning-for-High-Achievers.pdf" style="color: #ff4d00; text-decoration: none; font-weight: 600;">Estate Planning for High Achievers</a> - Protect your legacy
          </li>
        </ul>

        <p style="margin: 0 0 20px;">Each issue cuts through legal complexity to deliver strategies you can actually use. No fluff or legalese—just insights that protect what you're building.</p>

        <p style="margin: 0 0 20px;">Questions? Hit reply. I read everything.</p>
        
        <p style="margin: 0 0 20px;">Drew Jacobs<br>
        Founder, Jacobs Counsel<br>
        <a href="https://www.jacobscounsellaw.com" style="color: #ff4d00; text-decoration: none;">Website</a> | <a href="https://www.linkedin.com/company/jacobs-counsel" style="color: #ff4d00; text-decoration: none;">LinkedIn</a></p>

        <p style="margin: 0; font-size: 14px; color: #666666;">P.S. – Forward this to one person who needs better legal assistance. They'll thank you later.</p>
      </td>
    </tr>
    
    <!-- Footer -->
    <tr>
      <td style="background-color: #f8fafc; padding: 20px 30px; text-align: center; font-size: 12px; color: #9ca3af;">
        <p style="margin: 0 0 5px;">© 2025 Jacobs Counsel LLC. All rights reserved.</p>
        <p style="margin: 0;">This email was sent to you because you subscribed to our newsletter.</p>
      </td>
    </tr>
    
  </table>
</body>
</html>`;
}
function generateResourceThankYouEmail(formData, downloadLink) {
  const clientName = formData.firstName || formData.fullName?.split(' ')[0] || 'there';
  return `
<!DOCTYPE html>
<html>
<body style="font-family: Arial, sans-serif; margin: 0; padding: 0;">
   <div style="max-width: 600px; margin: 20px auto; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
     
       <div style="background-color: #ff4d00; padding: 40px 30px; text-align: center;">
           <h1 style="color: #000000; font-size: 28px; margin: 0;">Thank You for Downloading</h1>
       </div>
    
       <div style="padding: 40px 30px;">
           <p style="font-size: 18px;">Hi ${clientName},</p>
        
           <p>Here's your instant link to the Legal Resource Guide:</p>
         
           <a href="${downloadLink}" style="background-color: #2563eb; color: #ffffff; padding: 12px 20px; text-decoration: none; border-radius: 6px; font-weight: 600;">Download Guide</a>
         
           <p>We'll follow up with more resources soon.</p>
        
           <p>Best,<br>
           <strong>Drew Jacobs</strong><br>
           <span style="color: #64748b;">Founder, Jacobs Counsel</span></p>
       </div>
   </div>
</body>
</html>`;
}
// ==================== CALENDLY WEBHOOK ====================
app.post('/webhook/calendly', async (req, res) => {
  try {
    console.log('Calendly webhook received:', JSON.stringify(req.body));
  
    const { event, payload } = req.body;
  
    if (event === 'invitee.created') {
      // Send notification with proper validation
const clientName = invitee.name || invitee.first_name || 'Unknown Client';
const clientEmail = invitee.email || 'No email provided';
const eventName = scheduled_event.name || scheduled_event.event_type?.name || 'Consultation';
const eventTime = scheduled_event.start_time 
  ? new Date(scheduled_event.start_time).toLocaleString() 
  : 'Time not specified';

await sendEnhancedEmail({
  to: [INTAKE_NOTIFY_TO],
  subject: `📅 Consultation Booked: ${clientName}`,
  html: `
    <h2>New Consultation Booked</h2>
    <p><strong>Client:</strong> ${clientName} (${clientEmail})</p>
    <p><strong>Event:</strong> ${eventName}</p>
    <p><strong>Time:</strong> ${eventTime}</p>
    <p><strong>Raw Payload:</strong> <pre>${JSON.stringify(payload, null, 2)}</pre></p>
  `
}).catch(e => console.error('Failed to send booking notification:', e));
    
      console.log(`📅 Meeting booked: ${email}`);
    
      if (mixpanel) {
        mixpanel.track('Consultation Booked', {
          distinct_id: email,
          event_name: scheduled_event.name,
          start_time: scheduled_event.start_time
        });
      }
    
      // Update Mailchimp tags to stop booking reminders
      if (MAILCHIMP_API_KEY && MAILCHIMP_AUDIENCE_ID && email) {
        try {
          const crypto = await import('crypto');
          const hashedEmail = crypto.createHash('md5').update(email.toLowerCase()).digest('hex');
        
          await fetch(
            `https://${MAILCHIMP_SERVER}.api.mailchimp.com/3.0/lists/${MAILCHIMP_AUDIENCE_ID}/members/${hashedEmail}/tags`,
            {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${MAILCHIMP_API_KEY}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                tags: [
                  { name: 'consultation-booked', status: 'active' },
                  { name: 'stop-booking-reminders', status: 'active' }
                ]
              })
            }
          );
        } catch (e) {
          console.error('Failed to update Mailchimp tags:', e);
        }
      }
    
      // Send notification
      await sendEnhancedEmail({
        to: [INTAKE_NOTIFY_TO],
        subject: `📅 Consultation Booked: ${name}`,
        html: `
          <h2>New Consultation Booked</h2>
          <p><strong>Client:</strong> ${name} (${email})</p>
          <p><strong>Event:</strong> ${scheduled_event.name}</p>
          <p><strong>Time:</strong> ${new Date(scheduled_event.start_time).toLocaleString()}</p>
        `
      }).catch(e => console.error('Failed to send booking notification:', e));
    }
  
    if (event === 'invitee.canceled') {
      const invitee = payload.invitee || {};
      const email = invitee.email;
    
      console.log(`❌ Meeting canceled: ${email}`);
    
      if (mixpanel) {
        mixpanel.track('Consultation Canceled', {
          distinct_id: email
        });
      }
    
      // Restart nurture sequence
      if (MAILCHIMP_API_KEY && MAILCHIMP_AUDIENCE_ID && email) {
        try {
          const crypto = await import('crypto');
          const hashedEmail = crypto.createHash('md5').update(email.toLowerCase()).digest('hex');
        
          await fetch(
            `https://${MAILCHIMP_SERVER}.api.mailchimp.com/3.0/lists/${MAILCHIMP_AUDIENCE_ID}/members/${hashedEmail}/tags`,
            {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${MAILCHIMP_API_KEY}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                tags: [
                  { name: 'consultation-canceled', status: 'active' },
                  { name: 'restart-nurture', status: 'active' },
                  { name: 'consultation-booked', status: 'inactive' }
                ]
              })
            }
          );
        } catch (e) {
          console.error('Failed to update Mailchimp tags:', e);
        }
      }
    }
  
    res.json({ received: true });
  } catch (error) {
    console.error('Calendly webhook error:', error);
    res.status(500).json({ error: error.message });
  }
});
// ==================== INTAKE PROCESSING ====================
async function processIntakeOperations(operations) {
  const results = await Promise.allSettled(operations);
  results.forEach((result, index) => {
    if (result.status === 'rejected') {
      console.error(`❌ Operation ${index} failed:`, result.reason);
    }
  });
  return results;
}
// ==================== COMPATIBILITY SHIM (front-end -> backend) ====================
/**
 * Your Squarespace forms send friendly names like "wealth-protection" and "business-protection".
 * The backend lead-scoring expects canonical keys like "estate-intake" and "business-formation".
 * This shim maps the front-end values to what your backend already understands.
 */
const TYPE_ALIAS = {
  // Front-end -> Canonical
  'wealth-protection': 'estate-intake',
  'estate-planning': 'estate-intake',
  'business-protection': 'business-formation',
  'brand-protection': 'brand-protection',
  'outside-counsel': 'outside-counsel',
  'strategic-partnership': 'outside-counsel',
  'newsletter': 'newsletter',
  'resource-guide': 'resource-guide',
  'legal-strategy-builder': 'legal-strategy-builder'
};
function normalizeSubmissionType(submitted, routeDefault) {
  const s = (submitted || '').toLowerCase();
  if (TYPE_ALIAS[s]) return TYPE_ALIAS[s];
  if (TYPE_ALIAS[routeDefault]) return TYPE_ALIAS[routeDefault];
  return routeDefault || 'newsletter';
}
// Normalize downstream usage everywhere so scoring, emails, Mailchimp, Calendly get the right type
function withNormalizedType(formData, routeDefault) {
  const norm = normalizeSubmissionType(formData.submissionType, routeDefault);
  return { ...formData, submissionType: norm, _normalizedType: norm };
}
// ==================== MAIN INTAKE ENDPOINTS ====================
app.post('/estate-intake', upload.array('document'), async (req, res) => {
  try {
    let formData = sanitizeInput(req.body || {});
const files = req.files || [];
const submissionId = formData.submissionId || `estate-${Date.now()}`;
formData = withNormalizedType(formData, 'estate-intake');
const submissionType = formData._normalizedType; // <- use normalized everywhere below
  
    console.log(`📥 New ${submissionType} submission:`, formData.email);
  
    const leadScore = calculateLeadScore(formData, submissionType);
    console.log(`📊 Lead score: ${leadScore.score}/100`);
  
    const aiAnalysis = await analyzeIntakeWithAI(formData, submissionType, leadScore);
  
    const attachments = files
      .filter(f => f?.buffer && f.size <= 5 * 1024 * 1024)
      .slice(0, 10)
      .map(f => ({
        filename: f.originalname,
        contentType: f.mimetype,
        content: f.buffer
      }));
  
    // Calculate pricing
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
      ? [INTAKE_NOTIFY_TO, HIGH_VALUE_NOTIFY_TO]
      : [INTAKE_NOTIFY_TO];
  
    operations.push(
      sendEnhancedEmail({
        to: alertRecipients,
        subject: `${leadScore.score >= 70 ? '🔥 HIGH VALUE' : ''} Estate Planning — ${formData.email} (Score: ${leadScore.score})`,
        html: generateInternalAlert(formData, leadScore, submissionType, aiAnalysis, submissionId),
        priority: leadScore.score >= 70 ? 'high' : 'normal',
        attachments
      }).catch(e => console.error('❌ Internal email failed:', e.message))
    );
  
    operations.push(
      addToMailchimpWithAutomation(formData, leadScore, submissionType)
        .catch(e => console.error('❌ Mailchimp failed:', e.message))
    );
  
    operations.push(
      createClioLead(formData, submissionType, leadScore)
        .catch(e => console.error('❌ Clio Grow failed:', e.message))
    );
  
    if (formData.email) {
      const clientEmailHtml = generateClientConfirmationEmail(formData, price, submissionType, leadScore);
      if (clientEmailHtml) {
        operations.push(
          sendEnhancedEmail({
            to: [formData.email],
            subject: 'Jacobs Counsel — Your Estate Planning Intake & Next Steps',
            html: clientEmailHtml
          }).catch(e => console.error('❌ Client email failed:', e.message))
        );
      }
    }
  
    await processIntakeOperations(operations);
  
    res.json({
      ok: true,
      submissionId,
      leadScore: leadScore.score,
      price,
      aiAnalysisAvailable: !!aiAnalysis?.analysis
    });
  } catch (error) {
    console.error('💥 Estate intake error:', error);
    res.status(500).json({ ok: false, error: error.message });
  }
});
app.post('/business-formation-intake', upload.array('documents'), async (req, res) => {
  try {
    let formData = sanitizeInput(req.body || {});
const files = req.files || [];
const submissionId = formData.submissionId || `business-${Date.now()}`;
formData = withNormalizedType(formData, 'business-formation');
const submissionType = formData._normalizedType;
  
    console.log(`📥 New ${submissionType} submission:`, formData.email);
  
    const leadScore = calculateLeadScore(formData, submissionType);
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
      ? [INTAKE_NOTIFY_TO, HIGH_VALUE_NOTIFY_TO]
      : [INTAKE_NOTIFY_TO];
  
    operations.push(
      sendEnhancedEmail({
        to: alertRecipients,
        subject: `${leadScore.score >= 70 ? '🔥 HIGH VALUE' : ''} Business Formation — ${formData.founderName || formData.businessName || 'New Lead'} (Score: ${leadScore.score})`,
        html: generateInternalAlert(formData, leadScore, submissionType, aiAnalysis, submissionId),
        priority: leadScore.score >= 70 ? 'high' : 'normal',
        attachments
      }).catch(e => console.error('❌ Internal email failed:', e.message))
    );
  
    operations.push(
      addToMailchimpWithAutomation(formData, leadScore, submissionType)
        .catch(e => console.error('❌ Mailchimp failed:', e.message))
    );
  
    operations.push(
      createClioLead(formData, submissionType, leadScore)
        .catch(e => console.error('❌ Clio failed:', e.message))
    );
  
    if (formData.email) {
      const clientEmailHtml = generateClientConfirmationEmail(formData, price, submissionType, leadScore);
      if (clientEmailHtml) {
        operations.push(
          sendEnhancedEmail({
            to: [formData.email],
            subject: 'Jacobs Counsel — Your Business Formation Intake & Next Steps',
            html: clientEmailHtml
          }).catch(e => console.error('❌ Client email failed:', e.message))
        );
      }
    }
  
    await processIntakeOperations(operations);
  
    res.json({
      ok: true,
      submissionId,
      leadScore: leadScore.score,
      price,
      aiAnalysisAvailable: !!aiAnalysis?.analysis
    });
  } catch (error) {
    console.error('💥 Business formation error:', error);
    res.status(500).json({ ok: false, error: error.message });
  }
});
app.post('/brand-protection-intake', upload.array('brandDocument'), async (req, res) => {
  try {
    let formData = sanitizeInput(req.body || {});
const files = req.files || [];
const submissionId = formData.submissionId || `brand-${Date.now()}`;
formData = withNormalizedType(formData, 'brand-protection');
const submissionType = formData._normalizedType;
  
    console.log(`📥 New ${submissionType} submission:`, formData.email);
  
    const leadScore = calculateLeadScore(formData, submissionType);
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
      ? [INTAKE_NOTIFY_TO, HIGH_VALUE_NOTIFY_TO]
      : [INTAKE_NOTIFY_TO];
  
    operations.push(
      sendEnhancedEmail({
        to: alertRecipients,
        subject: `${leadScore.score >= 70 ? '🔥 HIGH VALUE' : ''} Brand Protection — ${formData.businessName || formData.fullName || 'New Lead'} (Score: ${leadScore.score})`,
        html: generateInternalAlert(formData, leadScore, submissionType, aiAnalysis, submissionId),
        priority: leadScore.score >= 70 ? 'high' : 'normal',
        attachments
      }).catch(e => console.error('❌ Internal email failed:', e.message))
    );
  
    operations.push(
      addToMailchimpWithAutomation(formData, leadScore, submissionType)
        .catch(e => console.error('❌ Mailchimp failed:', e.message))
    );
  
    operations.push(
      createClioLead(formData, submissionType, leadScore)
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
app.post('/outside-counsel', async (req, res) => {
  try {
    let formData = sanitizeInput(req.body);
const submissionId = formData.submissionId || `OC-${Date.now()}`;
formData = withNormalizedType(formData, 'outside-counsel');
const submissionType = formData._normalizedType;
  
    console.log(`📥 New ${submissionType} submission:`, formData.email);
  
    const leadScore = calculateLeadScore(formData, submissionType);
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
      ? [INTAKE_NOTIFY_TO, HIGH_VALUE_NOTIFY_TO]
      : [INTAKE_NOTIFY_TO];
  
    operations.push(
      sendEnhancedEmail({
        to: alertRecipients,
        subject: `${leadScore.score >= 70 ? '🔥 HIGH VALUE' : ''} Outside Counsel — ${formData.companyName || 'New Lead'} (Score: ${leadScore.score})`,
        html: generateInternalAlert(formData, leadScore, submissionType, aiAnalysis, submissionId),
        priority: leadScore.score >= 70 ? 'high' : 'normal'
      }).catch(e => console.error('❌ Internal email failed:', e.message))
    );
  
    operations.push(
      addToMailchimpWithAutomation(formData, leadScore, submissionType)
        .catch(e => console.error('❌ Mailchimp failed:', e.message))
    );
  
    operations.push(
      createClioLead(formData, submissionType, leadScore)
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
app.post('/legal-strategy-builder', async (req, res) => {
  try {
    let formData = sanitizeInput(req.body || {});
    const submissionId = formData.submissionId || `strategy-${Date.now()}`;
    formData = withNormalizedType(formData, 'legal-strategy-builder');
    const submissionType = formData._normalizedType;
  
    console.log(`📥 New ${submissionType} submission:`, formData.email);
  
    const leadScore = calculateLeadScore(formData, submissionType);
    const assessmentScore = parseInt(formData.assessmentScore) || leadScore.score; // Sync frontend score
    const aiAnalysis = await analyzeIntakeWithAI(formData, submissionType, leadScore);
  
    if (mixpanel) {
      mixpanel.track('Legal Strategy Builder Submitted', {
        distinct_id: formData.email,
        service: submissionType,
        score: leadScore.score,
        q1: formData.q1,
        q2: formData.q2,
        q3: formData.q3,
        q4: formData.q4,
        q5: formData.q5,
        q6: formData.q6,
        q7: formData.q7,
        q8: formData.q8
      });
    }
  
    const operations = [];
    const alertRecipients = leadScore.score >= 70
      ? [INTAKE_NOTIFY_TO, HIGH_VALUE_NOTIFY_TO]
      : [INTAKE_NOTIFY_TO];
  
    operations.push(
      sendEnhancedEmail({
        to: alertRecipients,
        subject: `${leadScore.score >= 70 ? '🔥 HIGH VALUE' : ''} Legal Strategy Builder — ${formData.email} (Score: ${leadScore.score})`,
        html: generateInternalAlert(formData, leadScore, submissionType, aiAnalysis, submissionId),
        priority: leadScore.score >= 70 ? 'high' : 'normal'
      }).catch(e => console.error('❌ Internal email failed:', e.message))
    );
  
    operations.push(
      addToMailchimpWithAutomation(formData, leadScore, submissionType)
        .catch(e => console.error('❌ Mailchimp failed:', e.message))
    );
  
    operations.push(
      createClioLead(formData, submissionType, leadScore)
        .catch(e => console.error('❌ Clio failed:', e.message))
    );
  
    if (formData.email) {
      const clientEmailHtml = generateClientConfirmationEmail(formData, null, submissionType, leadScore);
      if (clientEmailHtml) {
        operations.push(
          sendEnhancedEmail({
            to: [formData.email],
            subject: 'Your Legal Strategy Results & Next Steps — Jacobs Counsel',
            html: clientEmailHtml
          }).catch(e => console.error('❌ Client email failed:', e.message))
        );
      }
    }
  
    await processIntakeOperations(operations);
  
    res.json({
      ok: true,
      submissionId,
      leadScore: leadScore.score,
      aiAnalysisAvailable: !!aiAnalysis?.analysis
    });
  } catch (error) {
    console.error('💥 Legal strategy builder error:', error);
    res.status(500).json({ ok: false, error: error.message });
  }
});
// Newsletter endpoint
app.post('/newsletter-signup', async (req, res) => {
  try {
    let formData = sanitizeInput(req.body || {});
    formData = withNormalizedType(formData, 'newsletter');
    const submissionType = formData._normalizedType;
    const submissionId = `newsletter-${Date.now()}`;
    console.log(`📥 New ${submissionType} submission:`, formData.email);
    const leadScore = calculateLeadScore(formData, submissionType);
    if (mixpanel) {
      mixpanel.track('Newsletter Signup', {
        distinct_id: formData.email,
        source: formData.source || 'newsletter'
      });
    }
    const operations = [];
    if (formData.email) {
      const welcomeEmailHtml = generateNewsletterWelcomeEmail(formData);
      if (welcomeEmailHtml) {
        operations.push(
          sendEnhancedEmail({
            to: [formData.email],
            subject: 'Your Legal Playbook Starts Here [+ Free Resources Inside]',
            html: welcomeEmailHtml
          }).catch(e => console.error('❌ Welcome email failed:', e.message))
        );
      }
      // Send internal notification to Drew
      operations.push(
        sendEnhancedEmail({
          to: [HIGH_VALUE_NOTIFY_TO],
          subject: 'New Newsletter Subscriber',
          html: `
            <h2>New Newsletter Subscriber</h2>
            <p><strong>Name:</strong> ${formData.firstName || 'Not provided'}</p>
            <p><strong>Email:</strong> ${formData.email}</p>
            <p><strong>Source:</strong> ${formData.source || 'Website'}</p>
            <p><strong>Submitted:</strong> ${new Date().toLocaleString()}</p>
          `
        }).catch(e => console.error('❌ Internal newsletter notification failed:', e.message))
      );
    }
    operations.push(
      addToMailchimpWithAutomation(formData, leadScore, submissionType)
        .catch(e => console.error('❌ Mailchimp failed:', e.message))
    );
    await processIntakeOperations(operations);
    res.json({
      ok: true,
      submissionId,
      message: 'Subscribed successfully'
    });
  } catch (error) {
    console.error('💥 Newsletter error:', error);
    res.status(500).json({ ok: false, error: error.message });
  }
});
// Resource guide endpoint
app.post('/resource-guide-download', async (req, res) => {
  try {
    let formData = sanitizeInput(req.body || {});
    formData = withNormalizedType(formData, 'resource-guide');
    const submissionType = formData._normalizedType;
    const submissionId = `guide-${Date.now()}`;
    console.log(`📥 New ${submissionType} submission:`, formData.email);
    const leadScore = calculateLeadScore(formData, submissionType);
    if (mixpanel) {
      mixpanel.track('Resource Guide Download', {
        distinct_id: formData.email,
        source: formData.source || 'resource-guide'
      });
    }
    const operations = [];
    if (formData.email) {
      const thankYouEmailHtml = generateResourceThankYouEmail(formData, RESOURCE_GUIDE_URL);
      if (thankYouEmailHtml) {
        operations.push(
          sendEnhancedEmail({
            to: [formData.email],
            subject: 'Your Legal Resource Guide - Jacobs Counsel',
            html: thankYouEmailHtml
          }).catch(e => console.error('❌ Thank you email failed:', e.message))
        );
      }
    }
    operations.push(
      addToMailchimpWithAutomation(formData, leadScore, submissionType)
        .catch(e => console.error('❌ Mailchimp failed:', e.message))
    );
    await processIntakeOperations(operations);
    res.json({
      ok: true,
      submissionId,
      downloadLink: RESOURCE_GUIDE_URL,
      message: 'Guide ready for download'
    });
  } catch (error) {
    console.error('💥 Resource guide error:', error);
    res.status(500).json({ ok: false, error: error.message });
  }
});
// Legacy add-subscriber (redirect or deprecate if needed)
app.post('/add-subscriber', async (req, res) => {
  try {
    const { email, firstName = '', source = 'newsletter' } = req.body;
  
    if (!email) {
      return res.status(400).json({ ok: false, error: 'Email required' });
    }
  
    const leadScore = { score: 30, factors: ['Newsletter signup'] };
    const formData = { email, firstName, source };
  
    // Send welcome email
    if (formData.email) {
      const welcomeEmailHtml = generateNewsletterWelcomeEmail(formData);
      await sendEnhancedEmail({
        to: [formData.email],
        subject: 'Your Legal Playbook Starts Here [+ Free Resources Inside]',
        html: welcomeEmailHtml
      });
      // Send internal notification to Drew
      await sendEnhancedEmail({
        to: [HIGH_VALUE_NOTIFY_TO],
        subject: 'New Newsletter Subscriber',
        html: `
          <h2>New Newsletter Subscriber</h2>
          <p><strong>Name:</strong> ${firstName || 'Not provided'}</p>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Source:</strong> ${source}</p>
          <p><strong>Submitted:</strong> ${new Date().toLocaleString()}</p>
        `
      });
    }
  
    await addToMailchimpWithAutomation(formData, leadScore, 'newsletter');
  
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
// Health Check
app.get('/health', async (req, res) => {
  res.json({
    status: 'operational',
    timestamp: new Date().toISOString(),
    services: {
      openai: OPENAI_API_KEY ? 'configured' : 'not configured',
      mailchimp: MAILCHIMP_API_KEY ? 'configured' : 'not configured',
      clio: CLIO_GROW_INBOX_TOKEN ? 'configured' : 'not configured',
      email: MS_CLIENT_ID ? 'configured' : 'not configured',
      calendly: 'webhook active'
    }
  });
});
// Root endpoint
app.get('/', (req, res) => {
  res.json({
    ok: true,
    service: 'jacobs-counsel-unified-intake',
    version: '3.0.0-SIMPLIFIED',
    endpoints: [
      '/estate-intake',
      '/business-formation-intake',
      '/brand-protection-intake',
      '/outside-counsel',
      '/legal-strategy-builder',
      '/newsletter-signup',
      '/resource-guide-download',
      '/add-subscriber',
      '/webhook/calendly',
      '/health'
    ],
    features: ['Lead Scoring', 'Mailchimp', 'Calendly', 'Clio', 'Email Notifications']
  });
});
// Error handling
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    ok: false,
    error: 'Server error. Please try again or contact us directly.'
  });
});
// Start server
app.listen(PORT, () => {
  try {
    validateEnvironment();
  } catch (error) {
    console.error('❌ Startup failed:', error.message);
    process.exit(1);
  }
  console.log(`🚀 Jacobs Counsel System running on port ${PORT}`);
  console.log(`📊 Features: Lead Scoring, Mailchimp, Calendly, Clio`);
  console.log(`✅ Database removed - all data in Mailchimp/Clio`);
  console.log(`📅 Calendly webhook active at /webhook/calendly`);
});
