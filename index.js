// index.js - Complete file
import express from 'express';
import cors from 'cors';
import multer from 'multer';
import fetch from 'node-fetch';
import { Buffer } from 'buffer';
import rateLimit from 'express-rate-limit';
import validator from 'validator';
import NodeCache from 'node-cache';
import pg from 'pg';
import Mixpanel from 'mixpanel';

const mixpanel = process.env.MIXPANEL_TOKEN ? Mixpanel.init(process.env.MIXPANEL_TOKEN) : null;
const cache = new NodeCache({ stdTTL: 600 });

// ==================== CONFIGURATION ====================
const PORT = process.env.PORT || 3000;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || '';
const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini';
const MS_TENANT_ID = process.env.MS_TENANT_ID || '';
const MS_CLIENT_ID = process.env.MS_CLIENT_ID || '';
const MS_CLIENT_SECRET = process.env.MS_CLIENT_SECRET || '';
const MS_GRAPH_SENDER = process.env.MS_GRAPH_SENDER || '';
const MAILCHIMP_API_KEY = process.env.MAILCHIMP_API_KEY || '';
const MAILCHIMP_SERVER = process.env.MAILCHIMP_SERVER || 'us21';
const MAILCHIMP_AUDIENCE_ID = process.env.MAILCHIMP_AUDIENCE_ID || '';
const CLIO_GROW_BASE = process.env.CLIO_GROW_BASE || 'https://grow.clio.com';
const CLIO_GROW_INBOX_TOKEN = process.env.CLIO_GROW_INBOX_TOKEN || '';
const INTAKE_NOTIFY_TO = process.env.INTAKE_NOTIFY_TO || 'intake@jacobscounsellaw.com';
const HIGH_VALUE_NOTIFY_TO = process.env.HIGH_VALUE_NOTIFY_TO || 'drew@jacobscounsellaw.com';
const MOTION_LINK = process.env.MOTION_LINK || 'https://app.usemotion.com/meet/drew-jacobs-jcllc/8xx9grm';
const LEGAL_GUIDE_PDF_URL = process.env.LEGAL_GUIDE_PDF_URL || '';

// ==================== DATABASE SETUP ====================
const pool = new pg.Pool({
  connectionString: process.env.PG_URI,
  ssl: { rejectUnauthorized: false },
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

async function initDB() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS intakes (
        id SERIAL PRIMARY KEY,
        email TEXT,
        type TEXT,
        score INTEGER,
        data JSONB,
        created_at TIMESTAMP DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_intakes_email ON intakes(email);
      CREATE INDEX IF NOT EXISTS idx_intakes_type ON intakes(type);
      CREATE INDEX IF NOT EXISTS idx_intakes_created ON intakes(created_at);
    `);
    console.log('✅ Database ready');
  } catch (e) {
    console.error('⚠️ Database init failed (will work without it):', e.message);
  }
}
initDB();

// ==================== EXPRESS SETUP ====================
const app = express();
app.set('trust proxy', 1);
app.use(cors({
  origin: ['https://jacobscounsellaw.com', 'http://localhost:3000'],
  credentials: true
}));
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const standardLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: 'Too many requests, please try again later.',
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

// ==================== LEAD SCORING ====================
function calculateLeadScore(formData, submissionType) {
  let score = 0;
  let factors = [];
  
  const baseScores = {
    'estate-intake': 40,
    'business-formation': 50,
    'brand-protection': 35,
    'outside-counsel': 45,
    'legal-strategy-builder': 55,
    'legal-guide-download': 30,
    'newsletter': 20
  };
  
  score += baseScores[submissionType] || 30;
  factors.push(`Base ${submissionType}: +${baseScores[submissionType] || 30}`);
  
  // Estate Planning Scoring
  if (submissionType === 'estate-intake') {
    const grossEstate = parseFloat(formData.grossEstate?.replace(/[,$]/g, '') || '0');
    
    if (grossEstate > 5000000) { 
      score += 50; 
      factors.push('High net worth (>$5M): +50'); 
    } else if (grossEstate > 2000000) { 
      score += 35; 
      factors.push('Significant assets (>$2M): +35'); 
    } else if (grossEstate > 1000000) { 
      score += 25; 
      factors.push('Substantial assets (>$1M): +25'); 
    }
    
    if (formData.packagePreference?.toLowerCase().includes('trust')) {
      score += 30; 
      factors.push('Trust preference: +30');
    }
    
    if (formData.ownBusiness === 'Yes') { 
      score += 20; 
      factors.push('Business owner: +20'); 
    }
  }
  
  // Business Formation Scoring
  if (submissionType === 'business-formation') {
    if (formData.investmentPlan === 'vc') { 
      score += 60; 
      factors.push('VC-backed startup: +60'); 
    } else if (formData.investmentPlan === 'angel') { 
      score += 40; 
      factors.push('Angel funding: +40'); 
    }
    
    if (formData.selectedPackage === 'gold') { 
      score += 25; 
      factors.push('Premium package: +25'); 
    }
  }
  
  // Outside Counsel Scoring
  if (submissionType === 'outside-counsel') {
    if (formData.budget?.includes('10K+')) { 
      score += 40; 
      factors.push('High budget (>$10K): +40'); 
    } else if (formData.budget?.includes('5K-10K')) { 
      score += 25; 
      factors.push('Substantial budget: +25'); 
    }
  }
  
  // Urgency scoring
  if (formData.urgency?.toLowerCase().includes('immediate')) {
    score += 40; 
    factors.push('Urgent timeline: +40');
  }
  
  return { 
    score: Math.min(score, 100), 
    factors,
    isHighValue: score >= 70,
    isUrgent: formData.urgency?.toLowerCase().includes('immediate')
  };
}

// ==================== MICROSOFT GRAPH EMAIL ====================
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

async function sendEmail({ to, subject, html, priority = 'normal', attachments = [] }) {
  try {
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
  } catch (error) {
    console.error('Email send failed:', error);
    throw error;
  }
}

// ==================== MAILCHIMP INTEGRATION ====================
async function addToMailchimp(formData, submissionType, leadScore) {
  if (!MAILCHIMP_API_KEY || !MAILCHIMP_AUDIENCE_ID) {
    console.log('Mailchimp not configured, skipping');
    return { skipped: true };
  }
  
  // Generate tags for automation
  const tags = [
    `intake-${submissionType}`,
    `score-${Math.floor(leadScore.score/10)*10}`,
    `date-${new Date().toISOString().split('T')[0]}`
  ];
  
  // Automation trigger tags based on score
  if (leadScore.isHighValue) {
    tags.push('hot-lead-daily');
    tags.push('priority-outreach');
  } else if (leadScore.score >= 50) {
    tags.push('warm-lead-3day');
  } else if (submissionType === 'newsletter') {
    tags.push('newsletter-welcome');
  } else {
    tags.push('standard-lead-weekly');
  }
  
  if (leadScore.isUrgent) tags.push('urgent-followup');
  
  // Service-specific automations
  const automationMap = {
    'estate-intake': 'estate-planning-sequence',
    'business-formation': 'business-formation-sequence',
    'brand-protection': 'brand-protection-sequence',
    'outside-counsel': 'outside-counsel-sequence',
    'legal-strategy-builder': 'assessment-followup',
    'newsletter': 'newsletter-sequence'
  };
  
  if (automationMap[submissionType]) {
    tags.push(automationMap[submissionType]);
  }
  
  const memberData = {
    email_address: formData.email,
    status: 'subscribed',
    merge_fields: {
      FNAME: formData.firstName || formData.fullName?.split(' ')[0] || '',
      LNAME: formData.lastName || formData.fullName?.split(' ').slice(1).join(' ') || '',
      PHONE: formData.phone || '',
      LEADSCORE: leadScore.score,
      SERVICETYPE: submissionType.replace('-', ' ')
    },
    tags: tags
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
      // Member exists, update tags
      const crypto = await import('crypto');
      const hashedEmail = crypto.createHash('md5').update(formData.email.toLowerCase()).digest('hex');
      
      await fetch(
        `https://${MAILCHIMP_SERVER}.api.mailchimp.com/3.0/lists/${MAILCHIMP_AUDIENCE_ID}/members/${hashedEmail}/tags`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${MAILCHIMP_API_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            tags: tags.map(tag => ({ name: tag, status: 'active' }))
          })
        }
      );
    }
    
    console.log(`✅ Added to Mailchimp with tags: ${tags.join(', ')}`);
    return { success: true };
  } catch (error) {
    console.error('Mailchimp error:', error);
    return { error: error.message };
  }
}

// ==================== CLIO INTEGRATION ====================
async function createClioLead(formData, submissionType, leadScore) {
  if (!CLIO_GROW_INBOX_TOKEN) {
    console.log('Clio Grow not configured, skipping');
    return { skipped: true };
  }
  
  const firstName = formData.firstName || formData.fullName?.split(' ')[0] || 'Unknown';
  const lastName = formData.lastName || formData.fullName?.split(' ').slice(1).join(' ') || 'Client';
  
  let message = `${submissionType.replace('-', ' ').toUpperCase()} Lead (Score: ${leadScore.score}/100)\n\n`;
  
  if (submissionType === 'estate-intake') {
    message += `Estate Value: ${formData.grossEstate || 'Not specified'}\n`;
    message += `Package: ${formData.packagePreference || 'Not specified'}\n`;
  } else if (submissionType === 'business-formation') {
    message += `Business: ${formData.businessName || 'Not specified'}\n`;
    message += `Package: ${formData.selectedPackage || 'Not specified'}\n`;
  }
  
  message += `\nFull Details:\n${JSON.stringify(formData, null, 2)}`;
  
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
function generateInternalAlert(formData, leadScore, submissionType, submissionId) {
  const isHighValue = leadScore.isHighValue;
  const name = formData.firstName || formData.fullName || formData.contactName || 'Unknown';
  
  // Clear subject lines based on actual submission type
  let subject = '';
  if (submissionType === 'newsletter') {
    subject = `Newsletter Signup: ${formData.email}`;
  } else if (submissionType === 'legal-guide-download') {
    subject = `Guide Download: ${name}`;
  } else if (isHighValue) {
    subject = `🔥 HIGH VALUE ${submissionType.replace('-', ' ').toUpperCase()}: ${name}`;
  } else {
    subject = `New ${submissionType.replace('-', ' ')}: ${name}`;
  }
  
  return `
<!DOCTYPE html>
<html>
<body style="font-family: Arial, sans-serif; padding: 20px;">
  <div style="max-width: 700px; margin: 0 auto;">
    ${isHighValue ? `
    <div style="background: #dc2626; color: white; padding: 16px; border-radius: 8px; margin-bottom: 24px;">
      <h2 style="margin: 0; color: white;">🔥 HIGH VALUE LEAD - Score: ${leadScore.score}/100</h2>
    </div>
    ` : ''}
    
    <h1 style="color: #ff4d00;">New ${submissionType.replace('-', ' ').toUpperCase()} Intake</h1>
    
    <div style="background: #f8fafc; padding: 24px; border-radius: 8px;">
      <h3>Contact Information</h3>
      <p><strong>Name:</strong> ${name}</p>
      <p><strong>Email:</strong> <a href="mailto:${formData.email}">${formData.email}</a></p>
      <p><strong>Phone:</strong> ${formData.phone || 'Not provided'}</p>
      <p><strong>Lead Score:</strong> ${leadScore.score}/100</p>
      ${leadScore.isUrgent ? '<p style="color: red;"><strong>⚠️ URGENT - Immediate response needed</strong></p>' : ''}
    </div>
    
    <div style="background: #e0f2fe; padding: 24px; border-radius: 8px; margin: 24px 0; text-align: center;">
      <a href="mailto:${formData.email}" style="background: #0369a1; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; display: inline-block; margin: 8px;">
        📧 Email Client
      </a>
      <a href="${MOTION_LINK}" style="background: #059669; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; display: inline-block; margin: 8px;">
        📅 Book Consultation
      </a>
    </div>
    
    <details>
      <summary style="cursor: pointer;">Full Form Data</summary>
      <pre style="background: #f8fafc; padding: 16px; border-radius: 8px;">${JSON.stringify(formData, null, 2)}</pre>
    </details>
    
    <p style="font-size: 14px; color: #64748b;">
      Submission ID: ${submissionId} | Mailchimp automation triggered
    </p>
  </div>
</body>
</html>`;
}

function generateClientEmail(formData, submissionType, leadScore) {
  const firstName = formData.firstName || formData.fullName?.split(' ')[0] || 'there';
  
  return `
<!DOCTYPE html>
<html>
<body style="font-family: Arial, sans-serif; padding: 20px;">
  <div style="max-width: 600px; margin: 0 auto;">
    <div style="background: #ff4d00; padding: 40px 30px; text-align: center;">
      <h1 style="color: white; margin: 0;">Thank you for choosing Jacobs Counsel</h1>
    </div>
    
    <div style="padding: 40px 30px;">
      <p style="font-size: 18px;">Hi ${firstName},</p>
      
      <p>We've received your ${submissionType.replace('-', ' ')} request and will review it within 1 business day.</p>
      
      ${leadScore.isHighValue ? `
      <div style="background: #fff5f5; border: 2px solid #ff4d00; padding: 20px; border-radius: 8px; margin: 24px 0;">
        <h3 style="color: #d32f2f;">🔥 Priority Review Status</h3>
        <p>Based on your responses, we've marked your intake for priority review.</p>
      </div>
      ` : ''}
      
      <div style="background: #e3f2fd; padding: 32px; border-radius: 8px; margin: 32px 0; text-align: center;">
        <p style="font-weight: 700; margin: 0 0 20px;">Ready to schedule your consultation?</p>
        <a href="${MOTION_LINK}" style="background: #ff4d00; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; display: inline-block;">
          📅 Book Your Consultation Now
        </a>
      </div>
      
      <p>Best regards,<br>
      <strong>The Jacobs Counsel Team</strong></p>
    </div>
  </div>
</body>
</html>`;
}

// ==================== UNIFIED INTAKE PROCESSOR ====================
async function processIntake(formData, submissionType, files = []) {
  const submissionId = `${submissionType}-${Date.now()}`;
  const leadScore = calculateLeadScore(formData, submissionType);
  
  console.log(`📥 New ${submissionType}: ${formData.email} (Score: ${leadScore.score})`);
  
  // Store in database (non-blocking)
  pool.query(
    'INSERT INTO intakes (email, type, score, data) VALUES ($1, $2, $3, $4)',
    [formData.email, submissionType, leadScore.score, JSON.stringify(formData)]
  ).catch(e => console.log('DB write failed (non-critical):', e.message));
  
  // Track in Mixpanel
  if (mixpanel) {
    mixpanel.track('Intake Submitted', {
      distinct_id: formData.email,
      service: submissionType,
      score: leadScore.score
    });
  }
  
  // Process attachments
  const attachments = files
    .filter(f => f?.buffer && f.size <= 5 * 1024 * 1024)
    .slice(0, 10)
    .map(f => ({
      filename: f.originalname,
      contentType: f.mimetype,
      content: f.buffer
    }));
  
  // Parallel operations
  const operations = [];
  
  // Add to Mailchimp (triggers automations)
  operations.push(
    addToMailchimp(formData, submissionType, leadScore)
      .catch(e => console.error('Mailchimp failed:', e.message))
  );
  
  // Send to Clio
  operations.push(
    createClioLead(formData, submissionType, leadScore)
      .catch(e => console.error('Clio failed:', e.message))
  );
  
  // Internal notification (skip for low-value newsletters)
  if (submissionType !== 'newsletter' || leadScore.score > 30) {
    const alertRecipients = leadScore.isHighValue 
      ? [INTAKE_NOTIFY_TO, HIGH_VALUE_NOTIFY_TO] 
      : [INTAKE_NOTIFY_TO];
    
    const internalHtml = generateInternalAlert(formData, leadScore, submissionType, submissionId);
    const subject = submissionType === 'newsletter' 
      ? `Newsletter Signup: ${formData.email}`
      : `${leadScore.isHighValue ? '🔥 HIGH VALUE ' : ''}${submissionType.replace('-', ' ')}: ${formData.email}`;
    
    operations.push(
      sendEmail({
        to: alertRecipients,
        subject: subject,
        html: internalHtml,
        priority: leadScore.isHighValue ? 'high' : 'normal',
        attachments
      }).catch(e => console.error('Internal email failed:', e.message))
    );
  }
  
  // Client confirmation
  if (formData.email) {
    operations.push(
      sendEmail({
        to: [formData.email],
        subject: `Jacobs Counsel — Your ${submissionType.replace('-', ' ')} request`,
        html: generateClientEmail(formData, submissionType, leadScore)
      }).catch(e => console.error('Client email failed:', e.message))
    );
  }
  
  await Promise.allSettled(operations);
  
  return { submissionId, leadScore: leadScore.score };
}

// ==================== MAIN INTAKE ENDPOINTS ====================
app.post('/estate-intake', upload.array('document'), async (req, res) => {
  try {
    const formData = sanitizeInput(req.body || {});
    const result = await processIntake(formData, 'estate-intake', req.files || []);
    
    // Calculate pricing
    const marital = (formData.maritalStatus || '').toLowerCase();
    const pkg = (formData.packagePreference || '').toLowerCase();
    const married = marital === 'married';
    let price = null;
    if (pkg.includes('trust')) price = married ? 3650 : 2900;
    else if (pkg.includes('will')) price = married ? 1900 : 1500;
    
    res.json({
      ok: true,
      submissionId: result.submissionId,
      leadScore: result.leadScore,
      price
    });
  } catch (error) {
    console.error('Estate intake error:', error);
    res.status(500).json({ ok: false, error: error.message });
  }
});

app.post('/business-formation-intake', upload.array('documents'), async (req, res) => {
  try {
    const formData = sanitizeInput(req.body || {});
    const result = await processIntake(formData, 'business-formation', req.files || []);
    
    // Calculate pricing
    let price = null;
    const packageType = (formData.selectedPackage || '').toLowerCase();
    if (packageType.includes('bronze')) price = 2995;
    else if (packageType.includes('silver')) price = 4995;
    else if (packageType.includes('gold')) price = 7995;
    
    res.json({
      ok: true,
      submissionId: result.submissionId,
      leadScore: result.leadScore,
      price
    });
  } catch (error) {
    console.error('Business formation error:', error);
    res.status(500).json({ ok: false, error: error.message });
  }
});

app.post('/brand-protection-intake', upload.array('brandDocument'), async (req, res) => {
  try {
    const formData = sanitizeInput(req.body || {});
    const result = await processIntake(formData, 'brand-protection', req.files || []);
    
    res.json({
      ok: true,
      submissionId: result.submissionId,
      leadScore: result.leadScore
    });
  } catch (error) {
    console.error('Brand protection error:', error);
    res.status(500).json({ ok: false, error: error.message });
  }
});

app.post('/outside-counsel', async (req, res) => {
  try {
    const formData = sanitizeInput(req.body);
    const result = await processIntake(formData, 'outside-counsel');
    
    res.json({
      success: true,
      submissionId: result.submissionId,
      leadScore: result.leadScore,
      message: 'Outside counsel request submitted successfully'
    });
  } catch (error) {
    console.error('Outside counsel error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process outside counsel request'
    });
  }
});

app.post('/legal-strategy-builder', async (req, res) => {
  try {
    const formData = sanitizeInput(req.body);
    const result = await processIntake(formData, 'legal-strategy-builder');
    
    res.json({
      ok: true,
      submissionId: result.submissionId,
      leadScore: result.leadScore
    });
  } catch (error) {
    console.error('Strategy builder error:', error);
    res.status(500).json({ ok: false, error: error.message });
  }
});

app.post('/add-subscriber', async (req, res) => {
  try {
    const { email, source = 'newsletter' } = req.body;
    
    if (!email) {
      return res.status(400).json({ ok: false, error: 'Email required' });
    }
    
    await processIntake({ email, source }, 'newsletter');
    
    res.json({ ok: true, message: 'Subscriber added successfully' });
  } catch (error) {
    console.error('Newsletter error:', error);
    res.status(500).json({ ok: false, error: 'Subscription failed' });
  }
});

app.post('/legal-guide', upload.none(), async (req, res) => {
  try {
    const { email, firstName, guideUrl, guideName } = req.body;
    
    if (!email) {
      return res.status(400).json({ success: false, error: 'Email required' });
    }
    
    const guideUrls = {
      'complete-playbook': 'https://www.jacobscounsellaw.com/s/Protect-Your-Dreams-Maximize-Your-Impact-and-Grow-Smart.pdf',
      'vc-formation': 'https://www.jacobscounsellaw.com/s/The-VC-Ready-Business-Formation-Blueprint.pdf',
      'estate-planning': 'https://www.jacobscounsellaw.com/s/Estate-Planning-for-High-Achievers.pdf',
      'brand-protection': 'https://www.jacobscounsellaw.com/s/Emergency-Brand-Protection-Playbook.pdf'
    };
    
    const finalPdfUrl = guideUrl || guideUrls[guideName] || LEGAL_GUIDE_PDF_URL;
    
    await processIntake({ email, firstName, guideName }, 'legal-guide-download');
    
    // Send guide email
    const guideHtml = `
<!DOCTYPE html>
<html>
<body style="font-family: Arial, sans-serif; padding: 20px;">
  <div style="max-width: 600px; margin: 0 auto;">
    <h1>Your Legal Strategy Guide</h1>
    <p>Hi ${firstName || 'there'},</p>
    <p>Thank you for downloading our Legal Strategy Guide!</p>
    <div style="text-align: center; margin: 40px 0;">
      <a href="${finalPdfUrl}" style="background: #ff4d00; color: white; padding: 20px 40px; text-decoration: none; border-radius: 8px;">
        📥 Download Your Guide
      </a>
    </div>
    <p>Best regards,<br>Drew Jacobs, Esq.</p>
  </div>
</body>
</html>`;
    
    await sendEmail({
      to: [email],
      subject: `Your ${guideName || 'Legal Strategy Guide'} - Jacobs Counsel`,
      html: guideHtml
    });
    
    res.json({ success: true, message: 'Guide sent successfully!' });
  } catch (error) {
    console.error('Guide download error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==================== ANALYTICS ====================
app.post('/api/analytics/conversion', async (req, res) => {
  try {
    const { email, fromService, toService, assessmentScore } = req.body;
    
    console.log(`📈 Conversion: ${email} from ${fromService} to ${toService}`);
    
    if (mixpanel) {
      mixpanel.track('Conversion', {
        distinct_id: email,
        from: fromService,
        to: toService,
        score: assessmentScore
      });
    }
    
    res.json({ success: true, message: 'Conversion tracked' });
  } catch (error) {
    console.error('Conversion tracking error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==================== HEALTH & UTILITY ENDPOINTS ====================
app.get('/health', async (req, res) => {
  const dbConnected = await pool.query('SELECT NOW()')
    .then(() => true)
    .catch(() => false);
  
  res.json({
    status: 'operational',
    timestamp: new Date().toISOString(),
    services: {
      database: dbConnected,
      mailchimp: !!MAILCHIMP_API_KEY,
      clio: !!CLIO_GROW_INBOX_TOKEN,
      email: !!MS_CLIENT_ID
    }
  });
});

app.get('/', (req, res) => {
  res.json({
    ok: true,
    service: 'jacobs-counsel-unified-intake',
    version: '2.0.0',
    endpoints: [
      '/estate-intake',
      '/business-formation-intake',
      '/brand-protection-intake',
      '/outside-counsel',
      '/legal-strategy-builder',
      '/add-subscriber',
      '/legal-guide',
      '/api/analytics/conversion',
      '/health'
    ]
  });
});

app.post('/test-email', async (req, res) => {
  try {
    const { to } = req.body;
    
    if (!to) {
      return res.status(400).json({ error: 'Email address required' });
    }
    
    await sendEmail({
      to: [to],
      subject: '🧪 Test Email - Jacobs Counsel System',
      html: '<h2>Test Email</h2><p>If you see this, email is working!</p>'
    });
    
    res.json({ success: true, message: `Test email sent to ${to}` });
  } catch (error) {
    console.error('Test email failed:', error);
    res.status(500).json({ error: error.message });
  }
});

// ==================== ERROR HANDLING ====================
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    ok: false,
    error: 'Server error. Please try again.'
  });
});

// ==================== START SERVER ====================
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
  console.log('📧 Mailchimp handles all follow-ups');
  console.log('📅 Motion link for scheduling');
  console.log('🗄️ Database optional (won\'t break if disconnected)');
});
