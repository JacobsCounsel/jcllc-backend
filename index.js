// index.js — Jacobs Counsel Unified Intake System
// Features: AI-powered lead scoring, Mailchimp automation, Motion integration, intelligent routing

import express from 'express';
import cors from 'cors';
import multer from 'multer';

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
    'brand-protection': 35
  };
  score += baseScores[submissionType] || 30;
  scoreFactors.push(`Base ${submissionType}: +${baseScores[submissionType] || 30}`);

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
    if (formData.servicePreference?.includes('Portfolio') || formData.servicePreference?.includes('5000')) {
      score += 40; scoreFactors.push('Comprehensive portfolio: +40');
    }
    
    if (formData.businessStage === 'Mature (5+ years)') { score += 20; scoreFactors.push('Established business: +20'); }
    if (formData.geographicScope === 'National' || formData.geographicScope === 'International') {
      score += 25; scoreFactors.push('National/International scope: +25');
    }
    
    if (formData.protectionGoal === 'enforcement') { score += 35; scoreFactors.push('Enforcement need: +35'); }
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
- Practice focus: Business formation, estate planning, brand protection
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

// ==================== SMART MAILCHIMP FUNCTIONS ====================

function generateSmartTags(formData, leadScore, submissionType) {
  const tags = [
    `intake-${submissionType}`,
    `date-${new Date().toISOString().split('T')[0]}`
  ];
  
  // Smart score tags (like VIP vs regular customer)
  if (leadScore.score >= 70) tags.push('high-priority');
  else if (leadScore.score >= 50) tags.push('medium-priority');
  else tags.push('standard-priority');
  
  // BRAND PROTECTION - Remember what they want
  if (submissionType === 'brand-protection') {
    // What's their main goal?
    if (formData.protectionGoal?.includes('enforcement')) tags.push('needs-enforcement');
    if (formData.protectionGoal?.includes('registration')) tags.push('wants-trademark');
    if (formData.protectionGoal?.includes('clearance')) tags.push('needs-search');
    if (formData.protectionGoal?.includes('unsure')) tags.push('needs-education');
    
    // What industry? (affects what we talk about)
    if (formData.industry?.includes('Technology')) tags.push('tech-business');
    if (formData.industry?.includes('Healthcare')) tags.push('healthcare-business');
    if (formData.industry?.includes('Fashion')) tags.push('fashion-business');
    
    // Are they urgent?
    if (formData.urgency?.includes('Immediate')) tags.push('urgent-help');
    
    // What's their budget level?
    if (formData.servicePreference?.includes('5000') || formData.servicePreference?.includes('Portfolio')) {
      tags.push('high-budget');
    } else if (formData.servicePreference?.includes('1950') || formData.servicePreference?.includes('Single')) {
      tags.push('medium-budget');
    } else if (formData.servicePreference?.includes('750')) {
      tags.push('budget-conscious');
    }
  }
  
  // ESTATE PLANNING - Remember their wealth level and needs
  if (submissionType === 'estate-intake') {
    // How much money do they have?
    const estate = parseFloat(formData.grossEstate?.replace(/[,$]/g, '') || '0');
    if (estate > 5000000) tags.push('very-wealthy');
    else if (estate > 2000000) tags.push('wealthy');
    else if (estate > 1000000) tags.push('comfortable');
    else tags.push('modest-assets');
    
    // What do they prefer?
    if (formData.packagePreference?.includes('trust')) tags.push('wants-trust');
    if (formData.packagePreference?.includes('will')) tags.push('wants-will');
    if (!formData.packagePreference || formData.packagePreference.includes('sure')) tags.push('needs-guidance');
    
    // Do they own a business?
    if (formData.ownBusiness === 'Yes') tags.push('business-owner');
    
    // Are they married with kids?
    if (formData.maritalStatus === 'Married') tags.push('married');
    if (formData.hasMinorChildren === 'Yes') tags.push('has-kids');
  }
  
  // BUSINESS FORMATION - Remember their startup type
  if (submissionType === 'business-formation') {
    // Are they trying to raise money?
    if (formData.investmentPlan?.includes('vc')) tags.push('vc-startup');
    if (formData.investmentPlan?.includes('angel')) tags.push('angel-startup');
    if (formData.investmentPlan?.includes('self')) tags.push('bootstrap-startup');
    
    // What industry?
    if (formData.businessType?.includes('Technology')) tags.push('tech-startup');
    if (formData.businessType?.includes('Healthcare')) tags.push('health-startup');
    
    // Experience level?
    if (formData.founderExperience?.includes('first')) tags.push('first-timer');
    if (formData.founderExperience?.includes('Serial')) tags.push('experienced');
  }
  
  return tags;
}

function buildSmartFields(formData, leadScore, submissionType) {
  const fields = {
    // Basic info
    FNAME: formData.firstName || formData.fullName?.split(' ')[0] || '',
    LNAME: formData.lastName || formData.fullName?.split(' ').slice(1).join(' ') || '',
    EMAIL: formData.email,
    PHONE: formData.phone || '',
    BUSINESS: formData.businessName || '',
    
    // Smart info that makes emails personal
    LEAD_SCORE: leadScore.score,
    PRIORITY: leadScore.score >= 70 ? 'High Priority' : 'Standard',
    SERVICE_TYPE: submissionType.replace('-', ' '),
  };
  
  // BRAND PROTECTION - Remember their specific situation
  if (submissionType === 'brand-protection') {
    fields.BP_GOAL = formData.protectionGoal || 'trademark protection';
    fields.BP_INDUSTRY = formData.industry || 'your industry';
    fields.BP_BUSINESS = formData.businessName || 'your business';
    fields.BP_STAGE = formData.businessStage || '';
    fields.BP_URGENT = formData.urgency?.includes('Immediate') ? 'Yes' : 'No';
  }
  
  // ESTATE PLANNING - Remember their wealth and family
  if (submissionType === 'estate-intake') {
    const estate = parseFloat(formData.grossEstate?.replace(/[,$]/g, '') || '0');
    fields.ESTATE_AMOUNT = estate > 0 ? '$' + estate.toLocaleString() : 'your estate';
    fields.ESTATE_LEVEL = estate > 2000000 ? 'substantial' : 'moderate';
    fields.PACKAGE_WANT = formData.packagePreference || 'estate planning';
    fields.HAS_BUSINESS = formData.ownBusiness === 'Yes' ? 'Yes' : 'No';
    fields.HAS_KIDS = formData.hasMinorChildren === 'Yes' ? 'Yes' : 'No';
    fields.MARRIED = formData.maritalStatus === 'Married' ? 'Yes' : 'No';
  }
  
  // BUSINESS FORMATION - Remember their startup dreams
  if (submissionType === 'business-formation') {
    fields.STARTUP_TYPE = formData.investmentPlan || 'startup';
    fields.FOUNDER_EXP = formData.founderExperience?.includes('first') ? 'first-time' : 'experienced';
    fields.BUSINESS_TYPE = formData.businessType || 'business';
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
      // Member might already exist, try to update
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
    name: `${submissionType.toUpperCase()}: ${formData.firstName || formData.fullName || 'New Client'} ${formData.lastName || ''}`,
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
Business: ${formData.businessName || 'N/A'}
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

// ==================== EMAIL TEMPLATES ====================

function generateInternalAlert(formData, leadScore, submissionType, aiAnalysis, submissionId) {
  const isHighValue = leadScore.score >= 70;
  const urgentFlag = formData.urgency?.includes('Immediate') || aiAnalysis?.riskFlags?.includes('urgent');

  return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>${isHighValue ? '🔥 HIGH VALUE' : ''} ${urgentFlag ? '⚡ URGENT' : ''} New ${submissionType.toUpperCase()} Intake</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, Arial, sans-serif; line-height: 1.6; color: #0f172a;">
    <div style="max-width: 700px; margin: 0 auto; padding: 20px;">
        ${isHighValue ? `
        <div style="background: linear-gradient(135deg, #dc2626, #b91c1c); color: white; padding: 16px; border-radius: 12px; margin-bottom: 24px; text-align: center;">
            <h2 style="margin: 0; font-size: 24px;">🔥 HIGH VALUE LEAD ALERT</h2>
            <p style="margin: 8px 0 0; font-size: 18px;">Score: ${leadScore.score}/100</p>
        </div>
        ` : ''}
        
        <h1 style="color: #ff4d00; margin: 0 0 24px;">New ${submissionType.replace('-', ' ').toUpperCase()} Intake</h1>
        
        <div style="background: #f8fafc; padding: 24px; border-radius: 12px; margin: 24px 0; border-left: 6px solid #ff4d00;">
            <h3 style="margin: 0 0 16px; color: #0b1f1e;">Contact Information</h3>
            <p><strong>Name:</strong> ${formData.firstName || formData.fullName || ''} ${formData.lastName || ''}</p>
            <p><strong>Email:</strong> <a href="mailto:${formData.email}">${formData.email}</a></p>
            <p><strong>Phone:</strong> ${formData.phone || 'Not provided'}</p>
            <p><strong>Business:</strong> ${formData.businessName || 'Not specified'}</p>
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
        
        <p style="font-size: 16px; margin: 16px 0;">Hi <strong>${formData.firstName || formData.fullName?.split(' ')[0] || 'there'}</strong>,</p>
        
        <p style="font-size: 16px; margin: 16px 0;">We've received your ${submissionType.replace('-', ' ')} intake and will review it within <strong>1 business day</strong>. Our AI analysis has identified key opportunities for your situation.</p>
        
        ${leadScore >= 70 ? `
        <div style="background: #fef2f2; border: 2px solid #fecaca; padding: 20px; border-radius: 12px; margin: 24px 0;">
            <h3 style="color: #dc2626; margin: 0 0 12px;">Priority Review</h3>
            <p style="margin: 0; color: #7f1d1d;">Based on your responses, we've marked your intake for priority review. You can expect to hear from us within a few hours.</p>
        </div>
        ` : ''}
        
        ${price ? `
        <div style="background: #f0fdf4; padding: 20px; border-radius: 12px; margin: 24px 0; border: 2px solid #bbf7d0; text-align: center;">
            <p style="margin: 0; font-size: 18px; font-weight: 600; color: #166534;">Estimated Investment: $${typeof price === 'number' ? price.toLocaleString() : price}</p>
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
    version: '2.0.0',
    endpoints: ['/estate-intake', '/business-formation-intake', '/brand-protection-intake', '/add-subscriber'],
    features: ['AI Analysis', 'Lead Scoring', 'Smart Mailchimp Automation', 'Motion Integration']
  });
});

// Estate Planning Intake
app.post('/estate-intake', upload.array('document'), async (req, res) => {
  try {
    const formData = req.body || {};
    const files = req.files || [];
    const submissionId = formData.submissionId || `estate-${Date.now()}`;
    const submissionType = 'estate-intake';

    console.log(`📥 New ${submissionType} submission:`, formData.email);

    // Calculate lead score
    const leadScore = calculateLeadScore(formData, submissionType);
    console.log(`📊 Lead score: ${leadScore.score}/100`);

    // AI analysis
    const aiAnalysis = await analyzeIntakeWithAI(formData, submissionType, leadScore);
    console.log(`🤖 AI analysis completed`);

    // Process attachments
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
      if (CLIO_GROW_INBOX_TOKEN) {
        const clioPayload = {
          inbox_lead: {
            from_first: formData.firstName || '',
            from_last: formData.lastName || '',
            from_email: formData.email || '',
            from_phone: formData.phone || '',
            from_message: `Estate Planning Lead (Score: ${leadScore.score}/100)\nState: ${formData.state || '-'}\nMarital: ${formData.maritalStatus || '-'}\nMinors: ${formData.hasMinorChildren || '-'}\nPackage: ${formData.packagePreference || 'Not sure'}`,
            referring_url: req.headers.referer || 'https://jacobscounsellaw.com/intake',
            from_source: 'Jacobs Counsel Unified Intake'
          },
          inbox_lead_token: CLIO_GROW_INBOX_TOKEN
        };

        await fetch(`${CLIO_GROW_BASE}/inbox_leads`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(clioPayload)
        });

        console.log('✅ Pushed to Clio Grow');
      }
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
    if (service.includes('clearance')) priceEstimate = '$750+';
    else if (service.includes('single trademark')) priceEstimate = '$1,950+';
    else if (service.includes('multiple')) priceEstimate = '$3,500+';
    else if (service.includes('portfolio')) priceEstimate = '$5,000+';

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
      // Member might already exist, try to update tags
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
  console.log(`🚀 Jacobs Counsel Unified Intake System running on port ${PORT}`);
  console.log(`📊 Features: AI Analysis, Lead Scoring, Smart Mailchimp Automation, Motion Integration`);
  console.log(`📧 Email: ${MS_GRAPH_SENDER ? '✅ Configured' : '❌ Not configured'}`);
  console.log(`🤖 OpenAI: ${OPENAI_API_KEY ? '✅ Configured' : '❌ Not configured'}`);
  console.log(`📮 Mailchimp: ${MAILCHIMP_API_KEY ? '✅ Configured' : '❌ Not configured'}`);
  console.log(`⚡ Motion: ${MOTION_API_KEY ? '✅ Configured' : '❌ Not configured'}`);
  console.log(`⚖️ Clio Grow: ${CLIO_GROW_INBOX_TOKEN ? '✅ Configured' : '❌ Not configured'}`);
});
