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
    'legal-strategy-builder': 55,
    'newsletter': 25
  };
 
  score += baseScores[submissionType] || 30;
  scoreFactors.push(`Base ${submissionType}: +${baseScores[submissionType] || 30}`);
 
  if (formData.fromAssessment === 'true' || formData.source === 'legal-strategy-builder-conversion') {
    score += 20;
    scoreFactors.push('Strategy Builder conversion: +20');
    if (formData.assessmentScore) {
      const assessmentScore = parseInt(formData.assessmentScore);
      if (assessmentScore >= 70) {
        score += 15;
        scoreFactors.push('High assessment score: +15');
      } else if (assessmentScore >= 50) {
        score += 10;
        scoreFactors.push('Good assessment score: +10');
      }
    }
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
    const estate = parseFloat(formData.grossEstate?.replace(/[,$]/g, '') || '0');
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
    SERVICE_TYPE: submissionType.replace('-', ' '),
    SIGNUP_DATE: new Date().toISOString().split('T')[0],
    LEAD_SOURCE: 'Website Intake Form',
    CALENDLY: calendlyLink
  };
  if (submissionType === 'estate-intake') {
    const estate = parseFloat(formData.grossEstate?.replace(/[,$]/g, '') || '0');
    fields.ESTATE_AMOUNT = estate > 0 ? '$' + estate.toLocaleString() : 'Not specified';
    fields.HAS_BUSINESS = formData.ownBusiness === 'Yes' ? 'Yes' : 'No';
    fields.HAS_KIDS = formData.hasMinorChildren === 'Yes' ? 'Yes' : 'No';
  }
  if (submissionType === 'business-formation') {
    fields.STARTUP_TYPE = formData.investmentPlan || 'Not specified';
    fields.BUSINESS_TYPE = formData.businessType || 'Not specified';
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
      <li><strong>Assessment Score:</strong> ${leadScore.score}/100 (${leadScore.score >= 70 ? 'Strong foundation' : leadScore.score >= 50 ? 'Developing foundation' : 'Early stage'})</li>
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
function generateClientConfirmationEmail(formData, price, submissionType, leadScore) {
  let clientName = formData.firstName || formData.fullName?.split(' ')[0] ||
                   formData.contactName?.split(' ')[0] || formData.founderName?.split(' ')[0] || 'there';
 
  if (!formData.email) {
    console.error('❌ No email provided for client confirmation');
    return null;
  }
 
  const calendlyLink = getCalendlyLink(submissionType, leadScore);
  const displayPrice = price || null;
 
  // Legal Strategy Builder gets special treatment
 if (submissionType === 'legal-strategy-builder') {
  return `
<!DOCTYPE html>
<html>
<body style="font-family: Arial, sans-serif; margin: 0; padding: 0;">
   <div style="max-width: 600px; margin: 20px auto; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
      
       <div style="background-color: #ff4d00; padding: 40px 30px; text-align: center;">
           <h1 style="color: #000000; font-size: 28px; margin: 0;">Your Legal Assessment Results</h1>
       </div>
     
       <div style="padding: 40px 30px;">
           <p style="font-size: 18px;">Hi ${clientName},</p>
         
           <p>You've completed our legal assessment and received your Legal Foundation Score of <strong>${leadScore.score}/100</strong>. Based on your responses, I've identified specific areas where you can strengthen your legal position.</p>
          
           <p><strong>What happens next:</strong></p>
          
           <p>I'll personally review your answers about your business structure, IP protection, contracts, and goals. During our consultation, I'll walk you through exactly which legal protections you need first, which can wait, and how to prioritize them within your budget.</p>
          
           ${leadScore.score >= 70 ? `
           <div style="background: #fff5f5; border: 2px solid #ff4d00; padding: 20px; border-radius: 8px; margin: 24px 0;">
               <h3 style="color: #d32f2f; margin: 0 0 12px;">Priority Review Status</h3>
               <p style="margin: 0;">Your assessment score qualifies you for priority scheduling. I've reserved consultation slots specifically for high-potential situations like yours.</p>
           </div>
           ` : ''}
          
           <div style="background: #f8fafc; padding: 24px; border-radius: 8px; margin: 24px 0;">
               <h3 style="margin: 0 0 16px; color: #374151;">What We'll Cover (15 Minutes):</h3>
               <ul style="margin: 0; padding-left: 20px; color: #374151;">
                   <li style="margin-bottom: 8px;">Your biggest legal vulnerabilities based on your assessment</li>
                   <li style="margin-bottom: 8px;">Which protections to tackle first (with estimated costs)</li>
                   <li style="margin-bottom: 8px;">Common mistakes for people in your situation</li>
                   <li style="margin-bottom: 8px;">Whether we're the right fit to help you</li>
               </ul>
           </div>
          
           <div style="background: linear-gradient(135deg, #ff4d00, #ff6d20); padding: 32px; border-radius: 12px; margin: 32px 0; text-align: center;">
               <h3 style="color: #000000; margin: 0 0 16px; font-size: 24px;">Book Your Strategy Session</h3>
               <p style="color: #000000; margin: 0 0 24px; opacity: 0.95;">Free consultation - no obligation</p>
               <a href="${calendlyLink}"
   style="background-color: #ffffff !important;
          color: #ff4d00 !important;
          padding: 16px 32px;
          text-decoration: none;
          border-radius: 8px;
          display: inline-block;
          font-weight: 700;
          font-size: 18px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
          border: 2px solid #ff4d00;">
   Select Your Time Slot
</a>
           </div>
          
           <div style="background: #fef3cd; padding: 16px; border-radius: 8px; margin: 24px 0; border-left: 4px solid #f59e0b;">
               <p style="margin: 0; font-size: 14px; color: #92400e;"><strong>Legal Notice:</strong> This consultation is for informational purposes only. No attorney-client relationship is formed until you sign an engagement letter with our firm.</p>
           </div>
          
           <p style="font-size: 16px; color: #64748b;">This consultation is completely free. I'll provide actionable advice whether you hire us or not. Many clients tell me they wish they'd had this conversation years earlier.</p>
         
           <p>Best,<br>
           <strong>Drew Jacobs</strong><br>
           <span style="color: #64748b;">Founder, Jacobs Counsel</span></p>
       </div>
   </div>
</body>
</html>`;
}
 
  // Regular intake forms get this version
  return `
<!DOCTYPE html>
<html>
<body style="font-family: Arial, sans-serif; margin: 0; padding: 0;">
   <div style="max-width: 600px; margin: 20px auto; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
      
       <div style="background-color: #ff4d00; padding: 40px 30px; text-align: center;">
           <h1 style="color: #000000; font-size: 28px; margin: 0;">I'm Reviewing Your Submission Now</h1>
       </div>
     
       <div style="padding: 40px 30px;">
           <p style="font-size: 18px;">Hi ${clientName},</p>
         
           <p>I just received your ${submissionType.replace('-', ' ')} intake and I'm personally reviewing every detail you shared.</p>
          
           <p>Based on what you've told me about your situation, I'll prepare specific recommendations for our consultation. This isn't a generic legal overview - I'll address your exact circumstances, concerns, and goals.</p>
         
           ${leadScore.score >= 70 ? `
           <div style="background: #fff5f5; border: 2px solid #ff4d00; padding: 20px; border-radius: 8px; margin: 24px 0;">
               <h3 style="color: #d32f2f; margin: 0 0 12px;">Priority Review Status</h3>
               <p style="margin: 0;">Your submission indicates some time-sensitive elements. I've marked this for priority review and reserved a consultation slot specifically for situations like yours.</p>
           </div>
           ` : ''}
         
           ${displayPrice ? `
           <div style="background: #f0fdf4; padding: 24px; border-radius: 8px; margin: 24px 0;">
               <h3 style="margin: 0 0 12px; color: #166534;">Estimated Investment</h3>
               <p style="margin: 0; font-size: 20px; font-weight: 600; color: #166534;">
                   ${typeof displayPrice === 'number' ? '$' + displayPrice.toLocaleString() : displayPrice}
               </p>
               <p style="margin: 8px 0 0; font-size: 16px; color: #16a34a;">We'll discuss payment options and timeline during our consultation</p>
           </div>
           ` : ''}
          
           <div style="background: #f8fafc; padding: 24px; border-radius: 8px; margin: 24px 0;">
               <h3 style="margin: 0 0 16px; color: #374151;">What We'll Cover:</h3>
               <ul style="margin: 0; padding-left: 20px; color: #374151;">
                   <li style="margin-bottom: 8px;">Immediate action items based on your submission</li>
                   <li style="margin-bottom: 8px;">Potential risks I spotted in your situation</li>
                   <li style="margin-bottom: 8px;">Timeline and next steps if we work together</li>
                   <li style="margin-bottom: 8px;">Honest assessment of whether we're the right fit</li>
               </ul>
           </div>
         
           <div style="background: linear-gradient(135deg, #0f172a, #ff4d00); padding: 32px; border-radius: 12px; margin: 32px 0; text-align: center;">
               <h3 style="color: #ffffff; margin: 0 0 16px; font-size: 24px;">Schedule Your Consultation</h3>
               <p style="color: #ffffff; margin: 0 0 24px; opacity: 0.95;">Free 15-minute strategy session - no obligation</p>
               <a href="${calendlyLink}"
   style="background-color: #ffffff !important;
          color: #ff4d00 !important;
          padding: 16px 32px;
          text-decoration: none;
          border-radius: 8px;
          display: inline-block;
          font-weight: 700;
          font-size: 18px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
          border: 2px solid #ff4d00;">
   Select Your Time Slot
</a>
           </div>
          
           <p style="font-size: 16px; color: #64748b;">This consultation is completely free with no pressure to hire us. I'll give you actionable advice regardless of whether we work together.</p>
         
           <p>Best,<br>
           <strong>Drew Jacobs</strong><br>
           <span style="color: #64748b;">Founder, Jacobs Counsel</span></p>
       </div>
   </div>
</body>
</html>`;
}
function generateNewsletterWelcomeEmail(formData) {
  const clientName = formData.firstName || formData.fullName?.split(' ')[0] || 'there';
  return `
<!DOCTYPE html>
<html>
<body style="font-family: Arial, sans-serif; margin: 0; padding: 0;">
   <div style="max-width: 600px; margin: 20px auto; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
      
       <div style="background-color: #ff4d00; padding: 40px 30px; text-align: center;">
           <h1 style="color: #000000; font-size: 28px; margin: 0;">Welcome to Jacobs Counsel Newsletter</h1>
       </div>
     
       <div style="padding: 40px 30px;">
           <p style="font-size: 18px;">Hi ${clientName},</p>
         
           <p>Thanks for signing up. You'll receive updates on legal strategies for startups, creators, and athletes.</p>
          
           <p>Stay tuned for our first issue.</p>
         
           <p>Best,<br>
           <strong>Drew Jacobs</strong><br>
           <span style="color: #64748b;">Founder, Jacobs Counsel</span></p>
       </div>
   </div>
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
      const invitee = payload.invitee || {};
      const email = invitee.email;
      const name = invitee.name;
      const scheduled_event = payload.scheduled_event || {};
     
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
      aiAnalysisAvailable: !!aiAnalysis?.analysis,
      message: 'Outside counsel request submitted successfully'
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
            subject: 'Welcome to Jacobs Counsel Newsletter',
            html: welcomeEmailHtml
          }).catch(e => console.error('❌ Welcome email failed:', e.message))
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
    const { email, source = 'newsletter' } = req.body;
   
    if (!email) {
      return res.status(400).json({ ok: false, error: 'Email required' });
    }
   
    const leadScore = { score: 30, factors: ['Newsletter signup'] };
    const formData = { email, source };
   
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
