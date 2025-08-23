// index.js — Jacobs Counsel Unified Intake System - THE POWERHOUSE
// Features: AI-powered lead scoring, Mailchimp automation, Motion integration, intelligent routing

import express from 'express';
import cors from 'cors';
import multer from 'multer';
import fetch from 'node-fetch';
import { Buffer } from 'buffer';

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

// ==================== EXPRESS SETUP ====================
const app = express();
app.use(cors());
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true }));

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 15 * 1024 * 1024, files: 15 }
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
  'legal-strategy-builder': 55  // ✅ ADD THIS LINE
};

  // ADD this new logic right after the base scoring:
score += baseScores[submissionType] || 30;
scoreFactors.push(`Base ${submissionType}: +${baseScores[submissionType] || 30}`);

// ✅ ADD THIS NEW SECTION:
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

// AI-powered intake analysis
async function analyzeIntakeWithAI(formData, submissionType, leadScore) {
  if (!OPENAI_API_KEY) return { analysis: null, recommendations: null, riskFlags: [] };

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

async function createClioLead(formData, submissionType, leadScore) {
  if (!CLIO_GROW_INBOX_TOKEN) {
    console.log('Clio Grow not configured, skipping');
    return { skipped: true };
  }

  // Extract name based on submission type
  let firstName = '';
  let lastName = '';
  
  if (submissionType === 'estate-intake') {
    firstName = formData.firstName || '';
    lastName = formData.lastName || '';
  } else if (submissionType === 'business-formation') {
    const founderParts = (formData.founderName || '').split(' ');
    firstName = founderParts[0] || '';
    lastName = founderParts.slice(1).join(' ') || '';
  } else if (submissionType === 'brand-protection') {
    const fullNameParts = (formData.fullName || '').split(' ');
    firstName = fullNameParts[0] || '';
    lastName = fullNameParts.slice(1).join(' ') || '';
  } else if (submissionType === 'outside-counsel') {
    const contactParts = (formData.contactName || '').split(' ');
    firstName = contactParts[0] || '';
    lastName = contactParts.slice(1).join(' ') || '';
  }

  // Build comprehensive message
  let message = `${submissionType.replace('-', ' ').toUpperCase()} Lead (Score: ${leadScore.score}/100)\n`;
  
  if (submissionType === 'estate-intake') {
    message += `State: ${formData.state || '-'}\nMarital: ${formData.maritalStatus || '-'}\nMinors: ${formData.hasMinorChildren || '-'}\nPackage: ${formData.packagePreference || 'Not sure'}\nEstate Value: ${formData.grossEstate || 'Not specified'}`;
  } else if (submissionType === 'business-formation') {
    message += `Business: ${formData.businessName || '-'}\nType: ${formData.businessType || '-'}\nInvestment: ${formData.investmentPlan || '-'}\nPackage: ${formData.selectedPackage || 'Not specified'}`;
  } else if (submissionType === 'brand-protection') {
    message += `Business: ${formData.businessName || '-'}\nGoal: ${formData.protectionGoal || '-'}\nIndustry: ${formData.industry || '-'}\nUrgency: ${formData.urgency || '-'}\nService: ${formData.servicePreference || 'Not specified'}`;
  } else if (submissionType === 'outside-counsel') {
    message += `Company: ${formData.companyName || '-'}\nIndustry: ${formData.industry || '-'}\nStage: ${formData.stage || '-'}\nBudget: ${formData.budget || '-'}\nTimeline: ${formData.timeline || '-'}`;
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
  const isConversion = formData.conversionSource === 'legal-strategy-builder'; // ✅ ADD THIS
  const urgentFlag = formData.urgency?.includes('Immediate') || aiAnalysis?.riskFlags?.includes('urgent');

  return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>${isHighValue ? '🔥 HIGH VALUE' : ''}${isConversion ? ' 🎯 ASSESSMENT CONVERSION' : ''} ${urgentFlag ? '⚡ URGENT' : ''} New ${submissionType.toUpperCase()} Intake</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, Arial, sans-serif; line-height: 1.6; color: #0f172a;">
    <div style="max-width: 700px; margin: 0 auto; padding: 20px;">
        
        ${isConversion ? `
        <div style="background: linear-gradient(135deg, #22c55e, #16a34a); color: white; padding: 16px; border-radius: 12px; margin-bottom: 24px; text-align: center;">
            <h2 style="margin: 0; font-size: 24px;">🎯 ASSESSMENT CONVERSION SUCCESS!</h2>
            <p style="margin: 8px 0 0; font-size: 16px;">This lead came from the Legal Strategy Builder</p>
        </div>
        ` : ''}
        
        ${isHighValue ? `
        <div style="background: linear-gradient(135deg, #dc2626, #b91c1c); color: white; padding: 16px; border-radius: 12px; margin-bottom: 24px; text-align: center;">
            <h2 style="margin: 0; font-size: 24px;">🔥 HIGH VALUE LEAD ALERT</h2>
            <p style="margin: 8px 0 0; font-size: 18px;">Score: ${leadScore.score}/100</p>
        </div>
        ` : ''}
        
        <h1 style="color: #ff4d00; margin: 0 0 24px;">New ${submissionType.replace('-', ' ').toUpperCase()} Intake</h1>
        
        <div style="background: #f8fafc; padding: 24px; border-radius: 12px; margin: 24px 0; border-left: 6px solid #ff4d00;">
            <h3 style="margin: 0 0 16px; color: #0b1f1e;">Contact Information</h3>
            <p><strong>Name:</strong> ${formData.firstName || formData.fullName || formData.contactName || ''} ${formData.lastName || ''}</p>
            <p><strong>Email:</strong> <a href="mailto:${formData.email}">${formData.email}</a></p>
            <p><strong>Phone:</strong> ${formData.phone || 'Not provided'}</p>
            <p><strong>Business:</strong> ${formData.businessName || formData.companyName || 'Not specified'}</p>
            <p><strong>Location:</strong> ${formData.state || formData.businessState || 'Not specified'}</p>
        </div>

        <div style="background: #f0fdf4; padding: 24px; border-radius: 12px; margin: 24px 0; border-left: 6px solid #059669;">
            <h3 style="margin: 0 0 16px; color: #166534;">Lead Intelligence</h3>
            <p><strong>Score:</strong> ${leadScore.score}/100</p>
            <p><strong>Scoring Factors:</strong></p>
            <ul style="margin: 8px 0; padding-left: 20px;">
                ${leadScore.factors.map(factor => `<li style="margin: 4px 0;">${factor}</li>`).join('')}
            </ul>
        </div>

        ${aiAnalysis?.analysis ? `
        <div style="background: #fffbeb; padding: 24px; border-radius: 12px; margin: 24px 0; border-left: 6px solid #d97706;">
            <h3 style="margin: 0 0 16px; color: #92400e;">AI Strategic Analysis</h3>
            <p><strong>Situation:</strong> ${aiAnalysis.analysis}</p>
            <p><strong>Recommendations:</strong> ${aiAnalysis.recommendations}</p>
            <p><strong>Engagement Strategy:</strong> ${aiAnalysis.engagementStrategy}</p>
            <p><strong>Lifetime Value:</strong> ${aiAnalysis.lifetimeValue}</p>
            ${aiAnalysis.riskFlags ? `<p><strong>⚠️ Risk Flags:</strong> ${aiAnalysis.riskFlags}</p>` : ''}
        </div>
        ` : ''}

        <div style="background: #e0f2fe; padding: 24px; border-radius: 12px; margin: 24px 0; text-align: center;">
            <h3 style="margin: 0 0 16px; color: #0369a1;">Recommended Actions</h3>
            ${isHighValue ? `
            <a href="https://app.usemotion.com/meet/drew-jacobs-jcllc/8xx9grm" 
               style="background: #dc2626; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; display: inline-block; margin: 8px; font-weight: 600;">
               🔥 Priority Consultation
            </a>
            ` : `
            <a href="https://app.usemotion.com/meet/drew-jacobs-jcllc/8xx9grm" 
               style="background: #059669; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; display: inline-block; margin: 8px; font-weight: 600;">
               📅 Schedule Consultation
            </a>
            `}
            <a href="mailto:${formData.email}?subject=Re: Your ${submissionType} inquiry - Jacobs Counsel" 
               style="background: #0369a1; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; display: inline-block; margin: 8px; font-weight: 600;">
               📧 Direct Response
            </a>
        </div>

        <details style="margin: 24px 0;">
            <summary style="cursor: pointer; font-weight: 600; color: #64748b;">Full Form Data</summary>
            <pre style="background: #f8fafc; padding: 16px; border-radius: 8px; overflow-x: auto; font-size: 12px; margin: 16px 0;">${JSON.stringify(formData, null, 2)}</pre>
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
  const clientName = formData.firstName || formData.fullName?.split(' ')[0] || formData.contactName?.split(' ')[0] || 'there';
  
  return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Your ${submissionType.replace('-', ' ')} Intake - Next Steps</title>
</head>
<body style="font-family: 'SF Pro Display', -apple-system, BlinkMacSystemFont, Arial, sans-serif; line-height: 1.6; color: #0f172a; margin: 0; padding: 0;">
    <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(90deg, #ff4d00, #0b1f1e); height: 6px; border-radius: 3px; margin-bottom: 24px;"></div>
        
        <h1 style="color: #ff4d00; font-size: 28px; margin: 0 0 16px; font-weight: 700;">Thank you for choosing Jacobs Counsel</h1>
        
        <p style="font-size: 16px; margin: 16px 0;">Hi <strong>${clientName}</strong>,</p>
        
        <p style="font-size: 16px; margin: 16px 0;">We've received your ${submissionType.replace('-', ' ')} intake and will review it within <strong>1 business day</strong>. Our AI analysis has identified key opportunities for your situation.</p>
        
        ${leadScore >= 70 ? `
        <div style="background: #fef2f2; border: 2px solid #fecaca; padding: 20px; border-radius: 12px; margin: 24px 0;">
            <h3 style="color: #dc2626; margin: 0 0 12px;">Priority Review</h3>
            <p style="margin: 0; color: #7f1d1d;">Based on your responses, we've marked your intake for priority review. You can expect to hear from us within a few hours.</p>
        </div>
        ` : ''}
        
        ${price ? `
        <div style="background: #f0fdf4; padding: 20px; border-radius: 12px; margin: 24px 0; border: 2px solid #bbf7d0; text-align: center;">
            <p style="margin: 0; font-size: 18px; font-weight: 600; color: #166534;">Estimated Investment: ${typeof price === 'number' ? '$' + price.toLocaleString() : price}</p>
            <p style="margin: 8px 0 0; font-size: 14px; color: #059669;">Final pricing confirmed after review</p>
        </div>
        ` : ''}
        
        <div style="background: #e3f2fd; padding: 24px; border-radius: 12px; margin: 24px 0; text-align: center; border: 2px solid #7dd3fc;">
            <p style="margin: 0 0 16px; font-weight: 600; color: #0369a1; font-size: 16px;">Ready to schedule your consultation?</p>
            <a href="https://app.usemotion.com/meet/drew-jacobs-jcllc/8xx9grm" 
               style="background: linear-gradient(135deg, #ff4d00, #0b1f1e); color: white; padding: 14px 28px; text-decoration: none; border-radius: 12px; display: inline-block; font-weight: 600; font-size: 16px;">
               📅 Book Your Consultation
            </a>
        </div>
        
        <p style="font-size: 16px; margin: 24px 0 16px;">Questions? Simply reply to this email or call us directly.</p>
        
        <p style="font-size: 16px; margin: 16px 0;">Best regards,<br>
        <strong style="color: #0b1f1e;">The Jacobs Counsel Team</strong></p>
        
        <hr style="margin: 32px 0; border: none; border-top: 1px solid #e2e8f0;">
        <p style="font-size: 13px; color: #64748b; margin: 0;">
            This email was sent because you completed an intake at jacobscounsellaw.com. 
            Your information is confidential and this does not create an attorney-client relationship.
        </p>
    </div>
</body>
</html>
`;
}

// ==================== ROUTES ====================

app.get('/', (req, res) => {
  res.json({ 
    ok: true, 
    service: 'jacobs-counsel-unified-intake',
    version: '3.0.0-POWERHOUSE',
    endpoints: ['/estate-intake', '/business-formation-intake', '/brand-protection-intake', '/outside-counsel', '/add-subscriber', '/legal-guide', '/api/chat-intake', '/api/generate-document', '/api/predict-clv'],
    features: ['AI Analysis', 'Lead Scoring', 'Smart Mailchimp Automation', 'Motion Integration', 'Clio Grow Integration', 'Conversational AI', 'Document Generation', 'CLV Prediction']
  });
});

// Estate Planning Intake
app.post('/estate-intake', upload.array('document'), async (req, res) => {
  try {
    const formData = req.body || {};
    const files = req.files || [];
    const submissionId = formData.submissionId || `estate-${Date.now()}`;
    const submissionType = 'estate-intake';

    // ✅ ADD THIS DETECTION:
    const fromAssessment = formData.fromAssessment === 'true' || 
                          formData.source === 'legal-strategy-builder-conversion' ||
                          req.get('Referer')?.includes('legal-strategy-builder');
    
    if (fromAssessment) {
      console.log('🎯 ASSESSMENT CONVERSION: Estate Planning');
      formData.conversionSource = 'legal-strategy-builder';
      formData.conversionType = 'assessment-to-estate';
    }

    console.log(`📥 New ${submissionType} submission:`, formData.email);

    const leadScore = calculateLeadScore(formData, submissionType);
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

    // Send internal alert email
    const alertRecipients = leadScore.score >= 70 
      ? [INTAKE_NOTIFY_TO, HIGH_VALUE_NOTIFY_TO] 
      : [INTAKE_NOTIFY_TO];

    const internalSubject = `${leadScore.score >= 70 ? '🔥 HIGH VALUE' : ''} Estate Intake — ${formData.firstName || ''} ${formData.lastName || ''} (Score: ${leadScore.score})`;
    
    try {
      await sendEnhancedEmail({
        to: alertRecipients,
        subject: internalSubject,
        html: generateInternalAlert(formData, leadScore, submissionType, aiAnalysis, submissionId),
        priority: leadScore.score >= 70 ? 'high' : 'normal',
        attachments
      });
      console.log('✅ Internal alert sent');
    } catch (e) {
      console.error('❌ Internal email failed:', e.message);
    }

    // Add to Smart Mailchimp
    try {
      await addToMailchimpWithAutomation(formData, leadScore, submissionType, aiAnalysis);
      console.log('✅ Added to Smart Mailchimp automation');
    } catch (e) {
      console.error('❌ Mailchimp failed:', e.message);
    }

    // Create Motion project for high-value leads
    try {
      await createMotionProject(formData, leadScore, submissionType, aiAnalysis);
      console.log('✅ Motion project created');
    } catch (e) {
      console.error('❌ Motion integration failed:', e.message);
    }

    // Push to Clio Grow
    try {
      await createClioLead(formData, submissionType, leadScore);
    } catch (e) {
      console.error('❌ Clio Grow failed:', e.message);
    }

    // Send client confirmation email
    if (formData.email) {
      try {
        const clientEmailHtml = generateClientConfirmationEmail(formData, price, submissionType, leadScore.score);
        await sendEnhancedEmail({
          to: [formData.email, INTAKE_NOTIFY_TO],
          subject: 'Jacobs Counsel — Your Estate Planning Intake & Next Steps',
          html: clientEmailHtml
        });
        console.log('✅ Client confirmation sent');
      } catch (e) {
        console.error('❌ Client email failed:', e.message);
      }
    }

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

// Business Formation Intake
app.post('/business-formation-intake', upload.array('documents'), async (req, res) => {
  try {
    const formData = req.body || {};
    const files = req.files || [];
    const submissionId = formData.submissionId || `business-${Date.now()}`;
    const submissionType = 'business-formation';

    // ✅ ADD THIS DETECTION:
    const fromAssessment = formData.fromAssessment === 'true' || 
                          formData.source === 'legal-strategy-builder-conversion' ||
                          req.get('Referer')?.includes('legal-strategy-builder');
    
    if (fromAssessment) {
      console.log('🎯 ASSESSMENT CONVERSION: Business Formation');
      formData.conversionSource = 'legal-strategy-builder';
      formData.conversionType = 'assessment-to-business';
    }

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

    // Calculate pricing
    let price = null;
    const packageType = (formData.selectedPackage || '').toLowerCase();
    if (packageType.includes('bronze')) price = 2995;
    else if (packageType.includes('silver')) price = 4995;
    else if (packageType.includes('gold')) price = 7995;

    // Send internal alert
    const alertRecipients = leadScore.score >= 70 
      ? [INTAKE_NOTIFY_TO, HIGH_VALUE_NOTIFY_TO] 
      : [INTAKE_NOTIFY_TO];

    const internalSubject = `${leadScore.score >= 70 ? '🔥 HIGH VALUE' : ''} Business Formation — ${formData.founderName || formData.businessName || 'New Lead'} (Score: ${leadScore.score})`;
    
    try {
      await sendEnhancedEmail({
        to: alertRecipients,
        subject: internalSubject,
        html: generateInternalAlert(formData, leadScore, submissionType, aiAnalysis, submissionId),
        priority: leadScore.score >= 70 ? 'high' : 'normal',
        attachments
      });
      console.log('✅ Internal alert sent');
    } catch (e) {
      console.error('❌ Internal email failed:', e.message);
    }

    // Smart Mailchimp and other integrations
    try {
      await addToMailchimpWithAutomation(formData, leadScore, submissionType, aiAnalysis);
      console.log('✅ Added to Smart Mailchimp automation');
    } catch (e) {
      console.error('❌ Mailchimp failed:', e.message);
    }

    try {
      await createMotionProject(formData, leadScore, submissionType, aiAnalysis);
      console.log('✅ Motion project created');
    } catch (e) {
      console.error('❌ Motion integration failed:', e.message);
    }

    // Push to Clio Grow
    try {
      await createClioLead(formData, submissionType, leadScore);
    } catch (e) {
      console.error('❌ Clio Grow failed:', e.message);
    }

    // Client confirmation
    if (formData.email) {
      try {
        const clientEmailHtml = generateClientConfirmationEmail(formData, price, submissionType, leadScore.score);
        await sendEnhancedEmail({
          to: [formData.email, INTAKE_NOTIFY_TO],
          subject: 'Jacobs Counsel — Your Business Formation Intake & Next Steps',
          html: clientEmailHtml
        });
        console.log('✅ Client confirmation sent');
      } catch (e) {
        console.error('❌ Client email failed:', e.message);
      }
    }

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

// Brand Protection Intake
app.post('/brand-protection-intake', upload.array('brandDocument'), async (req, res) => {
  try {
    const formData = req.body || {};
    const files = req.files || [];
    const submissionId = formData.submissionId || `brand-${Date.now()}`;
    const submissionType = 'brand-protection';

    // ✅ ADD THIS DETECTION:
    const fromAssessment = formData.fromAssessment === 'true' || 
                          formData.source === 'legal-strategy-builder-conversion' ||
                          req.get('Referer')?.includes('legal-strategy-builder');
    
    if (fromAssessment) {
      console.log('🎯 ASSESSMENT CONVERSION: Brand Protection');
      formData.conversionSource = 'legal-strategy-builder';
      formData.conversionType = 'assessment-to-brand';
    }

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

    // Send internal alert
    const alertRecipients = leadScore.score >= 70 
      ? [INTAKE_NOTIFY_TO, HIGH_VALUE_NOTIFY_TO] 
      : [INTAKE_NOTIFY_TO];

    const internalSubject = `${leadScore.score >= 70 ? '🔥 HIGH VALUE' : ''} Brand Protection — ${formData.businessName || formData.fullName || 'New Lead'} (Score: ${leadScore.score})`;
    
    try {
      await sendEnhancedEmail({
        to: alertRecipients,
        subject: internalSubject,
        html: generateInternalAlert(formData, leadScore, submissionType, aiAnalysis, submissionId),
        priority: leadScore.score >= 70 ? 'high' : 'normal',
        attachments
      });
      console.log('✅ Internal alert sent');
    } catch (e) {
      console.error('❌ Internal email failed:', e.message);
    }

    // Smart Mailchimp and other integrations
    try {
      await addToMailchimpWithAutomation(formData, leadScore, submissionType, aiAnalysis);
      console.log('✅ Added to Smart Mailchimp automation');
    } catch (e) {
      console.error('❌ Mailchimp failed:', e.message);
    }

    try {
      await createMotionProject(formData, leadScore, submissionType, aiAnalysis);
      console.log('✅ Motion project created');
    } catch (e) {
      console.error('❌ Motion integration failed:', e.message);
    }

    // Push to Clio Grow
    try {
      await createClioLead(formData, submissionType, leadScore);
    } catch (e) {
      console.error('❌ Clio Grow failed:', e.message);
    }

    // Client confirmation
    if (formData.email) {
      try {
        const clientEmailHtml = generateClientConfirmationEmail(formData, priceEstimate, submissionType, leadScore.score);
        await sendEnhancedEmail({
          to: [formData.email, INTAKE_NOTIFY_TO],
          subject: 'Jacobs Counsel — Your Brand Protection Intake & Next Steps',
          html: clientEmailHtml
        });
        console.log('✅ Client confirmation sent');
      } catch (e) {
        console.error('❌ Client email failed:', e.message);
      }
    }

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

// Outside Counsel Intake
app.post('/outside-counsel', async (req, res) => {
  try {
    const formData = req.body;
    const submissionId = formData.submissionId || `OC-${Date.now()}`;
    const submissionType = 'outside-counsel';

    // ✅ ADD THIS DETECTION:
    const fromAssessment = formData.fromAssessment === 'true' || 
                          formData.source === 'legal-strategy-builder-conversion' ||
                          req.get('Referer')?.includes('legal-strategy-builder');
    
    if (fromAssessment) {
      console.log('🎯 ASSESSMENT CONVERSION: Outside Counsel');
      formData.conversionSource = 'legal-strategy-builder';
      formData.conversionType = 'assessment-to-counsel';
    }

    console.log(`📥 New ${submissionType} submission:`, formData.email);

    const leadScore = calculateLeadScore(formData, submissionType);
    const aiAnalysis = await analyzeIntakeWithAI(formData, submissionType, leadScore);

   // Send internal alert
    const alertRecipients = leadScore.score >= 70 
      ? [INTAKE_NOTIFY_TO, HIGH_VALUE_NOTIFY_TO] 
      : [INTAKE_NOTIFY_TO];

    const internalSubject = `${leadScore.score >= 70 ? '🔥 HIGH VALUE' : ''} Outside Counsel — ${formData.companyName || 'New Lead'} (Score: ${leadScore.score})`;
    
    try {
      await sendEnhancedEmail({
        to: alertRecipients,
        subject: internalSubject,
        html: generateInternalAlert(formData, leadScore, submissionType, aiAnalysis, submissionId),
        priority: leadScore.score >= 70 ? 'high' : 'normal'
      });
      console.log('✅ Internal alert sent');
    } catch (e) {
      console.error('❌ Internal email failed:', e.message);
    }

    // Smart Mailchimp and other integrations
    try {
      await addToMailchimpWithAutomation(formData, leadScore, submissionType, aiAnalysis);
      console.log('✅ Added to Smart Mailchimp automation');
    } catch (e) {
      console.error('❌ Mailchimp failed:', e.message);
    }

    try {
      await createMotionProject(formData, leadScore, submissionType, aiAnalysis);
      console.log('✅ Motion project created');
    } catch (e) {
      console.error('❌ Motion integration failed:', e.message);
    }

    // Push to Clio Grow
    try {
      await createClioLead(formData, submissionType, leadScore);
    } catch (e) {
      console.error('❌ Clio Grow failed:', e.message);
    }

    // Client confirmation
    if (formData.email) {
      try {
        const clientEmailHtml = generateClientConfirmationEmail(formData, null, submissionType, leadScore.score);
        await sendEnhancedEmail({
          to: [formData.email, INTAKE_NOTIFY_TO],
          subject: 'Jacobs Counsel — Your Outside Counsel Request & Next Steps',
          html: clientEmailHtml
        });
        console.log('✅ Client confirmation sent');
      } catch (e) {
        console.error('❌ Client email failed:', e.message);
      }
    }

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

// ✅ ADD THIS NEW ENDPOINT RIGHT HERE:
// Legal Strategy Builder Endpoint
app.post('/legal-strategy-builder', async (req, res) => {
  try {
    const formData = req.body;
    const submissionId = `strategy-${Date.now()}`;
    const submissionType = 'legal-strategy-builder';

    console.log(`📥 New ${submissionType} submission:`, formData.email);

    // Calculate lead score based on assessment answers
    const leadScore = calculateLeadScore(formData, submissionType);
    console.log(`📊 Lead score: ${leadScore.score}/100`);

    // AI Analysis
    const aiAnalysis = await analyzeIntakeWithAI(formData, submissionType, leadScore);

    // Send internal alert
    const alertRecipients = leadScore.score >= 70 
      ? [INTAKE_NOTIFY_TO, HIGH_VALUE_NOTIFY_TO] 
      : [INTAKE_NOTIFY_TO];

    const internalSubject = `${leadScore.score >= 70 ? '🔥 HIGH VALUE' : ''} Legal Strategy Assessment — ${formData.email} (Score: ${leadScore.score})`;
    
    try {
      await sendEnhancedEmail({
        to: alertRecipients,
        subject: internalSubject,
        html: generateInternalAlert(formData, leadScore, submissionType, aiAnalysis, submissionId),
        priority: leadScore.score >= 70 ? 'high' : 'normal'
      });
      console.log('✅ Internal alert sent');
    } catch (e) {
      console.error('❌ Internal email failed:', e.message);
    }

    // Add to Smart Mailchimp
    try {
      await addToMailchimpWithAutomation(formData, leadScore, submissionType, aiAnalysis);
      console.log('✅ Added to Smart Mailchimp automation');
    } catch (e) {
      console.error('❌ Mailchimp failed:', e.message);
    }

    // Create Motion project for high-value leads
    try {
      await createMotionProject(formData, leadScore, submissionType, aiAnalysis);
    } catch (e) {
      console.error('❌ Motion integration failed:', e.message);
    }

    // Push to Clio Grow
    try {
      await createClioLead(formData, submissionType, leadScore);
    } catch (e) {
      console.error('❌ Clio Grow failed:', e.message);
    }

    // Send client confirmation email
    if (formData.email) {
      try {
        const clientEmailHtml = generateClientConfirmationEmail(formData, null, submissionType, leadScore.score);
        await sendEnhancedEmail({
          to: [formData.email, INTAKE_NOTIFY_TO],
          subject: 'Your Legal Strategy Assessment Results - Jacobs Counsel',
          html: clientEmailHtml
        });
        console.log('✅ Client confirmation sent');
      } catch (e) {
        console.error('❌ Client email failed:', e.message);
      }
    }

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
    
    const { email, firstName, source = 'legal-guide-download', referringUrl } = req.body;
    
    if (!email) {
      return res.status(400).json({ success: false, error: 'Email required' });
    }
    
    const submissionId = `guide-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const name = firstName || email.split('@')[0];
    
    const pdfUrl = process.env.LEGAL_GUIDE_PDF_URL;
    if (!pdfUrl) {
      console.error('❌ LEGAL_GUIDE_PDF_URL not set');
      return res.status(500).json({ success: false, error: 'PDF not configured' });
    }

    const clientSubject = 'Your Free Legal Strategy Guide - Jacobs Counsel';
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
                <a href="${pdfUrl}" style="background: linear-gradient(135deg, #ff4d00, #0b1f1e); color: #ffffff; padding: 20px 40px; border-radius: 12px; text-decoration: none; font-weight: 700; font-size: 18px; display: inline-block; box-shadow: 0 6px 20px rgba(255, 77, 0, 0.3); text-transform: uppercase; letter-spacing: 1px;">
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
               If you can't see the download button, <a href="${pdfUrl}" style="color: #ff4d00;">click here to download your guide</a>.
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
     const adminSubject = `🎯 New Legal Guide Download: ${name}`;
     const adminHtml = `<h2>New Legal Guide Download</h2><p><strong>Email:</strong> ${email}</p><p><strong>Name:</strong> ${name}</p><p><strong>Source:</strong> ${source}</p><p><strong>Time:</strong> ${new Date().toLocaleString()}</p>`;
     
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

// ADD THESE TWO NEW ENDPOINTS HERE:

// Primary Guide Download Endpoint
app.post('/download-primary-guide', async (req, res) => {
  try {
    const formData = req.body;
    const submissionId = `guide-primary-${Date.now()}`;
    const submissionType = 'legal-guide-download';

    console.log(`📥 Primary guide download:`, formData.email);

    // Calculate lead score
    const leadScore = calculateLeadScore(formData, submissionType);
    const aiAnalysis = await analyzeIntakeWithAI(formData, submissionType, leadScore);

    // Send internal alert
    const alertRecipients = leadScore.score >= 70 
      ? [INTAKE_NOTIFY_TO, HIGH_VALUE_NOTIFY_TO] 
      : [INTAKE_NOTIFY_TO];

    const internalSubject = `📖 Primary Guide Download — ${formData.name} (${formData.email}) — Score: ${leadScore.score}`;
    
    try {
      await sendEnhancedEmail({
        to: alertRecipients,
        subject: internalSubject,
        html: generateInternalAlert(formData, leadScore, submissionType, aiAnalysis, submissionId),
        priority: leadScore.score >= 70 ? 'high' : 'normal'
      });
      console.log('✅ Internal alert sent');
    } catch (e) {
      console.error('❌ Internal email failed:', e.message);
    }

    // Add to Smart Mailchimp
    try {
      await addToMailchimpWithAutomation(formData, leadScore, submissionType, aiAnalysis);
      console.log('✅ Added to Smart Mailchimp automation');
    } catch (e) {
      console.error('❌ Mailchimp failed:', e.message);
    }

    // Push to Clio Grow
    try {
      await createClioLead(formData, submissionType, leadScore);
    } catch (e) {
      console.error('❌ Clio Grow failed:', e.message);
    }

    // Send client confirmation email
    if (formData.email) {
      try {
        const clientEmailHtml = generateClientConfirmationEmail(formData, null, submissionType, leadScore.score);
        await sendEnhancedEmail({
          to: [formData.email, INTAKE_NOTIFY_TO],
          subject: 'Your Legal Strategy Guide + Next Steps - Jacobs Counsel',
          html: clientEmailHtml
        });
        console.log('✅ Client confirmation sent');
      } catch (e) {
        console.error('❌ Client email failed:', e.message);
      }
    }

    res.json({ 
      ok: true, 
      submissionId, 
      leadScore: leadScore.score,
      message: 'Guide download processed successfully'
    });

  } catch (error) {
    console.error('💥 Primary guide download error:', error);
    res.status(500).json({ ok: false, error: error.message });
  }
});

// Specialized Guide Download Endpoint
app.post('/download-specialized-guide', async (req, res) => {
  try {
    const { guideType, guideName, pdfUrl, timestamp } = req.body;
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

// Add this new endpoint right after your other endpoints
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
    if (event === 'abandoned') {
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
  console.log(`🚀 Jacobs Counsel POWERHOUSE System running on port ${PORT}`);
  console.log(`📊 Features: AI Analysis, Lead Scoring, Smart Mailchimp, Motion, Clio, Conversational AI, Document Generation, CLV Prediction`);
  console.log(`📧 Email: ${MS_GRAPH_SENDER ? '✅ Configured' : '❌ Not configured'}`);
  console.log(`🤖 OpenAI: ${OPENAI_API_KEY ? '✅ Configured' : '❌ Not configured'}`);
  console.log(`📮 Mailchimp: ${MAILCHIMP_API_KEY ? '✅ Configured' : '❌ Not configured'}`);
  console.log(`⚡ Motion: ${MOTION_API_KEY ? '✅ Configured' : '❌ Not configured'}`);
  console.log(`⚖️ Clio Grow: ${CLIO_GROW_INBOX_TOKEN ? '✅ Configured' : '❌ Not configured'}`);
  console.log(`🎯 POWERHOUSE MODE: ACTIVATED`);
});
