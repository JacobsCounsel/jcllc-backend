// index.js — Jacobs Counsel Unified Intake System - ENHANCED PERFORMANCE EDITION
// All existing functionality preserved with performance, security, and reliability upgrades

import express from 'express';
import cors from 'cors';
import multer from 'multer';
import fetch from 'node-fetch';
import { Buffer } from 'buffer';
import cron from 'node-cron';
import rateLimit from 'express-rate-limit';
import validator from 'validator';
import NodeCache from 'node-cache';

// ==================== PERFORMANCE CACHE ====================
const cache = new NodeCache({ stdTTL: 600 }); // 10 minute cache

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

// Motion (optional)
const MOTION_API_KEY = process.env.MOTION_API_KEY || '';
const MOTION_WORKSPACE_ID = process.env.MOTION_WORKSPACE_ID || '';

// Clio Grow
const CLIO_GROW_BASE = process.env.CLIO_GROW_BASE || 'https://grow.clio.com';
const CLIO_GROW_INBOX_TOKEN = process.env.CLIO_GROW_INBOX_TOKEN || '';

// Internal notifications
const INTAKE_NOTIFY_TO = process.env.INTAKE_NOTIFY_TO || 'intake@jacobscounsellaw.com';
const HIGH_VALUE_NOTIFY_TO = process.env.HIGH_VALUE_NOTIFY_TO || 'drew@jacobscounsellaw.com';

// ==================== ENVIRONMENT VALIDATION ====================
function validateEnvironment() {
  const requiredVars = {
    'Email Service': MS_CLIENT_ID && MS_CLIENT_SECRET && MS_TENANT_ID && MS_GRAPH_SENDER,
    'OpenAI': OPENAI_API_KEY,
    'Mailchimp': MAILCHIMP_API_KEY && MAILCHIMP_AUDIENCE_ID,
  };
  
  console.log('🔍 Environment Check:');
  Object.entries(requiredVars).forEach(([service, isConfigured]) => {
    console.log(`   ${service}: ${isConfigured ? '✅ Configured' : '⚠️  Not configured'}`);
  });
}

// ==================== EXPRESS SETUP ====================
const app = express();
app.use(cors());
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true }));

// ==================== SECURITY MIDDLEWARE ====================

// Rate limiting
const standardLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // limit each IP to 20 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

const strictLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // limit each IP to 5 high-value operations per hour
  message: 'Too many high-value operations, please try again later.',
});

// Apply rate limiting to all routes
app.use('/api/', standardLimiter);
app.use('/estate-intake', standardLimiter);
app.use('/business-formation-intake', standardLimiter);
app.use('/brand-protection-intake', standardLimiter);
app.use('/outside-counsel', standardLimiter);
app.use('/api/generate-document', strictLimiter);

// Input sanitization middleware
function sanitizeInput(data) {
  if (!data || typeof data !== 'object') return {};
  
  const sanitized = {};
  for (const [key, value] of Object.entries(data)) {
    if (value === null || value === undefined) {
      sanitized[key] = '';
      continue;
    }
    
    if (typeof value === 'string') {
      // Basic HTML escape
      let cleanValue = value.trim();
      
      // Validate and normalize specific fields
      if (key === 'email' && cleanValue) {
        sanitized[key] = validator.isEmail(cleanValue) ? validator.normalizeEmail(cleanValue) : '';
      } else if (key === 'phone' && cleanValue) {
        // Keep phone as-is but validate format
        sanitized[key] = cleanValue.replace(/[^\d\s\-\(\)\+]/g, '');
      } else {
        // For other strings, just trim and limit length
        sanitized[key] = cleanValue.substring(0, 1000);
      }
    } else {
      sanitized[key] = value;
    }
  }
  return sanitized;
}

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 15 * 1024 * 1024, files: 15 }
});

// ==================== ERROR HANDLING CLASS ====================
class IntakeError extends Error {
  constructor(message, statusCode = 500, type = 'UNKNOWN_ERROR') {
    super(message);
    this.statusCode = statusCode;
    this.type = type;
  }
}

// ==================== AI FOLLOW-UP AUTOMATION SYSTEM ====================

// Storage for tracking follow-ups (consider replacing with database in production)
let followupDatabase = new Map();
let pendingReviews = new Map();

// Daily follow-up generation at 8 AM EST
cron.schedule('0 13 * * *', async () => {
  console.log('🤖 Running daily AI follow-ups...');
  await runDailyFollowups();
});

async function runDailyFollowups() {
  const contactsToFollowUp = getContactsNeedingFollowup();
  
  for (const contact of contactsToFollowUp) {
    try {
      const followupEmail = await generateHighConversionFollowup(contact);
      
      const reviewId = `review-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
      pendingReviews.set(reviewId, {
        contact,
        email: followupEmail,
        generated: new Date().toISOString()
      });
      
      await sendFollowupForReview(contact, followupEmail, reviewId);
      console.log(`📝 Generated follow-up for review: ${contact.email}`);
    } catch (error) {
      console.error(`❌ Follow-up generation failed for ${contact.email}:`, error);
    }
  }
}

async function generateHighConversionFollowup(contact) {
  const dayPrompts = {
    1: `Write immediate, personalized response showing you've reviewed their submission. Be helpful, demonstrate expertise.`,
    2: `Write strategic follow-up with specific insights they haven't considered. Position as strategic partner.`,
    4: `Write timeline-focused follow-up creating appropriate urgency based on their situation.`,
    10: `Write final value-add touchpoint with helpful insight and clear consultation offer.`
  };

  const conversionPrompt = `You are Drew Jacobs, former D1 athlete turned attorney helping entrepreneurs, athletes, and creators.

FOLLOW-UP DAY: ${contact.daysSinceSubmission}
CONTACT: ${contact.firstName}
SERVICE: ${contact.serviceType}
LEAD SCORE: ${contact.leadScore}/100
THEIR SUBMISSION: ${JSON.stringify(contact.formData, null, 2)}

INSTRUCTIONS: ${dayPrompts[contact.daysSinceSubmission] || 'Write helpful follow-up.'}

REQUIREMENTS:
- Reference their SPECIFIC situation 
- Demonstrate expertise through insights
- Be authentic, not sales-y
- Maximum 150 words
- End with clear call-to-action

Write as personal note from someone who genuinely wants to help.`;

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: OPENAI_MODEL,
      messages: [{ role: 'system', content: conversionPrompt }],
      temperature: 0.6,
      max_tokens: 600
    })
  });

  const result = await response.json();
  return {
    subject: generateDaySpecificSubject(contact),
    content: result.choices[0].message.content
  };
}

function generateDaySpecificSubject(contact) {
  const subjects = {
    1: `${contact.firstName}, insights on your ${contact.serviceType.replace('-', ' ')} inquiry`,
    2: `Strategic considerations for your situation`,
    4: `Timeline considerations for ${contact.firstName}`,
    10: `Final thoughts on your ${contact.serviceType.replace('-', ' ')} matter`
  };
  
  return subjects[contact.daysSinceSubmission] || `Follow-up on your legal inquiry`;
}

function getContactsNeedingFollowup() {
  const contacts = [];
  const now = Date.now();
  
  followupDatabase.forEach((data, email) => {
    const daysSince = Math.floor((now - data.submissionTime) / (1000 * 60 * 60 * 24));
    
    let schedule = [];
    if (data.leadScore >= 70) {
      schedule = [1, 2, 4, 10];
    } else if (data.leadScore >= 50) {
      schedule = [1, 3, 8];
    } else {
      schedule = [2];
    }
    
    const followupKey = `day-${daysSince}-followup`;
    
    if (schedule.includes(daysSince) && !data.followupsSent.includes(followupKey)) {
      contacts.push({
        email,
        firstName: data.firstName,
        serviceType: data.serviceType,
        leadScore: data.leadScore,
        formData: data.formData,
        daysSinceSubmission: daysSince
      });
    }
  });
  
  return contacts;
}

function trackForFollowup(email, formData, leadScore, submissionType) {
  if (!email) return;
  
  followupDatabase.set(email, {
    submissionTime: Date.now(),
    firstName: formData.firstName || formData.fullName?.split(' ')[0] || formData.contactName?.split(' ')[0] || 'there',
    serviceType: submissionType,
    leadScore: leadScore.score,
    formData: formData,
    followupsSent: [],
    mailchimpHandoffScheduled: false
  });
  
  console.log(`📊 Tracking for AI follow-up: ${email} (Score: ${leadScore.score})`);
}

async function markAsFollowedUp(email, followupType) {
  const contact = followupDatabase.get(email);
  if (!contact) return;
  
  contact.followupsSent.push(followupType);
  followupDatabase.set(email, contact);
  
  const schedule = getOptimizedFollowupSchedule(contact.leadScore);
  const completedDays = contact.followupsSent.map(f => parseInt(f.split('-')[1]));
  const sequenceComplete = schedule.every(day => completedDays.includes(day));
  
  if (sequenceComplete && !contact.mailchimpHandoffScheduled) {
    await automaticMailchimpHandoff(contact);
  }
}

function getOptimizedFollowupSchedule(leadScore) {
  if (leadScore >= 70) return [1, 2, 4, 10];
  if (leadScore >= 50) return [1, 3, 8];
  return [2];
}

async function automaticMailchimpHandoff(contact) {
  try {
    let handoffTag;
    if (contact.leadScore >= 70) {
      handoffTag = 'ai-to-premium-nurture';
    } else if (contact.leadScore >= 50) {
      handoffTag = 'ai-to-standard-nurture';
    } else {
      handoffTag = 'ai-to-newsletter-only';
    }
    
    const hashedEmail = await hashEmail(contact.email);
    const response = await fetch(
      `https://${MAILCHIMP_SERVER}.api.mailchimp.com/3.0/lists/${MAILCHIMP_AUDIENCE_ID}/members/${hashedEmail}/tags`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${MAILCHIMP_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          tags: [{ name: handoffTag, status: 'active' }]
        })
      }
    );
    
    if (response.ok) {
      contact.mailchimpHandoffScheduled = true;
      followupDatabase.set(contact.email, contact);
      console.log(`✅ ${contact.email} handed off to Mailchimp: ${handoffTag}`);
    }
  } catch (error) {
    console.error('❌ Handoff error:', error);
  }
}

async function sendFollowupForReview(contact, followupEmail, reviewId) {
  pendingReviews.set(reviewId, {
    contact,
    email: followupEmail,
    generated: new Date().toISOString()
  });

  const reviewHTML = `
<!DOCTYPE html>
<html>
<body style="font-family: Arial, sans-serif; padding: 20px;">
    <div style="max-width: 600px; margin: 0 auto;">
        
        <div style="background: #f0f9ff; padding: 20px; border-radius: 8px; margin-bottom: 24px;">
            <h2 style="color: #0369a1;">🤖 AI Follow-up Ready for Review</h2>
            <p><strong>Contact:</strong> ${contact.firstName} (${contact.email})</p>
            <p><strong>Service:</strong> ${contact.serviceType}</p>
            <p><strong>Day:</strong> ${contact.daysSinceSubmission}</p>
            <p><strong>Lead Score:</strong> ${contact.leadScore}/100</p>
        </div>
        
        <div style="background: #fffbeb; padding: 20px; border-radius: 8px; margin-bottom: 24px;">
            <h3>Proposed Email:</h3>
            <p><strong>Subject:</strong> ${followupEmail.subject}</p>
            <div style="background: white; padding: 16px; border: 1px solid #ddd; margin-top: 16px;">
                ${followupEmail.content.replace(/\n/g, '<br>')}
            </div>
        </div>
        
        <div style="text-align: center; margin: 32px 0;">
            <a href="https://estate-intake-system.onrender.com/api/approve-followup?id=${reviewId}" 
               style="background: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; margin: 8px; font-weight: 600;">
               ✅ APPROVE & SEND
            </a>
            <a href="https://estate-intake-system.onrender.com/api/reject-followup?id=${reviewId}" 
               style="background: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; margin: 8px; font-weight: 600;">
               ❌ REJECT
            </a>
        </div>
        
    </div>
</body>
</html>`;

  await sendEnhancedEmail({
    to: [HIGH_VALUE_NOTIFY_TO],
    subject: `🤖 Review Follow-up: ${contact.firstName} (Day ${contact.daysSinceSubmission})`,
    html: reviewHTML
  });
}

// Approval endpoints
app.get('/api/approve-followup', async (req, res) => {
  const { id } = req.query;
  const review = pendingReviews.get(id);
  
  if (!review) {
    return res.status(404).send('Review not found');
  }
  
  try {
    await sendEnhancedEmail({
      to: [review.contact.email],
      subject: review.email.subject,
      html: formatFollowupHTML(review.email.content, review.contact)
    });
    
    await markAsFollowedUp(review.contact.email, `day-${review.contact.daysSinceSubmission}-followup`);
    pendingReviews.delete(id);
    
    res.send(`<h2>✅ Follow-up Approved & Sent</h2><p>Email sent to: ${review.contact.email}</p>`);
  } catch (error) {
    res.status(500).send('Failed to send email');
  }
});

app.get('/api/reject-followup', async (req, res) => {
  const { id } = req.query;
  pendingReviews.delete(id);
  res.send(`<h2>❌ Follow-up Rejected</h2><p>Email was not sent.</p>`);
});

function formatFollowupHTML(content, contact) {
  const unsubscribeLink = `https://estate-intake-system.onrender.com/api/unsubscribe/${encodeURIComponent(contact.email)}`;
  
  return `
<!DOCTYPE html>
<html>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="border-left: 4px solid #ff4d00; padding-left: 20px;">
        ${content.replace(/\n/g, '<br><br>')}
    </div>
    
    <div style="background: #f0fdf4; padding: 20px; border-radius: 12px; margin: 24px 0; text-align: center;">
        <a href="https://app.usemotion.com/meet/drew-jacobs-jcllc/8xx9grm" 
           style="background: #059669; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: 600;">
           📅 Schedule Consultation
        </a>
    </div>
    
    <p style="font-size: 14px; color: #64748b; margin-top: 32px;">
        Drew Jacobs, Esq. | Jacobs Counsel LLC<br>
        <a href="${unsubscribeLink}" style="color: #94a3b8; font-size: 12px;">Unsubscribe</a>
    </p>
</body>
</html>`;
}

// Unsubscribe endpoint
app.get('/api/unsubscribe/:email', async (req, res) => {
  const email = decodeURIComponent(req.params.email);
  followupDatabase.delete(email);
  
  res.send(`
    <div style="text-align: center; font-family: Arial; padding: 40px;">
      <h2>✅ Unsubscribed Successfully</h2>
      <p>You will no longer receive follow-up emails from Jacobs Counsel.</p>
    </div>
  `);
});

// ==================== AI-POWERED LEAD INTELLIGENCE ====================

// Sophisticated lead scoring algorithm
function calculateLeadScore(formData, submissionType) {
  let score = 0;
  let scoreFactors = [];

  // Base score by submission type
  const baseScores = {
    'estate-intake': 40,
    'business-formation': 50,
    'brand-protection': 35,
    'outside-counsel': 45,
    'legal-guide-download': 30,
    'legal-strategy-builder': 55
  };

  score += baseScores[submissionType] || 30;
  scoreFactors.push(`Base ${submissionType}: +${baseScores[submissionType] || 30}`);

  // Legal Strategy Builder conversion bonus
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
    if (formData.geographicScope === 'National' || formData.geographicScope === 'International') {
      score += 25; scoreFactors.push('National/International scope: +25');
    }
    
    if (formData.protectionGoal === 'enforcement') { score += 35; scoreFactors.push('Enforcement need: +35'); }
  }

  // Outside Counsel Scoring
  if (submissionType === 'outside-counsel') {
    if (formData.budget?.includes('10K+')) { score += 40; scoreFactors.push('High budget (>$10K): +40'); }
    else if (formData.budget?.includes('5K-10K')) { score += 25; scoreFactors.push('Substantial budget: +25'); }
    
    if (formData.timeline === 'Immediately') { score += 30; scoreFactors.push('Immediate need: +30'); }
    if (formData.stage === 'growth' || formData.stage === 'scale') { score += 20; scoreFactors.push('Scaling company: +20'); }
    
    if (formData.services && formData.services.length > 3) { score += 15; scoreFactors.push('Multiple services: +15'); }
  }

  // Universal scoring factors
  if (formData.urgency?.includes('Immediate') || formData.urgency?.includes('urgent')) {
    score += 40; scoreFactors.push('Urgent timeline: +40');
  }
  
  // Geographic preference (your licensed states)
  const preferredStates = ['New York', 'New Jersey', 'Ohio', 'NY', 'NJ', 'OH'];
  if (preferredStates.some(state => 
    formData.state?.includes(state) || formData.businessState?.includes(state)
  )) {
    score += 15; scoreFactors.push('Preferred jurisdiction: +15');
  }

  // Email domain scoring (business emails = higher intent)
  const email = formData.email || '';
  if (email && !email.includes('@gmail.com') && !email.includes('@yahoo.com') && !email.includes('@hotmail.com')) {
    score += 10; scoreFactors.push('Business email: +10');
  }

  return { score: Math.min(score, 100), factors: scoreFactors };
}

// ENHANCED AI-powered intake analysis with caching
async function analyzeIntakeWithAI(formData, submissionType, leadScore) {
  if (!OPENAI_API_KEY) return { analysis: null, recommendations: null, riskFlags: [] };

  // Check cache first
  const cacheKey = `ai_analysis_${submissionType}_${leadScore.score}_${JSON.stringify(formData).substring(0, 50)}`;
  const cached = cache.get(cacheKey);
  if (cached) {
    console.log('📦 Using cached AI analysis');
    return cached;
  }

  const systemPrompt = `You are a senior legal strategist for Jacobs Counsel, a premium legal practice serving entrepreneurs, athletes, and creators in NY, NJ, and OH.

Your role: Analyze client intakes to provide strategic insights, identify opportunities, and flag potential issues.

Context:
- This is a ${submissionType} submission
- Lead score: ${leadScore.score}/100 (factors: ${leadScore.factors.join(', ')})
- Practice focus: Business formation, estate planning, brand protection, outside counsel
- Client types: High-performing entrepreneurs, professional athletes, content creators

Provide analysis in this exact format:

STRATEGIC_ANALYSIS:
[2-3 sentences about this client's situation, needs, and potential value]

RECOMMENDATIONS:
[Specific service recommendations and next steps]

RISK_FLAGS:
[Any red flags, conflicts of interest, or challenging aspects - be direct]

ENGAGEMENT_STRATEGY:
[How to approach this client - urgency level, communication style, positioning]

CLIENT_LIFETIME_VALUE:
[Estimate: Low/Medium/High/Very High with brief reasoning]`;

  const userPrompt = `Analyze this ${submissionType} intake:

${JSON.stringify(formData, null, 2)}

Lead Score Details: ${leadScore.score}/100
Scoring Factors: ${leadScore.factors.join(', ')}`;

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
        max_tokens: 1000,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ]
      })
    });

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';

    // Parse the structured response
    const sections = {
      analysis: extractSection(content, 'STRATEGIC_ANALYSIS:'),
      recommendations: extractSection(content, 'RECOMMENDATIONS:'),
      riskFlags: extractSection(content, 'RISK_FLAGS:'),
      engagementStrategy: extractSection(content, 'ENGAGEMENT_STRATEGY:'),
      lifetimeValue: extractSection(content, 'CLIENT_LIFETIME_VALUE:')
    };

    // Cache the result
    cache.set(cacheKey, sections);
    
    return sections;
  } catch (error) {
    console.error('AI analysis failed:', error);
    return { analysis: null, recommendations: null, riskFlags: [] };
  }
}

function extractSection(content, marker) {
  const start = content.indexOf(marker);
  if (start === -1) return null;
  
  const afterMarker = content.slice(start + marker.length);
  const nextMarker = afterMarker.search(/[A-Z_]+:/);
  
  return nextMarker === -1 
    ? afterMarker.trim() 
    : afterMarker.slice(0, nextMarker).trim();
}

// ==================== ADVANCED AI CAPABILITIES ====================

// Conversational AI for intake
async function createConversationalIntake(sessionId, userMessage, context) {
  if (!OPENAI_API_KEY) return { response: "AI not configured", suggestions: [] };
  
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: OPENAI_MODEL,
        messages: [
          {
            role: 'system',
            content: `You are Drew Jacobs' AI assistant at Jacobs Counsel. You're having a friendly conversation to understand their legal needs. Be warm, professional, and gather: name, email, legal issue, urgency, and budget. Drew is a former D1 athlete, licensed in NY/NJ/OH. Focus on business formation, estate planning, and brand protection.`
          },
          ...context,
          { role: 'user', content: userMessage }
        ],
        temperature: 0.7,
        max_tokens: 500
      })
    });
    
    const data = await response.json();
    return {
      response: data.choices[0].message.content,
      extractedData: await extractIntakeData(userMessage, context)
    };
  } catch (error) {
    console.error('Conversational AI error:', error);
    return { response: "I'm having trouble understanding. Could you rephrase?", suggestions: [] };
  }
}

// Extract structured data from conversation
async function extractIntakeData(message, context) {
  if (!OPENAI_API_KEY) return {};
  
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: OPENAI_MODEL,
        messages: [
          {
            role: 'system',
            content: 'Extract contact information and legal needs from this conversation. Return JSON only.'
          },
          {
            role: 'user',
            content: `Extract from: ${JSON.stringify(context)} and message: ${message}`
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.1
      })
    });
    
    const data = await response.json();
    return JSON.parse(data.choices[0].message.content);
  } catch (error) {
    console.error('Data extraction error:', error);
    return {};
  }
}

// Document generation with AI
async function generateLegalDocument(documentType, clientData) {
  if (!OPENAI_API_KEY) return { error: "AI not configured" };
  
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: OPENAI_MODEL,
        messages: [
          {
            role: 'system',
            content: 'You are an expert legal document assistant. Create professional document drafts that explicitly state they require attorney review before use.'
          },
          {
            role: 'user',
            content: `Create a ${documentType} document with these details: ${JSON.stringify(clientData)}. Include header stating: "DRAFT - ATTORNEY REVIEW REQUIRED"`
          }
        ],
        temperature: 0.2,
        max_tokens: 2000
      })
    });
    
    const data = await response.json();
    return {
      document: data.choices[0].message.content,
      documentId: `DOC-${Date.now()}`,
      type: documentType
    };
  } catch (error) {
    console.error('Document generation error:', error);
    return { error: error.message };
  }
}

// Predictive client lifetime value
async function predictClientLifetimeValue(formData, aiAnalysis) {
  if (!OPENAI_API_KEY) return { immediate: 0, year1: 0, year3: 0 };
  
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: OPENAI_MODEL,
        messages: [
          {
            role: 'system',
            content: 'Predict legal service lifetime value. Return JSON with: immediate_value, year_1_value, year_3_value, likely_services (array), referral_potential (low/medium/high)'
          },
          {
            role: 'user',
            content: `Client data: ${JSON.stringify(formData)}. Analysis: ${JSON.stringify(aiAnalysis)}`
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.3
      })
    });
    
    const data = await response.json();
    return JSON.parse(data.choices[0].message.content);
  } catch (error) {
    console.error('CLV prediction error:', error);
    return { immediate_value: 0, year_1_value: 0, year_3_value: 0 };
  }
}

// ==================== SMART MAILCHIMP FUNCTIONS ====================

function generateSmartTags(formData, leadScore, submissionType) {
  const tags = [
    `intake-${submissionType}`,
    `date-${new Date().toISOString().split('T')[0]}`
  ];
  
  // Smart score tags + Automation triggers
  if (leadScore.score >= 70) {
    tags.push('high-priority');
    tags.push('score-high');
    tags.push('trigger-vip-sequence');
    tags.push('notify-drew-immediately');
  } else if (leadScore.score >= 50) {
    tags.push('medium-priority');
    tags.push('score-medium');
    tags.push('trigger-premium-nurture');
  } else {
    tags.push('standard-priority');
    tags.push('score-low');
    tags.push('trigger-standard-nurture');
  }
  
  // BRAND PROTECTION - Automation triggers
  if (submissionType === 'brand-protection') {
    if (formData.protectionGoal?.includes('enforcement')) {
      tags.push('needs-enforcement');
      tags.push('sequence-ip-enforcement');
    }
    if (formData.protectionGoal?.includes('registration')) {
      tags.push('wants-trademark');
      tags.push('sequence-trademark-registration');
    }
    if (formData.protectionGoal?.includes('clearance')) {
      tags.push('needs-search');
      tags.push('sequence-trademark-search');
    }
    if (formData.protectionGoal?.includes('unsure')) {
      tags.push('needs-education');
      tags.push('sequence-brand-education');
    }
    
    if (formData.industry?.includes('Technology')) {
      tags.push('tech-business');
      tags.push('industry-tech');
      tags.push('sequence-tech-legal');
    }
    if (formData.urgency?.includes('Immediate')) {
      tags.push('urgent-help');
      tags.push('timeline-immediate');
      tags.push('sequence-urgent-trademark');
    }
  }
  
  // ESTATE PLANNING - Automation triggers
  if (submissionType === 'estate-intake') {
    const estate = parseFloat(formData.grossEstate?.replace(/[,$]/g, '') || '0');
    if (estate > 5000000) {
      tags.push('very-wealthy');
      tags.push('sequence-estate-tax');
    } else if (estate > 2000000) {
      tags.push('wealthy');
      tags.push('sequence-wealth-protection');
    } else if (estate > 1000000) {
      tags.push('comfortable');
      tags.push('sequence-asset-protection');
    } else {
      tags.push('modest-assets');
      tags.push('sequence-basic-planning');
    }
    
    if (formData.packagePreference?.includes('trust')) {
      tags.push('wants-trust');
      tags.push('sequence-trust-planning');
    }
    if (formData.ownBusiness === 'Yes') {
      tags.push('business-owner');
      tags.push('has-business');
      tags.push('sequence-business-succession');
    }
    if (formData.hasMinorChildren === 'Yes') {
      tags.push('has-kids');
      tags.push('family-children');
      tags.push('sequence-parents-estate');
    }
  }
  
  // BUSINESS FORMATION - Automation triggers
  if (submissionType === 'business-formation') {
    if (formData.investmentPlan?.includes('vc')) {
      tags.push('vc-startup');
      tags.push('sequence-vc-startup');
    }
    if (formData.investmentPlan?.includes('angel')) {
      tags.push('angel-startup');
      tags.push('sequence-angel-funding');
    }
    if (formData.businessType?.includes('Technology')) {
      tags.push('tech-startup');
      tags.push('industry-tech');
      tags.push('sequence-tech-legal');
    }
    if (formData.founderExperience?.includes('first')) {
      tags.push('first-time-founder');
      tags.push('sequence-first-time-founder');
    }
  }
  
  // OUTSIDE COUNSEL - Automation triggers
  if (submissionType === 'outside-counsel') {
    if (formData.budget?.includes('10K+')) {
      tags.push('high-budget');
      tags.push('sequence-enterprise-counsel');
    }
    if (formData.timeline === 'Immediately') {
      tags.push('urgent-help');
      tags.push('sequence-urgent-counsel');
    }
    if (formData.stage === 'growth') {
      tags.push('sequence-scaling-legal');
    }
    tags.push('sequence-counsel-onboarding');
  }
  
  return tags;
}

function buildSmartFields(formData, leadScore, submissionType) {
  const fields = {
    FNAME: formData.firstName || formData.fullName?.split(' ')[0] || formData.contactName?.split(' ')[0] || '',
    LNAME: formData.lastName || formData.fullName?.split(' ').slice(1).join(' ') || formData.contactName?.split(' ').slice(1).join(' ') || '',
    EMAIL: formData.email,
    PHONE: formData.phone || '',
    BUSINESS: formData.businessName || formData.companyName || '',
    LEAD_SCORE: leadScore.score,
    PRIORITY: leadScore.score >= 70 ? 'High Priority' : leadScore.score >= 50 ? 'Medium Priority' : 'Standard',
    SERVICE_TYPE: submissionType.replace('-', ' '),
    SIGNUP_DATE: new Date().toISOString().split('T')[0],
    LEAD_SOURCE: 'Website Intake Form'
  };
  
  // Type-specific fields for personalized sequences
  if (submissionType === 'brand-protection') {
    fields.BP_GOAL = formData.protectionGoal || 'trademark protection';
    fields.BP_INDUSTRY = formData.industry || 'your industry';
    fields.BP_BUSINESS = formData.businessName || 'your business';
    fields.BP_URGENT = formData.urgency?.includes('Immediate') ? 'Yes' : 'No';
    fields.BP_SCOPE = formData.geographicScope || 'Regional';
  }
  
  if (submissionType === 'estate-intake') {
    const estate = parseFloat(formData.grossEstate?.replace(/[,$]/g, '') || '0');
    fields.ESTATE_AMOUNT = estate > 0 ? '$' + estate.toLocaleString() : 'your estate';
    fields.ESTATE_LEVEL = estate > 2000000 ? 'substantial' : estate > 1000000 ? 'moderate' : 'basic';
    fields.PACKAGE_WANT = formData.packagePreference || 'estate planning';
    fields.HAS_BUSINESS = formData.ownBusiness === 'Yes' ? 'Yes' : 'No';
    fields.HAS_KIDS = formData.hasMinorChildren === 'Yes' ? 'Yes' : 'No';
    fields.MARITAL_STATUS = formData.maritalStatus || 'Not specified';
  }
  
  if (submissionType === 'business-formation') {
    fields.STARTUP_TYPE = formData.investmentPlan || 'startup';
    fields.FOUNDER_EXP = formData.founderExperience?.includes('first') ? 'first-time' : 'experienced';
    fields.BUSINESS_TYPE = formData.businessType || 'business';
    fields.FUNDING_STAGE = formData.investmentPlan || 'self-funded';
  }
  
  if (submissionType === 'outside-counsel') {
    fields.COMPANY = formData.companyName || '';
    fields.INDUSTRY = formData.industry || '';
    fields.BUDGET = formData.budget || '';
    fields.TIMELINE = formData.timeline || '';
    fields.COMPANY_STAGE = formData.stage || '';
  }
  
  return fields;
}

// ==================== MAILCHIMP AUTOMATION ====================

async function addToMailchimpWithAutomation(formData, leadScore, submissionType, aiAnalysis) {
  if (!MAILCHIMP_API_KEY || !MAILCHIMP_AUDIENCE_ID) {
    console.log('Mailchimp not configured, skipping');
    return { skipped: true };
  }

  const tags = generateSmartTags(formData, leadScore, submissionType);
  const mergeFields = buildSmartFields(formData, leadScore, submissionType);
  
  // Add CLV prediction to merge fields
  const clvPrediction = await predictClientLifetimeValue(formData, aiAnalysis);
  mergeFields.CLV_IMMEDIATE = clvPrediction.immediate_value || 0;
  mergeFields.CLV_YEAR1 = clvPrediction.year_1_value || 0;
  mergeFields.CLV_YEAR3 = clvPrediction.year_3_value || 0;

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
      const hashedEmail = await hashEmail(formData.email);
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

async function hashEmail(email) {
  const crypto = await import('crypto');
  return crypto.createHash('md5').update(email.toLowerCase()).digest('hex');
}

// ==================== MOTION INTEGRATION ====================

async function createMotionProject(formData, leadScore, submissionType, aiAnalysis) {
  if (!MOTION_API_KEY || leadScore.score < 60) {
    console.log('Motion not configured or score too low, skipping project creation');
    return { skipped: true };
  }

  const projectData = {
    name: `${submissionType.toUpperCase()}: ${formData.firstName || formData.fullName || formData.contactName || 'New Client'}`,
    description: buildProjectDescription(formData, leadScore, aiAnalysis),
    priority: leadScore.score >= 80 ? 'HIGH' : 'MEDIUM',
    workspace_id: MOTION_WORKSPACE_ID,
    due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    labels: [submissionType, `score-${Math.floor(leadScore.score/10)*10}`]
  };

  try {
    const response = await fetch('https://api.usemotion.com/v1/projects', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${MOTION_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(projectData)
    });

    return await response.json();
  } catch (error) {
    console.error('Motion project creation failed:', error);
    return { error: error.message };
  }
}

function buildProjectDescription(formData, leadScore, aiAnalysis) {
  return `
Lead Score: ${leadScore.score}/100
Contact: ${formData.email || ''} | ${formData.phone || ''}
Business: ${formData.businessName || formData.companyName || 'N/A'}
Location: ${formData.state || formData.businessState || ''}

AI Analysis: ${aiAnalysis?.analysis || 'Not available'}

Recommendations: ${aiAnalysis?.recommendations || 'Standard intake process'}

Risk Flags: ${aiAnalysis?.riskFlags || 'None identified'}

Engagement Strategy: ${aiAnalysis?.engagementStrategy || 'Standard approach'}
`.trim();
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

// IMPROVED name extraction helper
function extractNamesForClio(formData, submissionType) {
  let firstName = 'Not Provided';
  let lastName = 'Not Provided';
  
  // Try multiple sources in order of preference
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
  
  // Make absolutely sure we have valid names
  if (!firstName || firstName.length < 1) firstName = 'Unknown';
  if (!lastName || lastName.length < 1) lastName = 'Client';
  
  return { firstName, lastName };
}

async function createClioLead(formData, submissionType, leadScore) {
  if (!CLIO_GROW_INBOX_TOKEN) {
    console.log('Clio Grow not configured, skipping');
    return { skipped: true };
  }

  const { firstName, lastName } = extractNamesForClio(formData, submissionType);
  
  console.log(`✅ Clio names extracted: First="${firstName}" Last="${lastName}"`);

  // Build detailed message for Clio
  let message = `${submissionType.replace('-', ' ').toUpperCase()} Lead (Score: ${leadScore.score}/100)\n\n`;
  
  if (submissionType === 'estate-intake') {
    message += `Planning Goal: ${formData.planningGoal || 'Not specified'}\n`;
    message += `Marital Status: ${formData.maritalStatus || 'Not specified'}\n`;
    message += `Has Children: ${formData.hasChildren || 'No'}\n`;
    message += `Estate Value: ${formData.grossEstate || 'Not specified'}\n`;
    message += `Package Preference: ${formData.packagePreference || 'Not specified'}`;
  } else if (submissionType === 'business-formation') {
    message += `Business Type: ${formData.businessType || 'Not specified'}\n`;
    message += `Investment Plan: ${formData.investmentPlan || 'Not specified'}\n`;
    message += `Selected Package: ${formData.selectedPackage || 'Not specified'}`;
  } else if (submissionType === 'brand-protection') {
    message += `Business Name: ${formData.businessName || 'Not specified'}\n`;
    message += `Protection Goal: ${formData.protectionGoal || 'Not specified'}\n`;
    message += `Service Preference: ${formData.servicePreference || 'Not specified'}`;
  } else if (submissionType === 'outside-counsel') {
    message += `Company: ${formData.companyName || 'Not specified'}\n`;
    message += `Budget: ${formData.budget || 'Not specified'}\n`;
    message += `Timeline: ${formData.timeline || 'Not specified'}`;
  }

  const clioPayload = {
    inbox_lead: {
      from_first: firstName,
      from_last: lastName,
      from_email: formData.email || '',
      from_phone: formData.phone || '',
      from_message: message,
      referring_url: `https://jacobscounsellaw.com/${submissionType}`,
      from_source: `Jacobs Counsel ${submissionType.replace('-', ' ').toUpperCase()} Intake`
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
      console.error('❌ Clio Grow failed:', response.status, await response.text());
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
  const isConversion = formData.conversionSource === 'legal-strategy-builder';
  const urgentFlag = formData.urgency?.includes('Immediate') || aiAnalysis?.riskFlags?.includes('urgent');

  return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>${isHighValue ? '🔥 HIGH VALUE' : ''}${isConversion ? ' 🎯 ASSESSMENT CONVERSION' : ''} ${urgentFlag ? '⚡ URGENT' : ''} New ${submissionType.toUpperCase()} Intake</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, Arial, sans-serif; line-height: 1.6; color: #1a1a1a; background-color: #f5f5f5; margin: 0; padding: 20px;">
    <div style="max-width: 700px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; padding: 20px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
        
        ${isConversion ? `
        <div style="background: linear-gradient(135deg, #22c55e, #16a34a); color: #ffffff; padding: 16px; border-radius: 12px; margin-bottom: 24px; text-align: center;">
            <h2 style="margin: 0; font-size: 24px; color: #ffffff;">🎯 ASSESSMENT CONVERSION SUCCESS!</h2>
            <p style="margin: 8px 0 0; font-size: 16px; color: #ffffff;">This lead came from the Legal Strategy Builder</p>
        </div>
        ` : ''}
        
        ${isHighValue ? `
        <div style="background: linear-gradient(135deg, #dc2626, #b91c1c); color: #ffffff; padding: 16px; border-radius: 12px; margin-bottom: 24px; text-align: center;">
            <h2 style="margin: 0; font-size: 24px; color: #ffffff;">🔥 HIGH VALUE LEAD ALERT</h2>
            <p style="margin: 8px 0 0; font-size: 18px; color: #ffffff;">Score: ${leadScore.score}/100</p>
        </div>
        ` : ''}
        
        <h1 style="color: #ff4d00; margin: 0 0 24px; font-size: 28px;">New ${submissionType.replace('-', ' ').toUpperCase()} Intake</h1>
        
        <div style="background: #f8fafc; padding: 24px; border-radius: 12px; margin: 24px 0; border-left: 6px solid #ff4d00;">
            <h3 style="margin: 0 0 16px; color: #0b1f1e; font-size: 18px;">Contact Information</h3>
            <p style="color: #4a4a4a; margin: 8px 0;"><strong style="color: #1a1a1a;">Name:</strong> ${formData.firstName || formData.fullName || formData.contactName || ''} ${formData.lastName || ''}</p>
            <p style="color: #4a4a4a; margin: 8px 0;"><strong style="color: #1a1a1a;">Email:</strong> <a href="mailto:${formData.email}" style="color: #ff4d00;">${formData.email}</a></p>
            <p style="color: #4a4a4a; margin: 8px 0;"><strong style="color: #1a1a1a;">Phone:</strong> ${formData.phone || 'Not provided'}</p>
            <p style="color: #4a4a4a; margin: 8px 0;"><strong style="color: #1a1a1a;">Business:</strong> ${formData.businessName || formData.companyName || 'Not specified'}</p>
            <p style="color: #4a4a4a; margin: 8px 0;"><strong style="color: #1a1a1a;">Location:</strong> ${formData.state || formData.businessState || 'Not specified'}</p>
        </div>

        <div style="background: #f0fdf4; padding: 24px; border-radius: 12px; margin: 24px 0; border-left: 6px solid #059669;">
            <h3 style="margin: 0 0 16px; color: #166534; font-size: 18px;">Lead Intelligence</h3>
            <p style="color: #4a4a4a; margin: 8px 0;"><strong style="color: #166534;">Score:</strong> ${leadScore.score}/100</p>
            <p style="color: #4a4a4a; margin: 8px 0;"><strong style="color: #166534;">Scoring Factors:</strong></p>
            <ul style="margin: 8px 0; padding-left: 20px; color: #4a4a4a;">
                ${leadScore.factors.map(factor => `<li style="margin: 4px 0; color: #4a4a4a;">${factor}</li>`).join('')}
            </ul>
        </div>

        ${aiAnalysis?.analysis ? `
        <div style="background: #fffbeb; padding: 24px; border-radius: 12px; margin: 24px 0; border-left: 6px solid #d97706;">
            <h3 style="margin: 0 0 16px; color: #92400e; font-size: 18px;">AI Strategic Analysis</h3>
            <p style="color: #4a4a4a; margin: 8px 0;"><strong style="color: #92400e;">Situation:</strong> ${aiAnalysis.analysis}</p>
            <p style="color: #4a4a4a; margin: 8px 0;"><strong style="color: #92400e;">Recommendations:</strong> ${aiAnalysis.recommendations}</p>
            <p style="color: #4a4a4a; margin: 8px 0;"><strong style="color: #92400e;">Engagement Strategy:</strong> ${aiAnalysis.engagementStrategy}</p>
            <p style="color: #4a4a4a; margin: 8px 0;"><strong style="color: #92400e;">Lifetime Value:</strong> ${aiAnalysis.lifetimeValue}</p>
            ${aiAnalysis.riskFlags ? `<p style="color: #4a4a4a; margin: 8px 0;"><strong style="color: #dc2626;">⚠️ Risk Flags:</strong> ${aiAnalysis.riskFlags}</p>` : ''}
        </div>
        ` : ''}

        <div style="background: #e0f2fe; padding: 24px; border-radius: 12px; margin: 24px 0; text-align: center;">
           <h3 style="margin: 0 0 16px; color: #0369a1; font-size: 18px;">Recommended Actions</h3>
           ${isHighValue ? `
           <a href="https://app.usemotion.com/meet/drew-jacobs-jcllc/8xx9grm" 
              style="background: #dc2626; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 8px; display: inline-block; margin: 8px; font-weight: 600;">
              🔥 Priority Consultation
           </a>
           ` : `
           <a href="https://app.usemotion.com/meet/drew-jacobs-jcllc/8xx9grm" 
              style="background: #059669; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 8px; display: inline-block; margin: 8px; font-weight: 600;">
              📅 Schedule Consultation
           </a>
           `}
           <a href="mailto:${formData.email}?subject=Re: Your ${submissionType} inquiry - Jacobs Counsel" 
              style="background: #0369a1; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 8px; display: inline-block; margin: 8px; font-weight: 600;">
              📧 Direct Response
           </a>
       </div>

       <details style="margin: 24px 0;">
           <summary style="cursor: pointer; font-weight: 600; color: #64748b;">Full Form Data</summary>
           <pre style="background: #f8fafc; padding: 16px; border-radius: 8px; overflow-x: auto; font-size: 12px; margin: 16px 0; color: #4a4a4a;">${JSON.stringify(formData, null, 2)}</pre>
       </details>

       <hr style="margin: 32px 0; border: none; border-top: 1px solid #e2e8f0;">
       <p style="font-size: 14px; color: #64748b; margin: 0;">
           Submission ID: ${submissionId} | Generated: ${new Date().toLocaleString()}
       </p>
   </div>
</body>
</html>
`;
}

function generateClientConfirmationEmail(formData, price, submissionType, leadScore) {
 // More robust name extraction
 let clientName = '';
 
 if (submissionType === 'estate-intake') {
   clientName = formData.firstName || 'there';
 } else if (submissionType === 'business-formation') {
   clientName = formData.firstName || 
                formData.founderName?.split(' ')[0] || 
                'there';
 } else if (submissionType === 'brand-protection') {
   clientName = formData.fullName?.split(' ')[0] || 
                formData.firstName || 
                'there';
 } else if (submissionType === 'outside-counsel') {
   clientName = formData.contactName?.split(' ')[0] || 
                formData.firstName || 
                'there';
 } else {
   clientName = formData.firstName || 
                formData.fullName?.split(' ')[0] || 
                formData.contactName?.split(' ')[0] || 
                formData.founderName?.split(' ')[0] ||
                'there';
 }
 
 if (!formData.email) {
   console.error('❌ No email provided for client confirmation');
   return null;
 }
 
 // Ensure price is defined
 const displayPrice = price || null;
 
 console.log(`📧 Generating email for ${clientName} at ${formData.email}`);
 
 return `
<!DOCTYPE html>
<html>
<head>
   <meta charset="utf-8">
   <meta name="viewport" content="width=device-width, initial-scale=1.0">
   <title>Your ${submissionType.replace('-', ' ')} Intake - Next Steps</title>
</head>
<body style="font-family: 'SF Pro Display', -apple-system, BlinkMacSystemFont, Arial, sans-serif; line-height: 1.6; color: #1a1a1a; margin: 0; padding: 0; background-color: #f5f5f5;">
   <div style="max-width: 600px; margin: 20px auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
       
       <!-- Header with gradient -->
       <div style="background: linear-gradient(90deg, #ff4d00, #0b1f1e); padding: 40px 30px; text-align: center;">
           <h1 style="color: #ffffff; font-size: 28px; margin: 0 0 8px; font-weight: 700;">Thank you for choosing Jacobs Counsel</h1>
           <p style="color: #ffffff; font-size: 16px; margin: 0; opacity: 0.95;">Your legal journey begins here</p>
       </div>
       
       <!-- Main content with dark text on white background -->
       <div style="padding: 40px 30px; background-color: #ffffff;">
           <p style="font-size: 18px; margin: 0 0 8px; color: #1a1a1a;">Hi <strong style="color: #ff4d00;">${clientName}</strong>,</p>
           
           <p style="font-size: 16px; margin: 20px 0; color: #4a4a4a; line-height: 1.7;">
               We've received your ${submissionType.replace('-', ' ')} intake and will review it within <strong style="color: #1a1a1a;">1 business day</strong>. 
               Our AI analysis has identified key opportunities for your situation.
           </p>
           
           ${leadScore >= 70 ? `
           <div style="background: linear-gradient(135deg, #fff5f5, #ffe0e0); border: 2px solid #ff4d00; padding: 20px; border-radius: 12px; margin: 24px 0;">
               <h3 style="color: #d32f2f; margin: 0 0 12px; font-size: 18px;">🔥 Priority Review Status</h3>
               <p style="margin: 0; color: #6a1b1b; font-size: 15px; line-height: 1.6;">
                   Based on your responses, we've marked your intake for <strong>priority review</strong>. 
                   You can expect to hear from us within a few hours.
               </p>
           </div>
           ` : ''}
           
           ${displayPrice ? `
           <div style="background: linear-gradient(135deg, #f0fdf4, #dcfce7); padding: 24px; border-radius: 12px; margin: 24px 0; border: 2px solid #22c55e; text-align: center;">
               <p style="margin: 0; font-size: 20px; font-weight: 700; color: #14532d;">
                   Estimated Investment: <span style="color: #059669;">${typeof displayPrice === 'number' ? '$' + displayPrice.toLocaleString() : displayPrice}</span>
               </p>
               <p style="margin: 12px 0 0; font-size: 14px; color: #166534;">
                   Final pricing will be confirmed after attorney review
               </p>
           </div>
           ` : ''}
           
           <!-- CTA Section with proper contrast -->
           <div style="background: linear-gradient(135deg, #e3f2fd, #bbdefb); padding: 32px; border-radius: 12px; margin: 32px 0; text-align: center; border: 2px solid #0369a1;">
               <p style="margin: 0 0 20px; font-weight: 700; color: #0c4a6e; font-size: 18px;">
                   Ready to schedule your consultation?
               </p>
               <a href="https://app.usemotion.com/meet/drew-jacobs-jcllc/8xx9grm" 
                  style="background: linear-gradient(135deg, #ff4d00, #cc3d00); color: #ffffff; padding: 16px 36px; text-decoration: none; border-radius: 10px; display: inline-block; font-weight: 700; font-size: 17px; box-shadow: 0 4px 15px rgba(255, 77, 0, 0.3); transition: all 0.3s;">
                  📅 Book Your Consultation Now
               </a>
               <p style="margin: 20px 0 0; font-size: 14px; color: #0c4a6e;">
                   Or call us directly at <strong>(555) 123-4567</strong>
               </p>
           </div>
           
           <!-- Next steps section -->
           <div style="background-color: #f8fafc; padding: 24px; border-radius: 12px; margin: 24px 0; border-left: 4px solid #ff4d00;">
               <h3 style="color: #1a1a1a; margin: 0 0 16px; font-size: 18px;">What happens next?</h3>
               <ol style="margin: 0; padding-left: 20px; color: #4a4a4a;">
                   <li style="margin: 8px 0; line-height: 1.6;">Our team reviews your intake within 1 business day</li>
                   <li style="margin: 8px 0; line-height: 1.6;">We'll send you a detailed strategy outline</li>
                   <li style="margin: 8px 0; line-height: 1.6;">Schedule your consultation when you're ready</li>
                   <li style="margin: 8px 0; line-height: 1.6;">Begin your legal journey with confidence</li>
               </ol>
           </div>
           
           <p style="font-size: 16px; margin: 28px 0 20px; color: #4a4a4a;">
               Questions? Simply <a href="mailto:${INTAKE_NOTIFY_TO}" style="color: #ff4d00; text-decoration: none; font-weight: 600;">reply to this email</a> 
               or call us directly.
           </p>
           
           <p style="font-size: 16px; margin: 20px 0; color: #4a4a4a;">
               Best regards,<br>
               <strong style="color: #0b1f1e; font-size: 17px;">The Jacobs Counsel Team</strong>
           </p>
       </div>
       
       <!-- Footer with proper contrast -->
       <div style="background: #f8fafc; padding: 24px 30px; border-top: 1px solid #e2e8f0;">
           <p style="margin: 0 0 8px; font-size: 13px; color: #6b7280; text-align: center; line-height: 1.5;">
               <strong style="color: #4a4a4a;">Jacobs Counsel LLC</strong><br>
               Your trusted legal partner in NY, NJ, and OH
           </p>
           <p style="margin: 8px 0 0; font-size: 12px; color: #9ca3af; text-align: center; line-height: 1.5;">
               This email was sent because you completed an intake at jacobscounsellaw.com.<br>
               Your information is confidential and this does not create an attorney-client relationship.
           </p>
       </div>
   </div>
</body>
</html>
`;
}

// ==================== PERFORMANCE-OPTIMIZED INTAKE PROCESSING ====================

// Helper function for parallel operations
async function processIntakeOperations(operations) {
 const results = await Promise.allSettled(operations);
 
 results.forEach((result, index) => {
   if (result.status === 'rejected') {
     console.error(`❌ Operation ${index} failed:`, result.reason);
   }
 });
 
 return results;
}

// ==================== ROUTES ====================

// Health check endpoint
app.get('/health', async (req, res) => {
 const checks = {
   status: 'operational',
   timestamp: new Date().toISOString(),
   services: {
     openai: OPENAI_API_KEY ? 'configured' : 'not configured',
     mailchimp: MAILCHIMP_API_KEY ? 'configured' : 'not configured',
     clio: CLIO_GROW_INBOX_TOKEN ? 'configured' : 'not configured',
     motion: MOTION_API_KEY ? 'configured' : 'not configured',
     email: MS_CLIENT_ID ? 'configured' : 'not configured'
   }
 };
 
 res.json(checks);
});

app.get('/', (req, res) => {
 res.json({ 
   ok: true, 
   service: 'jacobs-counsel-unified-intake',
   version: '3.1.0-ENHANCED',
   endpoints: ['/estate-intake', '/business-formation-intake', '/brand-protection-intake', '/outside-counsel', '/add-subscriber', '/legal-guide', '/api/chat-intake', '/api/generate-document', '/api/predict-clv', '/health'],
   features: ['AI Analysis', 'Lead Scoring', 'Smart Mailchimp Automation', 'Motion Integration', 'Clio Grow Integration', 'Conversational AI', 'Document Generation', 'CLV Prediction', 'Performance Caching', 'Input Sanitization', 'Rate Limiting']
 });
});

// Estate Planning Intake - PERFORMANCE OPTIMIZED
app.post('/estate-intake', upload.array('document'), async (req, res) => {
 try {
   const formData = sanitizeInput(req.body || {});
   const files = req.files || [];
   const submissionId = formData.submissionId || `estate-${Date.now()}`;
   const submissionType = 'estate-intake';

   console.log(`📥 New ${submissionType} submission:`, formData.email);

   // Detect assessment conversion
   const fromAssessment = formData.fromAssessment === 'true' || 
                         formData.source === 'legal-strategy-builder-conversion' ||
                         req.get('Referer')?.includes('legal-strategy-builder');
   
   if (fromAssessment) {
     console.log('🎯 ASSESSMENT CONVERSION: Estate Planning');
     formData.conversionSource = 'legal-strategy-builder';
     formData.conversionType = 'assessment-to-estate';
   }

   const leadScore = calculateLeadScore(formData, submissionType);
   trackForFollowup(formData.email, formData, leadScore, submissionType);
   console.log(`📊 Lead score: ${leadScore.score}/100`);

   const aiAnalysis = await analyzeIntakeWithAI(formData, submissionType, leadScore);
   console.log(`🤖 AI analysis completed`);

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

   // PARALLEL PROCESSING - All operations at once
   const operations = [];

   // Internal alert email
   const alertRecipients = leadScore.score >= 70 
     ? [INTAKE_NOTIFY_TO, HIGH_VALUE_NOTIFY_TO] 
     : [INTAKE_NOTIFY_TO];

   const internalSubject = `${leadScore.score >= 70 ? '🔥 HIGH VALUE' : ''} Estate Intake — ${formData.firstName || ''} ${formData.lastName || ''} (Score: ${leadScore.score})`;
   
   operations.push(
     sendEnhancedEmail({
       to: alertRecipients,
       subject: internalSubject,
       html: generateInternalAlert(formData, leadScore, submissionType, aiAnalysis, submissionId),
       priority: leadScore.score >= 70 ? 'high' : 'normal',
       attachments
     }).catch(e => console.error('❌ Internal email failed:', e.message))
   );

   // Add to Smart Mailchimp
   operations.push(
     addToMailchimpWithAutomation(formData, leadScore, submissionType, aiAnalysis)
       .catch(e => console.error('❌ Mailchimp failed:', e.message))
   );

   // Create Motion project for high-value leads
   operations.push(
     createMotionProject(formData, leadScore, submissionType, aiAnalysis)
       .catch(e => console.error('❌ Motion integration failed:', e.message))
   );

   // Push to Clio Grow
   operations.push(
     createClioLead(formData, submissionType, leadScore)
       .catch(e => console.error('❌ Clio Grow failed:', e.message))
   );

   // Client confirmation email
   if (formData.email) {
     const clientEmailHtml = generateClientConfirmationEmail(formData, price, submissionType, leadScore.score);
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

   // Execute all operations in parallel
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

// Business Formation Intake - PERFORMANCE OPTIMIZED
app.post('/business-formation-intake', upload.array('documents'), async (req, res) => {
 try {
   const formData = sanitizeInput(req.body || {});
   const files = req.files || [];
   const submissionId = formData.submissionId || `business-${Date.now()}`;
   const submissionType = 'business-formation';

   console.log(`📥 New ${submissionType} submission:`, formData.email);

   // Detect assessment conversion
   const fromAssessment = formData.fromAssessment === 'true' || 
                         formData.source === 'legal-strategy-builder-conversion' ||
                         req.get('Referer')?.includes('legal-strategy-builder');
   
   if (fromAssessment) {
     console.log('🎯 ASSESSMENT CONVERSION: Business Formation');
     formData.conversionSource = 'legal-strategy-builder';
     formData.conversionType = 'assessment-to-business';
   }

   const leadScore = calculateLeadScore(formData, submissionType);
   trackForFollowup(formData.email, formData, leadScore, submissionType);
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
   let price = null;
   const packageType = (formData.selectedPackage || '').toLowerCase();
   if (packageType.includes('bronze')) price = 2995;
   else if (packageType.includes('silver')) price = 4995;
   else if (packageType.includes('gold')) price = 7995;

   // PARALLEL PROCESSING
   const operations = [];
   
   const alertRecipients = leadScore.score >= 70 
     ? [INTAKE_NOTIFY_TO, HIGH_VALUE_NOTIFY_TO] 
     : [INTAKE_NOTIFY_TO];

   const internalSubject = `${leadScore.score >= 70 ? '🔥 HIGH VALUE' : ''} Business Formation — ${formData.founderName || formData.businessName || 'New Lead'} (Score: ${leadScore.score})`;
   
   operations.push(
     sendEnhancedEmail({
       to: alertRecipients,
       subject: internalSubject,
       html: generateInternalAlert(formData, leadScore, submissionType, aiAnalysis, submissionId),
       priority: leadScore.score >= 70 ? 'high' : 'normal',
       attachments
     }).catch(e => console.error('❌ Internal email failed:', e.message))
   );

   operations.push(
     addToMailchimpWithAutomation(formData, leadScore, submissionType, aiAnalysis)
       .catch(e => console.error('❌ Mailchimp failed:', e.message))
   );

   operations.push(
     createMotionProject(formData, leadScore, submissionType, aiAnalysis)
       .catch(e => console.error('❌ Motion integration failed:', e.message))
   );

   operations.push(
     createClioLead(formData, submissionType, leadScore)
       .catch(e => console.error('❌ Clio Grow failed:', e.message))
   );

   if (formData.email) {
     const clientEmailHtml = generateClientConfirmationEmail(formData, price, submissionType, leadScore.score);
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

// Brand Protection Intake - PERFORMANCE OPTIMIZED
app.post('/brand-protection-intake', upload.array('brandDocument'), async (req, res) => {
 try {
   const formData = sanitizeInput(req.body || {});
   const files = req.files || [];
   const submissionId = formData.submissionId || `brand-${Date.now()}`;
   const submissionType = 'brand-protection';

   console.log(`📥 New ${submissionType} submission:`, formData.email);

   // Detect assessment conversion
   const fromAssessment = formData.fromAssessment === 'true' || 
                         formData.source === 'legal-strategy-builder-conversion' ||
                         req.get('Referer')?.includes('legal-strategy-builder');
   
   if (fromAssessment) {
     console.log('🎯 ASSESSMENT CONVERSION: Brand Protection');
     formData.conversionSource = 'legal-strategy-builder';
     formData.conversionType = 'assessment-to-brand';
   }

   const leadScore = calculateLeadScore(formData, submissionType);
   trackForFollowup(formData.email, formData, leadScore, submissionType);
   const aiAnalysis = await analyzeIntakeWithAI(formData, submissionType, leadScore);

   const attachments = files
     .filter(f => f?.buffer && f.size <= 5 * 1024 * 1024)
     .slice(0, 10)
     .map(f => ({
       filename: f.originalname,
       contentType: f.mimetype,
       content: f.buffer
     }));

   // Calculate pricing estimate
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
   } else if (service.includes('enforcement')) {
     priceEstimate = 'Custom Quote';
   }

   // PARALLEL PROCESSING
   const operations = [];
   
   const alertRecipients = leadScore.score >= 70 
     ? [INTAKE_NOTIFY_TO, HIGH_VALUE_NOTIFY_TO] 
     : [INTAKE_NOTIFY_TO];

   const internalSubject = `${leadScore.score >= 70 ? '🔥 HIGH VALUE' : ''} Brand Protection — ${formData.businessName || formData.fullName || 'New Lead'} (Score: ${leadScore.score})`;
   
   operations.push(
     sendEnhancedEmail({
       to: alertRecipients,
       subject: internalSubject,
       html: generateInternalAlert(formData, leadScore, submissionType, aiAnalysis, submissionId),
       priority: leadScore.score >= 70 ? 'high' : 'normal',
       attachments
     }).catch(e => console.error('❌ Internal email failed:', e.message))
   );

   operations.push(
     addToMailchimpWithAutomation(formData, leadScore, submissionType, aiAnalysis)
       .catch(e => console.error('❌ Mailchimp failed:', e.message))
   );

   operations.push(
     createMotionProject(formData, leadScore, submissionType, aiAnalysis)
       .catch(e => console.error('❌ Motion integration failed:', e.message))
   );

   operations.push(
     createClioLead(formData, submissionType, leadScore)
       .catch(e => console.error('❌ Clio Grow failed:', e.message))
   );

   if (formData.email) {
     const clientEmailHtml = generateClientConfirmationEmail(formData, priceEstimate, submissionType, leadScore.score);
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

// Outside Counsel Intake - PERFORMANCE OPTIMIZED
app.post('/outside-counsel', async (req, res) => {
 try {
   const formData = sanitizeInput(req.body);
   const submissionId = formData.submissionId || `OC-${Date.now()}`;
   const submissionType = 'outside-counsel';

   console.log(`📥 New ${submissionType} submission:`, formData.email);

   // Detect assessment conversion
   const fromAssessment = formData.fromAssessment === 'true' || 
                         formData.source === 'legal-strategy-builder-conversion' ||
                         req.get('Referer')?.includes('legal-strategy-builder');
   
   if (fromAssessment) {
     console.log('🎯 ASSESSMENT CONVERSION: Outside Counsel');
     formData.conversionSource = 'legal-strategy-builder';
     formData.conversionType = 'assessment-to-counsel';
   }

   const leadScore = calculateLeadScore(formData, submissionType);
   trackForFollowup(formData.email, formData, leadScore, submissionType);
   const aiAnalysis = await analyzeIntakeWithAI(formData, submissionType, leadScore);

   // PARALLEL PROCESSING
   const operations = [];
   
   const alertRecipients = leadScore.score >= 70 
     ? [INTAKE_NOTIFY_TO, HIGH_VALUE_NOTIFY_TO] 
     : [INTAKE_NOTIFY_TO];

   const internalSubject = `${leadScore.score >= 70 ? '🔥 HIGH VALUE' : ''} Outside Counsel — ${formData.companyName || 'New Lead'} (Score: ${leadScore.score})`;
   
   operations.push(
     sendEnhancedEmail({
       to: alertRecipients,
       subject: internalSubject,
       html: generateInternalAlert(formData, leadScore, submissionType, aiAnalysis, submissionId),
       priority: leadScore.score >= 70 ? 'high' : 'normal'
     }).catch(e => console.error('❌ Internal email failed:', e.message))
   );

   operations.push(
     addToMailchimpWithAutomation(formData, leadScore, submissionType, aiAnalysis)
       .catch(e => console.error('❌ Mailchimp failed:', e.message))
   );

   operations.push(
     createMotionProject(formData, leadScore, submissionType, aiAnalysis)
       .catch(e => console.error('❌ Motion integration failed:', e.message))
   );

   operations.push(
     createClioLead(formData, submissionType, leadScore)
       .catch(e => console.error('❌ Clio Grow failed:', e.message))
   );

   if (formData.email) {
     const clientEmailHtml = generateClientConfirmationEmail(formData, null, submissionType, leadScore.score);
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
   console.error('💥 Outside counsel intake error:', error);
   res.status(500).json({
     success: false,
     error: 'Failed to process outside counsel request'
   });
 }
});

// Legal Strategy Builder Endpoint
app.post('/legal-strategy-builder', async (req, res) => {
 try {
   const formData = sanitizeInput(req.body);
   const submissionId = `strategy-${Date.now()}`;
   const submissionType = 'legal-strategy-builder';

   console.log(`📥 New ${submissionType} submission:`, formData.email);

   // Calculate lead score based on assessment answers
   const leadScore = calculateLeadScore(formData, submissionType);
   trackForFollowup(formData.email, formData, leadScore, submissionType);
   console.log(`📊 Lead score: ${leadScore.score}/100`);

   // AI Analysis
   const aiAnalysis = await analyzeIntakeWithAI(formData, submissionType, leadScore);

   // PARALLEL PROCESSING
   const operations = [];
   
   const alertRecipients = leadScore.score >= 70 
     ? [INTAKE_NOTIFY_TO, HIGH_VALUE_NOTIFY_TO] 
     : [INTAKE_NOTIFY_TO];

   const internalSubject = `${leadScore.score >= 70 ? '🔥 HIGH VALUE' : ''} Legal Strategy Assessment — ${formData.email} (Score: ${leadScore.score})`;
   
   operations.push(
     sendEnhancedEmail({
       to: alertRecipients,
       subject: internalSubject,
       html: generateInternalAlert(formData, leadScore, submissionType, aiAnalysis, submissionId),
       priority: leadScore.score >= 70 ? 'high' : 'normal'
     }).catch(e => console.error('❌ Internal email failed:', e.message))
   );

   operations.push(
     addToMailchimpWithAutomation(formData, leadScore, submissionType, aiAnalysis)
       .catch(e => console.error('❌ Mailchimp failed:', e.message))
   );

   operations.push(
     createMotionProject(formData, leadScore, submissionType, aiAnalysis)
       .catch(e => console.error('❌ Motion integration failed:', e.message))
   );

   operations.push(
     createClioLead(formData, submissionType, leadScore)
       .catch(e => console.error('❌ Clio Grow failed:', e.message))
   );

   if (formData.email) {
     const clientEmailHtml = generateClientConfirmationEmail(formData, null, submissionType, leadScore.score);
     if (clientEmailHtml) {
       operations.push(
         sendEnhancedEmail({
           to: [formData.email],
           subject: `Jacobs Counsel — Your Legal Strategy Assessment Results`,
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
   console.error('💥 Legal Strategy Builder error:', error);
   res.status(500).json({ ok: false, error: error.message });
 }
});

// Lead Magnet Subscriber Endpoint
app.post('/add-subscriber', async (req, res) => {
 try {
   const { email, source, tags = [], merge_fields = {} } = req.body;
   
   if (!email || !MAILCHIMP_API_KEY || !MAILCHIMP_AUDIENCE_ID) {
     return res.status(400).json({ ok: false, error: 'Missing required data' });
   }
   
   console.log(`📧 New subscriber: ${email} from ${source}`);
   
   const memberData = {
     email_address: email,
     status: 'subscribed',
     tags: [...tags, source, `date-${new Date().toISOString().split('T')[0]}`],
     merge_fields: {
       LEAD_SOURCE: source,
       SIGNUP_DATE: new Date().toISOString(),
       ...merge_fields
     }
   };
   
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
           tags: tags.map(tag => ({ name: tag, status: 'active' }))
         })
       }
     );
     
     console.log('✅ Updated existing subscriber tags');
   } else {
     console.log('✅ New subscriber added to Mailchimp');
   }
   
   res.json({ ok: true, message: 'Subscriber added successfully' });
   
 } catch (error) {
   console.error('❌ Mailchimp subscription error:', error);
   res.status(500).json({ ok: false, error: 'Subscription failed' });
 }
});

// Legal Guide Download Endpoint
app.post('/legal-guide', upload.none(), async (req, res) => {
 try {
   console.log('📖 Legal guide request:', req.body);

   const { 
     email, 
     firstName, 
     source = 'legal-guide-download', 
     referringUrl,
     guideUrl,
     guideType,
     guideName
   } = req.body;
       
   if (!email) {
     return res.status(400).json({ success: false, error: 'Email required' });
   }
   
   const submissionId = `guide-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
   const name = firstName || email.split('@')[0];
   
   const pdfUrl = guideUrl || process.env.LEGAL_GUIDE_PDF_URL;
   
   // Map guide types to their PDF URLs if guideUrl wasn't provided
   const guideUrls = {
     'complete-playbook': 'https://www.jacobscounsellaw.com/s/Protect-Your-Dreams-Maximize-Your-Impact-and-Grow-Smart.pdf',
     'vc-formation': 'https://www.jacobscounsellaw.com/s/The-VC-Ready-Business-Formation-Blueprint.pdf',
     'estate-planning': 'https://www.jacobscounsellaw.com/s/Estate-Planning-for-High-Achievers.pdf',
     'brand-protection': 'https://www.jacobscounsellaw.com/s/Emergency-Brand-Protection-Playbook.pdf'
   };
   
   // If no guideUrl but we have guideType, use the mapping
   const finalPdfUrl = pdfUrl || (guideType ? guideUrls[guideType] : null);
   
   if (!finalPdfUrl) {
     console.error('❌ No PDF URL available for guide type:', guideType);
     return res.status(500).json({ success: false, error: 'PDF not configured' });
   }
   
   console.log('📄 Sending guide:', guideName || 'Legal Strategy Guide');
   console.log('📎 PDF URL:', finalPdfUrl);

   const clientSubject = guideName ? `Your ${guideName} - Jacobs Counsel` : 'Your Free Legal Strategy Guide - Jacobs Counsel';
   const clientHtml = `
<!DOCTYPE html>
<html>
<head>
   <meta charset="UTF-8">
   <meta name="viewport" content="width=device-width, initial-scale=1.0">
   <title>Your Legal Strategy Guide</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8fafc;">
   <div style="max-width: 600px; margin: 0 auto; background-color: white; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
       
       <div style="background: linear-gradient(135deg, #ff4d00, #0b1f1e); padding: 40px 30px; text-align: center;">
           <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 600;">Your Legal Strategy Guide</h1>
           <p style="color: #ffffff; margin: 10px 0 0 0; font-size: 16px; opacity: 0.95;">Protect Your Dreams, Maximize Your Impact, Grow Smart</p>
       </div>
       
       <div style="padding: 40px 30px;">
           <h2 style="color: #0b1f1e; margin: 0 0 20px 0; font-size: 22px;">Hi ${name}!</h2>
           
           <p style="color: #475569; line-height: 1.6; margin-bottom: 30px; font-size: 16px;">
               Thank you for downloading our <strong>Legal Strategy Guide</strong>! This comprehensive resource will help you protect what you build and scale something lasting.
           </p>
           
           <div style="text-align: center; margin: 40px 0; padding: 30px 20px; background: #f8fafc; border-radius: 12px; border: 3px solid #ff4d00;">
               <h3 style="color: #0b1f1e; margin: 0 0 20px 0; font-size: 20px; font-weight: 700;">🎯 YOUR GUIDE IS READY</h3>
               <a href="${finalPdfUrl}" style="background: linear-gradient(135deg, #ff4d00, #0b1f1e); color: #ffffff; padding: 20px 40px; border-radius: 12px; text-decoration: none; font-weight: 700; font-size: 18px; display: inline-block; box-shadow: 0 6px 20px rgba(255, 77, 0, 0.3); text-transform: uppercase; letter-spacing: 1px;">
                  📥 DOWNLOAD YOUR GUIDE NOW
              </a>
              <p style="margin: 15px 0 0 0; font-size: 14px; color: #64748b;">Click the button above to download your free PDF guide</p>
          </div>
          
          <div style="background: #f1f5f9; padding: 30px; border-radius: 12px; border-left: 4px solid #ff4d00; margin: 30px 0; text-align: center;">
              <h3 style="color: #0b1f1e; margin: 0 0 15px 0; font-size: 20px; font-weight: 700;">Ready to Take Action?</h3>
              <p style="color: #475569; margin: 0 0 20px 0; line-height: 1.5; font-size: 16px;">
                  This guide gives you the framework. Now let's build your specific legal strategy.
              </p>
              <a href="https://app.usemotion.com/meet/drew-jacobs-jcllc/8xx9grm" style="background: #ff4d00; color: #ffffff; padding: 16px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; display: inline-block; font-size: 16px; box-shadow: 0 4px 12px rgba(255, 77, 0, 0.3);">
                  📅 Book Your Free Legal Edge Call
              </a>
          </div>
          
          <p style="color: #64748b; font-size: 14px; line-height: 1.5; margin: 30px 0 0 0;">
              Best regards,<br>
              <strong style="color: #0b1f1e;">Drew Jacobs, Esq.</strong><br>
              Jacobs Counsel LLC<br>
              <a href="mailto:drew@jacobscounsellaw.com" style="color: #ff4d00; text-decoration: none;">drew@jacobscounsellaw.com</a>
          </p>
      </div>
      
      <div style="background: #f8fafc; padding: 20px 30px; border-top: 1px solid #e2e8f0;">
          <p style="margin: 0; font-size: 12px; color: #94a3b8; text-align: center; line-height: 1.4;">
              This email does not create an attorney-client relationship.<br>
              If you can't see the download button, <a href="${finalPdfUrl}" style="color: #ff4d00;">click here to download your guide</a>.
          </p>
      </div>
  </div>
</body>
</html>`;

   // Send guide email
   try {
     console.log('📧 Sending guide to', email);
     await sendEnhancedEmail({
       to: [email],
       subject: clientSubject,
       html: clientHtml
     });
     console.log('✅ Client email sent');
   } catch (e) {
     console.error('❌ Client mail failed:', e.message);
   }

   // Send internal notification
   try {
     const adminSubject = `🎯 New Guide Download: ${guideName || 'Legal Strategy Guide'} - ${name}`;
     const adminHtml = `
       <h2>New Legal Guide Download</h2>
       <p><strong>Guide:</strong> ${guideName || 'Legal Strategy Guide'}</p>
       <p><strong>Type:</strong> ${guideType || 'complete-playbook'}</p>
       <p><strong>Email:</strong> ${email}</p>
       <p><strong>Name:</strong> ${name}</p>
       <p><strong>Source:</strong> ${source}</p>
       <p><strong>PDF URL:</strong> <a href="${finalPdfUrl}">${finalPdfUrl}</a></p>
       <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
     `;
     
     await sendEnhancedEmail({
       to: [INTAKE_NOTIFY_TO],
       subject: adminSubject,
       html: adminHtml
     });
     console.log('✅ Internal notification sent');
   } catch (e) {
     console.error('❌ Internal mail failed:', e.message);
   }

   // Add to Mailchimp
   try {
     const leadScore = calculateLeadScore({ email, firstName: name }, 'legal-guide-download');
     await addToMailchimpWithAutomation(
       { email, firstName: name }, 
       leadScore, 
       'legal-guide-download', 
       null
     );
     console.log('✅ Added to Mailchimp');
   } catch (e) {
     console.error('❌ Mailchimp failed:', e.message);
   }

   res.json({ success: true, message: 'Guide sent successfully!', submissionId });

 } catch (err) {
   console.error('💥 Legal guide error:', err);
   res.status(500).json({ success: false, error: err.message });
 }
});

// Primary Guide Download Endpoint
app.post('/download-primary-guide', async (req, res) => {
 try {
   const formData = sanitizeInput(req.body);
   const submissionId = `guide-primary-${Date.now()}`;
   const submissionType = 'legal-guide-download';

   console.log(`📥 Primary guide download:`, formData.email);

   // Calculate lead score
   const leadScore = calculateLeadScore(formData, submissionType);
   trackForFollowup(formData.email, formData, leadScore, submissionType);
   const aiAnalysis = await analyzeIntakeWithAI(formData, submissionType, leadScore);

   // PARALLEL PROCESSING
   const operations = [];
   
   const alertRecipients = leadScore.score >= 70 
     ? [INTAKE_NOTIFY_TO, HIGH_VALUE_NOTIFY_TO] 
     : [INTAKE_NOTIFY_TO];

   const internalSubject = `📖 Primary Guide Download — ${formData.name} (${formData.email}) — Score: ${leadScore.score}`;
   
   operations.push(
     sendEnhancedEmail({
       to: alertRecipients,
       subject: internalSubject,
       html: generateInternalAlert(formData, leadScore, submissionType, aiAnalysis, submissionId),
       priority: leadScore.score >= 70 ? 'high' : 'normal'
     }).catch(e => console.error('❌ Internal email failed:', e.message))
   );

   operations.push(
     addToMailchimpWithAutomation(formData, leadScore, submissionType, aiAnalysis)
       .catch(e => console.error('❌ Mailchimp failed:', e.message))
   );

   operations.push(
     createClioLead(formData, submissionType, leadScore)
       .catch(e => console.error('❌ Clio Grow failed:', e.message))
   );

   if (formData.email) {
     const clientEmailHtml = generateClientConfirmationEmail(formData, null, submissionType, leadScore.score);
     if (clientEmailHtml) {
       operations.push(
         sendEnhancedEmail({
           to: [formData.email],
           subject: `Jacobs Counsel — Your Legal Strategy Guide`,
           html: clientEmailHtml
         }).catch(e => console.error('❌ Client email failed:', e.message))
       );
     }
   }

   await processIntakeOperations(operations);

   // Redirect to the PDF download
   res.redirect('https://www.jacobscounsellaw.com/s/Protect-Your-Dreams-Maximize-Your-Impact-and-Grow-Smart.pdf');

 } catch (error) {
   console.error('💥 Primary guide download error:', error);
   res.status(500).json({ ok: false, error: error.message });
 }
});

// Specialized Guide Download Endpoint
app.post('/download-specialized-guide', async (req, res) => {
 try {
   const { guideType, guideName, pdfUrl, timestamp } = sanitizeInput(req.body);
   const submissionId = `guide-${guideType}-${Date.now()}`;

   console.log(`📥 Specialized guide download: ${guideType}`);

   // Send internal notification
   try {
     await sendEnhancedEmail({
       to: [INTAKE_NOTIFY_TO],
       subject: `📖 Specialized Guide Download: ${guideName}`,
       html: `
         <h2>Specialized Guide Downloaded</h2>
         <p><strong>Guide:</strong> ${guideName}</p>
         <p><strong>Type:</strong> ${guideType}</p>
         <p><strong>PDF URL:</strong> <a href="${pdfUrl}">${pdfUrl}</a></p>
         <p><strong>Time:</strong> ${timestamp}</p>
         <p><strong>Submission ID:</strong> ${submissionId}</p>
       `
     });
     console.log('✅ Internal notification sent');
   } catch (e) {
     console.error('❌ Internal email failed:', e.message);
   }

   res.json({ 
     ok: true, 
     submissionId,
     message: 'Specialized guide download tracked'
   });

 } catch (error) {
   console.error('💥 Specialized guide download error:', error);
   res.status(500).json({ ok: false, error: error.message });
 }
});

// Analytics Conversion Tracking
app.post('/api/analytics/conversion', async (req, res) => {
 try {
   const { email, fromService, toService, assessmentScore, assessmentAnswers, timestamp } = req.body;
   
   console.log(`📈 CONVERSION TRACKED: ${email} went from ${fromService} → ${toService}`);
   console.log(`📊 Assessment Score: ${assessmentScore}`);
   
   // Send notification about successful conversion
   try {
     await sendEnhancedEmail({
       to: [INTAKE_NOTIFY_TO],
       subject: `🎯 Conversion Success: ${email} → ${toService}`,
       html: `
         <h2>🎯 Legal Strategy Builder Conversion</h2>
         <p><strong>Email:</strong> ${email}</p>
         <p><strong>Assessment Score:</strong> ${assessmentScore}/100</p>
         <p><strong>Converted To:</strong> ${toService}</p>
         <p><strong>Assessment Answers:</strong></p>
         <pre>${JSON.stringify(assessmentAnswers, null, 2)}</pre>
         <p><strong>Time:</strong> ${timestamp}</p>
       `
     });
   } catch (e) {
     console.error('❌ Conversion email failed:', e.message);
   }
   
   res.json({ success: true, message: 'Conversion tracked' });
   
 } catch (error) {
   console.error('❌ Conversion tracking error:', error);
   res.status(500).json({ success: false, error: error.message });
 }
});

// ==================== ADVANCED AI ENDPOINTS ====================

// Conversational intake endpoint
app.post('/api/chat-intake', async (req, res) => {
 try {
   const { sessionId, message, context } = req.body;
   
   const result = await createConversationalIntake(sessionId, message, context || []);
   
   // If we have enough data, create a lead
   if (result.extractedData?.email) {
     const leadScore = calculateLeadScore(result.extractedData, 'chat-intake');
     trackForFollowup(result.extractedData.email, result.extractedData, leadScore, 'chat-intake');
     await addToMailchimpWithAutomation(result.extractedData, leadScore, 'chat-intake', null);
     await createClioLead(result.extractedData, 'chat-intake', leadScore);
   }
   
   res.json({
     success: true,
     response: result.response,
     extractedData: result.extractedData,
     sessionId: sessionId || `chat-${Date.now()}`
   });
   
 } catch (error) {
   console.error('Chat intake error:', error);
   res.status(500).json({ success: false, error: error.message });
 }
});

// Document generation endpoint
app.post('/api/generate-document', async (req, res) => {
 try {
   const { documentType, clientData } = req.body;
   
   const result = await generateLegalDocument(documentType, clientData);
   
   if (result.error) {
     return res.status(400).json({ success: false, error: result.error });
   }
   
   // Log document generation
   console.log(`📄 Generated ${documentType} for ${clientData.name || 'client'}`);
   
   // Send notification
   if (clientData.email) {
     await sendEnhancedEmail({
       to: [clientData.email],
       subject: `Your ${documentType} Draft - Jacobs Counsel`,
       html: `
         <h2>Your Document is Ready</h2>
         <p>We've prepared your ${documentType} draft.</p>
         <p><strong>Important:</strong> This is a draft and requires attorney review.</p>
         <pre style="background: #f5f5f5; padding: 20px; border-radius: 8px;">
           ${result.document}
         </pre>
         <p><a href="https://app.usemotion.com/meet/drew-jacobs-jcllc/8xx9grm">Schedule Review Call</a></p>
       `
     });
   }
   
   res.json({
     success: true,
     documentId: result.documentId,
     document: result.document
   });
   
 } catch (error) {
   console.error('Document generation error:', error);
   res.status(500).json({ success: false, error: error.message });
 }
});

// Client lifetime value prediction endpoint
app.post('/api/predict-clv', async (req, res) => {
 try {
   const { formData } = req.body;
   
   const leadScore = calculateLeadScore(formData, 'clv-check');
   const aiAnalysis = await analyzeIntakeWithAI(formData, 'clv-check', leadScore);
   const clvPrediction = await predictClientLifetimeValue(formData, aiAnalysis);
   
   res.json({
     success: true,
     leadScore: leadScore.score,
     prediction: clvPrediction
   });
   
 } catch (error) {
   console.error('CLV prediction error:', error);
   res.status(500).json({ success: false, error: error.message });
 }
});

// Smart form analytics
app.post('/api/analytics/form-event', async (req, res) => {
   const { event, formType, step, data } = req.body;
   
   // Log the event
   console.log(`📊 Form Event: ${event} - ${formType} - Step ${step}`);
   
   // Store in analytics (you can add a database later)
   const analytics = {
       event,
       formType,
       step,
       timestamp: new Date().toISOString(),
       data
   };
   
   // If it's an abandonment, trigger recovery
   if (event === 'abandoned' && data?.email) {
       await triggerAbandonmentRecovery(data.email, formType, step);
   }
   
   res.json({ received: true });
});

// Smart form recovery
async function triggerAbandonmentRecovery(email, formType, lastStep) {
   if (!email) return;
   
   // Wait 1 hour then send recovery email
   setTimeout(async () => {
       const recoveryLink = `https://jacobscounsellaw.com/${formType}?recover=true`;
       
       await sendEnhancedEmail({
           to: [email],
           subject: 'Complete Your Legal Consultation Request',
           html: `
               <h2>You're almost done!</h2>
               <p>We noticed you didn't finish your ${formType} request.</p>
               <p>Your progress has been saved. Click below to complete:</p>
               <a href="${recoveryLink}" style="background: #ff4d00; 
                  color: white; padding: 16px 32px; 
                  text-decoration: none; border-radius: 8px; 
                  display: inline-block;">
                   Complete My Request →
               </a>
           `
       });
   }, 3600000); // 1 hour
}

// ==================== ERROR HANDLING ====================

app.use((err, req, res, next) => {
 if (err && err.code) {
   if (err.code === 'LIMIT_FILE_SIZE') {
     return res.status(413).json({ 
       ok: false, 
       error: 'One or more files are too large (max 15MB each). Try again without the oversized file(s).' 
     });
   }
   if (err.code === 'LIMIT_FILE_COUNT') {
     return res.status(413).json({ 
       ok: false, 
       error: 'Too many files (max 15). Remove some and try again.' 
     });
   }
   if (err.code === 'LIMIT_UNEXPECTED_FILE') {
     return res.status(400).json({ 
       ok: false, 
       error: 'Unexpected file field. Please use the file picker in the form.' 
     });
   }
 }
 console.error('Unhandled error:', err);
 res.status(500).json({ 
   ok: false, 
   error: 'Server error. Please try again or contact us directly.' 
 });
});

// ==================== SERVER STARTUP ====================

app.listen(PORT, () => {
 validateEnvironment();
 console.log(`🚀 Jacobs Counsel ENHANCED System running on port ${PORT}`);
 console.log(`📊 Features: AI Analysis, Lead Scoring, Smart Mailchimp, Motion, Clio, Performance Caching, Security`);
 console.log(`🎯 ENHANCED MODE: ACTIVATED`);
});
