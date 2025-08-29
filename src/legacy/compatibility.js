// src/legacy/compatibility.js - Backwards compatibility layer
// All existing functions preserved exactly as they were

import fetch from 'node-fetch';
import { Buffer } from 'buffer';
import validator from 'validator';
import { config } from '../config/environment.js';
import NodeCache from 'node-cache';

const cache = new NodeCache({ stdTTL: 600 });

// ==================== HELPER FUNCTIONS (Exact copies from original) ====================
export function escapeHtml(unsafe) {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export function sanitizeInput(data) {
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

// ==================== PERSONALIZED RESOURCE RECOMMENDATIONS ====================
export function getPersonalizedResources(formData, submissionType, leadScore) {
  const resources = [];
  
  // High-value leads get premium resource packages
  if (leadScore.score >= 70) {
    resources.push({
      title: "🎯 Priority Client Resource Package",
      description: "Exclusive resources for high-value clients like yourself",
      items: [
        "Private consultation scheduling link",
        "Advanced legal strategy guides",
        "Direct attorney contact information"
      ]
    });
  }
  
  // Service-specific resources
  switch (submissionType) {
    case 'estate-intake':
      const grossEstate = parseFloat(formData.grossEstate?.replace(/[,$]/g, '') || '0');
      
      if (grossEstate > 5000000) {
        resources.push({
          title: "🏛️ Ultra High Net Worth Estate Planning",
          description: "Specialized resources for estates over $5M",
          items: [
            "Dynasty Trust Planning Guide",
            "Estate Tax Minimization Strategies", 
            "Family Office Structure Options",
            "International Asset Protection"
          ]
        });
      } else if (grossEstate > 1000000) {
        resources.push({
          title: "💰 High Net Worth Estate Planning",
          description: "Advanced strategies for substantial estates",
          items: [
            "Revocable Trust vs Will Analysis",
            "Tax-Efficient Gifting Strategies",
            "Business Succession Planning",
            "Charitable Planning Options"
          ]
        });
      } else {
        resources.push({
          title: "📋 Essential Estate Planning",
          description: "Foundation documents and strategies",
          items: [
            "Estate Planning Basics Checklist",
            "Healthcare Directive Templates",
            "Guardian Selection Guide",
            "Asset Inventory Worksheet"
          ]
        });
      }
      
      if (formData.ownBusiness === 'Yes') {
        resources.push({
          title: "🏢 Business Owner Estate Planning",
          description: "Special considerations for business owners",
          items: [
            "Business Valuation for Estate Planning",
            "Buy-Sell Agreement Templates",
            "Key Person Insurance Guide",
            "Succession Planning Timeline"
          ]
        });
      }
      break;
      
    case 'business-formation':
      if (formData.investmentPlan === 'vc') {
        resources.push({
          title: "🚀 VC-Ready Business Formation",
          description: "Resources for venture-backed companies",
          items: [
            "Delaware C-Corp Setup Guide",
            "Equity Incentive Plan Templates",
            "Investment Agreement Prep",
            "IP Assignment Agreements",
            "Board Resolution Templates"
          ]
        });
      } else if (formData.investmentPlan === 'angel') {
        resources.push({
          title: "👼 Angel-Ready Business Structure",
          description: "Preparing for angel investment",
          items: [
            "SAFE Agreement Guide",
            "Convertible Note Terms",
            "Cap Table Management",
            "Due Diligence Checklist"
          ]
        });
      } else {
        resources.push({
          title: "🏗️ Business Formation Essentials",
          description: "Foundation for new businesses",
          items: [
            "Entity Selection Guide (LLC vs Corp)",
            "Operating Agreement Templates",
            "EIN Application Process",
            "Business Banking Setup",
            "Initial Compliance Calendar"
          ]
        });
      }
      
      const revenue = formData.projectedRevenue || '';
      if (revenue.includes('over25m') || revenue.includes('5m-25m')) {
        resources.push({
          title: "📈 High-Growth Business Resources",
          description: "Scaling your business legally",
          items: [
            "Employment Law Compliance Guide",
            "Contract Template Library",
            "International Expansion Checklist",
            "M&A Preparation Guide"
          ]
        });
      }
      break;
      
    case 'brand-protection':
      if (formData.servicePreference?.includes('Portfolio')) {
        resources.push({
          title: "🛡️ Comprehensive Brand Portfolio",
          description: "Managing multiple intellectual property assets",
          items: [
            "Trademark Portfolio Management",
            "Global Filing Strategy Guide",
            "Brand Monitoring Setup",
            "Enforcement Action Playbook",
            "Licensing Agreement Templates"
          ]
        });
      } else {
        resources.push({
          title: "™️ Essential Brand Protection",
          description: "Protecting your core brand assets",
          items: [
            "Trademark Application Guide",
            "Logo & Slogan Protection",
            "Domain Name Strategy",
            "Social Media Handle Security",
            "Cease & Desist Templates"
          ]
        });
      }
      
      if (formData.protectionGoal === 'enforcement') {
        resources.push({
          title: "⚔️ Brand Enforcement Arsenal",
          description: "Taking action against infringers",
          items: [
            "Infringement Documentation Guide",
            "DMCA Takedown Procedures",
            "Opposition & Cancellation Strategies",
            "International Enforcement Options"
          ]
        });
      }
      break;
      
    case 'outside-counsel':
      const budget = formData.budget || '';
      if (budget.includes('10K+')) {
        resources.push({
          title: "🎯 Strategic Legal Partnership",
          description: "High-level legal strategy resources",
          items: [
            "General Counsel Transition Guide",
            "Legal Budget Planning Template",
            "Vendor Management Best Practices",
            "Risk Assessment Framework",
            "Compliance Program Development"
          ]
        });
      } else {
        resources.push({
          title: "⚖️ Efficient Legal Solutions",
          description: "Cost-effective legal strategies",
          items: [
            "Legal Issue Triage Guide",
            "Contract Review Checklist",
            "Preventive Legal Measures",
            "Legal Technology Tools",
            "Self-Help Legal Resources"
          ]
        });
      }
      break;
      
    case 'legal-strategy-builder':
      // Personalized based on assessment results
      const score = leadScore.score;
      if (score >= 80) {
        resources.push({
          title: "🚨 Urgent Legal Action Required",
          description: "High-risk areas need immediate attention",
          items: [
            "Emergency Legal Checklist",
            "Risk Mitigation Strategies", 
            "Compliance Audit Template",
            "Crisis Management Playbook",
            "Priority Legal Tasks List"
          ]
        });
      } else if (score >= 60) {
        resources.push({
          title: "⚠️ Legal Optimization Needed",
          description: "Important improvements to consider",
          items: [
            "Legal Health Checkup Guide",
            "Compliance Improvement Plan",
            "Contract Review Priority List",
            "Policy Development Templates",
            "Legal Process Improvement"
          ]
        });
      } else {
        resources.push({
          title: "✅ Legal Foundation Building",
          description: "Strengthening your legal position",
          items: [
            "Legal Best Practices Guide",
            "Preventive Legal Measures",
            "Document Organization System",
            "Regular Legal Maintenance",
            "Legal Education Resources"
          ]
        });
      }
      break;
  }
  
  // Universal urgency resources
  if (formData.urgency?.includes('Immediate') || formData.urgency?.includes('urgent')) {
    resources.unshift({
      title: "🆘 Urgent Legal Assistance",
      description: "Fast-track resources for immediate needs",
      items: [
        "Emergency consultation scheduling",
        "24-hour document review service",
        "Expedited legal analysis",
        "Crisis management protocols"
      ]
    });
  }
  
  // Business-specific additions
  if (formData.businessName || formData.companyName) {
    resources.push({
      title: "🏢 Business Legal Essentials",
      description: "Core legal resources for business owners",
      items: [
        "Business Legal Health Checklist",
        "Employee Handbook Templates",
        "Vendor Agreement Library",
        "Corporate Governance Guide",
        "Business Insurance Review"
      ]
    });
  }
  
  return resources;
}

// ==================== AI ANALYSIS (Exact copy) ====================
export async function analyzeIntakeWithAI(formData, submissionType, leadScore) {
  if (!config.openai.apiKey) return { analysis: null, recommendations: null, riskFlags: [] };
  
  const cacheKey = `ai_analysis_${submissionType}_${leadScore.score}_${JSON.stringify(formData).substring(0, 50)}`;
  const cached = cache.get(cacheKey);
  if (cached) return cached;
  
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.openai.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: config.openai.model,
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

// ==================== MAILCHIMP FUNCTIONS (Exact copies) ====================
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

  // Service-specific tags (exact copy)
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

  // Add service-specific fields (exact copy of original logic)
  if (submissionType === 'estate-intake') {
    const estate = parseFloat(formData.grossEstate?.replace(/[,$]/g, '') || '0');
    fields.ESTATE = estate > 0 ? '$' + estate.toLocaleString() : 'Not specified';
    fields.HASBIZ = formData.ownBusiness === 'Yes' ? 'Yes' : 'No';
    fields.HAS_KIDS = formData.hasMinorChildren || 'Not specified';
    fields.MARITAL = formData.maritalStatus || '';
    fields.REALESTATE = formData.otherRealEstate || '';
    fields.GOAL = formData.planningGoal || '';
  }

  if (submissionType === 'business-formation') {
    fields.STARTUP = formData.investmentPlan || 'Not specified';
    fields.BIZTYPE = formData.businessType || 'Not specified';
    fields.REVENUE = formData.projectedRevenue || '';
    fields.BIZ_GOAL = formData.businessGoal || '';
  }

  if (submissionType === 'brand-protection') {
    fields.BIZ_STAGE = formData.businessStage || '';
    fields.PROTECT = formData.protectionGoal || '';
  }

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

export async function addToMailchimpWithAutomation(formData, leadScore, submissionType) {
  if (!config.mailchimp.apiKey || !config.mailchimp.audienceId) {
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
      `https://${config.mailchimp.server}.api.mailchimp.com/3.0/lists/${config.mailchimp.audienceId}/members`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${config.mailchimp.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(memberData)
      }
    );

    if (response.status === 400) {
      const crypto = await import('crypto');
      const hashedEmail = crypto.createHash('md5').update(formData.email.toLowerCase()).digest('hex');
    
      const updateResponse = await fetch(
        `https://${config.mailchimp.server}.api.mailchimp.com/3.0/lists/${config.mailchimp.audienceId}/members/${hashedEmail}`,
        {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${config.mailchimp.apiKey}`,
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

// ==================== MICROSOFT GRAPH (Exact copies) ====================
export async function getGraphToken() {
  if (!config.microsoft.tenantId || !config.microsoft.clientId || !config.microsoft.clientSecret) {
    throw new Error('MS Graph credentials missing');
  }
  
  const body = new URLSearchParams({
    client_id: config.microsoft.clientId,
    client_secret: config.microsoft.clientSecret,
    scope: 'https://graph.microsoft.com/.default',
    grant_type: 'client_credentials'
  });
  
  const response = await fetch(
    `https://login.microsoftonline.com/${config.microsoft.tenantId}/oauth2/v2.0/token`,
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

export async function sendEnhancedEmail({ to, subject, html, priority = 'normal', attachments = [] }) {
  if (!config.microsoft.sender) throw new Error('MS_GRAPH_SENDER not configured');
  
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
    `https://graph.microsoft.com/v1.0/users/${encodeURIComponent(config.microsoft.sender)}/sendMail`,
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

// ==================== CLIO GROW (Exact copy) ====================
export async function createClioLead(formData, submissionType, leadScore) {
  if (!config.clio.inboxToken) {
    console.log('Clio Grow not configured, skipping');
    return { skipped: true };
  }
  
  // Extract name logic (exact copy)
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
    inbox_lead_token: config.clio.inboxToken
  };
  
  try {
    const response = await fetch(`${config.clio.base}/inbox_leads`, {
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

// ==================== EMAIL TEMPLATES (Exact copies of your existing templates) ====================

// Import getCalendlyLink from the new module
import { getCalendlyLink } from '../services/leadScoring.js';

export function generateClientConfirmationEmail(formData, price, submissionType, leadScore) {
  const clientName = formData.firstName || formData.fullName?.split(' ')[0] || formData.contactName?.split(' ')[0] || 'there';
  const calendlyLink = getCalendlyLink(submissionType, leadScore);
  const personalizedResources = getPersonalizedResources(formData, submissionType, leadScore);
  
  // Service-specific content
  let serviceTitle = '';
  let serviceMessage = '';
  let nextSteps = '';
  let timelineMessage = '';
  
  switch (submissionType) {
    case 'estate-intake':
      serviceTitle = 'Estate Planning Consultation Request';
      serviceMessage = `Thank you for trusting us with your estate planning needs. Based on your submission, we'll prepare a customized strategy to protect your ${formData.grossEstate ? `$${parseFloat(formData.grossEstate.replace(/[,$]/g, '')).toLocaleString()}` : ''} estate and ensure your family's financial security.`;
      nextSteps = `
        <li>Review your estate planning goals and current assets</li>
        <li>Analyze tax implications and protection strategies</li>
        <li>Prepare recommendations for ${formData.packagePreference?.includes('trust') ? 'trust-based planning' : 'your estate plan'}</li>
        <li>Schedule your consultation to discuss next steps</li>
      `;
      timelineMessage = 'We typically respond within 4-6 hours for estate planning inquiries.';
      break;
      
    case 'business-formation':
      serviceTitle = 'Business Formation Consultation Request';
      serviceMessage = `Thank you for choosing us to help launch ${formData.businessName || 'your business'}. ${formData.investmentPlan === 'vc' ? 'As a VC-backed startup, we\'ll ensure your entity structure supports future funding rounds.' : formData.investmentPlan === 'angel' ? 'We\'ll structure your business to attract angel investors and scale effectively.' : 'We\'ll help you choose the optimal entity structure for your business goals.'}`;
      nextSteps = `
        <li>Analyze your business model and funding plans</li>
        <li>Recommend optimal entity structure (LLC, C-Corp, etc.)</li>
        <li>Prepare incorporation documents and operating agreements</li>
        <li>Set up compliance systems and investor protections</li>
      `;
      timelineMessage = 'Business formation consultations are typically scheduled within 24 hours.';
      break;
      
    case 'brand-protection':
      serviceTitle = 'Brand Protection Consultation Request';
      serviceMessage = `Thank you for taking proactive steps to protect ${formData.businessName || 'your brand'}. ${formData.businessStage === 'Mature (5+ years)' ? 'As an established business, comprehensive IP protection is crucial for maintaining your competitive advantage.' : 'Early brand protection is one of the smartest investments you can make for long-term success.'}`;
      nextSteps = `
        <li>Conduct comprehensive trademark clearance searches</li>
        <li>Develop brand protection strategy and filing roadmap</li>
        <li>Prepare trademark applications and portfolio management</li>
        <li>Set up monitoring systems for brand infringement</li>
      `;
      timelineMessage = 'Brand protection consultations are typically scheduled within 12 hours.';
      break;
      
    case 'outside-counsel':
      serviceTitle = 'Outside Counsel Consultation Request';
      serviceMessage = `Thank you for considering Jacobs Counsel as your ${formData.companyName ? formData.companyName + '\'s' : 'organization\'s'} legal partner. We understand the importance of having trusted legal counsel to navigate complex business challenges.`;
      nextSteps = `
        <li>Review your specific legal needs and challenges</li>
        <li>Assess current legal gaps and risk exposure</li>
        <li>Propose ongoing counsel structure and engagement model</li>
        <li>Establish communication protocols and service levels</li>
      `;
      timelineMessage = 'Outside counsel inquiries receive priority scheduling within 6 hours.';
      break;
      
    case 'legal-strategy-builder':
      serviceTitle = 'Legal Strategy Assessment Results';
      serviceMessage = `Thank you for completing our Legal Strategy Builder assessment. Your score of ${formData.assessmentScore || leadScore.score}/100 indicates ${leadScore.score >= 70 ? 'strong legal foundations with opportunities for optimization' : leadScore.score >= 50 ? 'solid fundamentals with key areas needing attention' : 'significant opportunities to strengthen your legal position'}.`;
      nextSteps = `
        <li>Deep-dive consultation on your assessment results</li>
        <li>Priority ranking of legal initiatives for maximum impact</li>
        <li>Custom legal roadmap for the next 12 months</li>
        <li>Implementation support and ongoing guidance</li>
      `;
      timelineMessage = 'Strategy consultations are scheduled within 2-4 hours for high-scoring assessments.';
      break;
      
    default:
      serviceTitle = 'Consultation Request Received';
      serviceMessage = 'Thank you for your interest in our legal services. We\'ve received your request and will be in touch soon.';
      nextSteps = `
        <li>Review your specific legal needs</li>
        <li>Prepare customized recommendations</li>
        <li>Schedule consultation to discuss next steps</li>
      `;
      timelineMessage = 'We typically respond within 24 hours.';
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
    
    <!-- Header -->
    <div style="background: linear-gradient(135deg, #1f2937, #374151); padding: 40px 30px; text-align: center;">
      <img src="https://jacobscounsellaw.com/logo-white.png" alt="Jacobs Counsel" style="height: 40px; margin-bottom: 20px;" onerror="this.style.display='none'">
      <h1 style="color: #ffffff; font-size: 24px; font-weight: 700; margin: 0; line-height: 1.3;">${serviceTitle}</h1>
      <p style="color: #e5e7eb; margin: 8px 0 0; font-size: 16px;">Confirmation & Next Steps</p>
    </div>
    
    <!-- Main Content -->
    <div style="padding: 40px 30px;">
      <p style="font-size: 18px; margin: 0 0 20px; font-weight: 600;">Hello ${clientName},</p>
      
      <p style="font-size: 16px; line-height: 1.6; margin: 0 0 24px; color: #4b5563;">${serviceMessage}</p>
      
      ${price ? `
      <div style="background-color: #f0f9ff; border: 1px solid #0ea5e9; border-radius: 8px; padding: 20px; margin: 24px 0;">
        <h3 style="color: #0369a1; margin: 0 0 8px; font-size: 16px;">Investment Range</h3>
        <p style="color: #0369a1; font-size: 20px; font-weight: 700; margin: 0;">${typeof price === 'number' ? '$' + price.toLocaleString() : price}</p>
      </div>
      ` : ''}
      
      <div style="background-color: #f8fafc; border-radius: 8px; padding: 24px; margin: 24px 0;">
        <h3 style="color: #1f2937; margin: 0 0 16px; font-size: 18px;">What Happens Next:</h3>
        <ul style="color: #4b5563; line-height: 1.6; margin: 0; padding-left: 20px;">
          ${nextSteps}
        </ul>
      </div>
      
      <div style="text-align: center; margin: 32px 0;">
        <a href="${calendlyLink}" 
           style="display: inline-block; background-color: #ff4d00; color: #ffffff; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; transition: background-color 0.2s;">
          Schedule Your Consultation
        </a>
        <p style="color: #6b7280; font-size: 14px; margin: 12px 0 0;">${timelineMessage}</p>
      </div>
      
      ${leadScore.score >= 70 ? `
      <div style="background: linear-gradient(135deg, #dc2626, #ef4444); color: white; padding: 20px; border-radius: 8px; margin: 24px 0; text-align: center;">
        <h3 style="margin: 0 0 8px; font-size: 16px;">Priority Status</h3>
        <p style="margin: 0; font-size: 14px;">Your submission has been flagged for expedited review due to complexity and value.</p>
      </div>
      ` : ''}
      
      <!-- Personalized Resources Section -->
      ${personalizedResources.length > 0 ? `
      <div style="background-color: #f0f9ff; border: 1px solid #0ea5e9; border-radius: 8px; padding: 24px; margin: 24px 0;">
        <h3 style="color: #0369a1; margin: 0 0 20px; font-size: 18px;">📚 Personalized Resources for You</h3>
        <p style="color: #0369a1; margin: 0 0 20px; font-size: 14px;">
          Based on your specific needs and situation, here are some resources to help you prepare:
        </p>
        
        ${personalizedResources.map(resource => `
        <div style="background-color: #ffffff; border-radius: 6px; padding: 16px; margin: 0 0 16px; border-left: 4px solid #0ea5e9;">
          <h4 style="color: #1f2937; margin: 0 0 8px; font-size: 16px; font-weight: 600;">${resource.title}</h4>
          <p style="color: #4b5563; margin: 0 0 12px; font-size: 14px; line-height: 1.5;">${resource.description}</p>
          <ul style="color: #6b7280; margin: 0; padding-left: 20px; font-size: 13px; line-height: 1.6;">
            ${resource.items.map(item => `<li style="margin: 4px 0;">${item}</li>`).join('')}
          </ul>
        </div>
        `).join('')}
        
        <div style="background-color: #fef7ed; border: 1px solid #fed7aa; border-radius: 6px; padding: 16px; margin-top: 16px;">
          <p style="color: #9a3412; margin: 0; font-size: 13px; line-height: 1.5;">
            <strong>📝 Note:</strong> These resources will be discussed in detail during your consultation. 
            Come prepared with any questions about how they apply to your specific situation.
          </p>
        </div>
      </div>
      ` : ''}
      
      <div style="border-top: 1px solid #e5e7eb; padding-top: 24px; margin-top: 32px;">
        <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 0 0 16px;">
          In the meantime, feel free to reach out with any questions:
        </p>
        <p style="color: #4b5563; margin: 8px 0;">
          📧 <a href="mailto:drew@jacobscounsellaw.com" style="color: #ff4d00; text-decoration: none;">drew@jacobscounsellaw.com</a><br>
          📞 <a href="tel:+15551234567" style="color: #ff4d00; text-decoration: none;">Available for urgent matters</a><br>
          🌐 <a href="https://jacobscounsellaw.com" style="color: #ff4d00; text-decoration: none;">jacobscounsellaw.com</a>
        </p>
      </div>
      
      <div style="text-align: center; margin-top: 32px;">
        <p style="color: #374151; font-size: 16px; font-weight: 600; margin: 0 0 8px;">Drew Jacobs, Esq.</p>
        <p style="color: #6b7280; font-size: 14px; margin: 0;">Founder & Managing Attorney<br>Jacobs Counsel LLC</p>
      </div>
    </div>
    
    <!-- Legal Disclaimer -->
    <div style="background-color: #fef2f2; border: 1px solid #fecaca; padding: 20px 30px; margin: 0;">
      <h4 style="color: #dc2626; margin: 0 0 12px; font-size: 16px; font-weight: 600;">⚖️ Important Legal Notice</h4>
      <p style="color: #7f1d1d; font-size: 13px; line-height: 1.5; margin: 0;">
        <strong>No Attorney-Client Relationship:</strong> This communication does not create an attorney-client relationship. 
        Any information you provide is not protected by attorney-client privilege until you have signed an engagement letter 
        with Jacobs Counsel LLC. Do not send confidential or sensitive information via email until a formal attorney-client 
        relationship has been established through a signed engagement agreement.
      </p>
    </div>
    
    <!-- Footer -->
    <div style="background-color: #f8fafc; padding: 20px 30px; border-top: 1px solid #e5e7eb;">
      <p style="color: #6b7280; font-size: 12px; text-align: center; margin: 0;">
        © 2025 Jacobs Counsel LLC. All rights reserved.<br>
        This communication is confidential and may be legally privileged once an attorney-client relationship is established.
      </p>
    </div>
  </div>
</body>
</html>`;
}

export function generateInternalAlert(formData, leadScore, submissionType, aiAnalysis, submissionId) {
  const isHighValue = leadScore.score >= 70;
  const calendlyLink = getCalendlyLink(submissionType, leadScore);
  
  // Extract client info
  const clientName = formData.firstName || formData.fullName?.split(' ')[0] || formData.contactName?.split(' ')[0] || 'Unknown';
  const clientLastName = formData.lastName || formData.fullName?.split(' ').slice(1).join(' ') || '';
  const businessName = formData.businessName || formData.companyName || '';
  
  // Service-specific analysis and next steps
  let serviceAnalysis = '';
  let actionItems = [];
  let urgencyLevel = 'Standard';
  
  switch (submissionType) {
    case 'estate-intake':
      const estateValue = formData.grossEstate ? parseFloat(formData.grossEstate.replace(/[,$]/g, '')) : 0;
      if (estateValue > 10000000) urgencyLevel = 'Ultra High - Call within 1 hour';
      else if (estateValue > 5000000) urgencyLevel = 'High - Call within 4 hours';
      else if (estateValue > 2000000) urgencyLevel = 'Medium - Call within 24 hours';
      
      serviceAnalysis = `Estate Value: ${estateValue > 0 ? '$' + estateValue.toLocaleString() : 'Not specified'}
      Package Interest: ${formData.packagePreference || 'Not specified'}
      Business Owner: ${formData.ownBusiness || 'Not specified'}
      Marital Status: ${formData.maritalStatus || 'Not specified'}
      Has Minor Children: ${formData.hasMinorChildren || 'Not specified'}`;
      
      actionItems = [
        'Review estate size and complexity',
        'Prepare estate tax analysis if applicable',
        'Draft consultation agenda focusing on trust vs will options',
        'Send calendar link with estate planning time slots',
        estateValue > 5000000 ? '🚨 High net worth - prepare advanced strategies' : 'Standard estate planning consultation'
      ];
      break;
      
    case 'business-formation':
      if (formData.investmentPlan === 'vc') urgencyLevel = 'Ultra High - VC timeline critical';
      else if (formData.investmentPlan === 'angel') urgencyLevel = 'High - Investor ready';
      
      serviceAnalysis = `Business: ${businessName || 'Not specified'}
      Funding Plan: ${formData.investmentPlan || 'Not specified'}
      Business Type: ${formData.businessType || 'Not specified'}
      Revenue Projection: ${formData.projectedRevenue || 'Not specified'}
      Package: ${formData.selectedPackage || 'Not specified'}`;
      
      actionItems = [
        'Analyze funding timeline and investor requirements',
        'Prepare entity structure recommendations',
        'Review cap table and equity plans if VC/Angel',
        'Draft incorporation timeline and checklist',
        formData.investmentPlan === 'vc' ? '🚨 VC-backed - prepare Series A documentation' : 'Standard business formation'
      ];
      break;
      
    case 'brand-protection':
      if (formData.businessStage === 'Mature (5+ years)') urgencyLevel = 'High - Established brand at risk';
      
      serviceAnalysis = `Business: ${businessName || 'Not specified'}
      Business Stage: ${formData.businessStage || 'Not specified'}
      Service Interest: ${formData.servicePreference || 'Not specified'}
      Protection Goal: ${formData.protectionGoal || 'Not specified'}
      Current IP: ${formData.currentIP || 'Not specified'}`;
      
      actionItems = [
        'Conduct preliminary trademark search',
        'Assess brand portfolio and gaps',
        'Prepare clearance and filing strategy',
        'Review existing IP assets',
        formData.protectionGoal?.includes('enforcement') ? '🚨 Enforcement needed - urgent consultation' : 'Standard brand protection'
      ];
      break;
      
    case 'outside-counsel':
      if (formData.urgency?.includes('Immediate')) urgencyLevel = 'Critical - Call immediately';
      
      serviceAnalysis = `Company: ${businessName || 'Not specified'}
      Budget Range: ${formData.budget || 'Not specified'}
      Timeline: ${formData.timeline || 'Not specified'}
      Legal Needs: ${formData.legalNeeds || 'Not specified'}
      Current Counsel: ${formData.currentCounsel || 'Not specified'}`;
      
      actionItems = [
        'Assess current legal gaps and risks',
        'Prepare retainer and engagement proposals',
        'Review budget and service level requirements',
        'Draft ongoing counsel structure',
        formData.budget?.includes('10K+') ? '💰 High-budget client - comprehensive services' : 'Standard outside counsel'
      ];
      break;
      
    case 'legal-strategy-builder':
      const assessmentScore = parseInt(formData.assessmentScore) || leadScore.score;
      if (assessmentScore >= 80) urgencyLevel = 'High - Strong candidate for comprehensive services';
      
      serviceAnalysis = `Assessment Score: ${assessmentScore}/100
      Role: ${formData.q1 || 'Not specified'}
      Business Stage: ${formData.q2 || 'Not specified'}
      Entity Structure: ${formData.q3 || 'Not specified'}
      IP Status: ${formData.q4 || 'Not specified'}
      Contract Status: ${formData.q5 || 'Not specified'}
      12-Month Goal: ${formData.q8 || 'Not specified'}`;
      
      actionItems = [
        'Review assessment responses for priority areas',
        'Prepare customized legal roadmap',
        'Identify immediate risk areas from assessment',
        'Draft consultation agenda with prioritized initiatives',
        assessmentScore >= 80 ? '🎯 High-scorer - ready for comprehensive engagement' : 'Standard strategy consultation'
      ];
      break;
      
    default:
      serviceAnalysis = `General inquiry for ${submissionType.replace('-', ' ')}`;
      actionItems = ['Review submission details', 'Prepare appropriate consultation', 'Send calendar link'];
  }
  
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${isHighValue ? '🔥 HIGH VALUE' : '📝'} New Lead - ${clientName} (${leadScore.score}/100)</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #f8fafc; color: #374151;">
  <div style="max-width: 700px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); margin-top: 20px; margin-bottom: 20px;">
    
    <!-- Header -->
    <div style="background: ${isHighValue ? 'linear-gradient(135deg, #dc2626, #ef4444)' : 'linear-gradient(135deg, #1f2937, #374151)'}; padding: 30px; text-align: center;">
      ${isHighValue ? '<div style="font-size: 24px; margin-bottom: 10px;">🔥</div>' : ''}
      <h1 style="color: #ffffff; font-size: 24px; font-weight: 700; margin: 0; line-height: 1.3;">
        ${isHighValue ? 'HIGH VALUE LEAD' : 'New Lead Alert'}
      </h1>
      <p style="color: #e5e7eb; margin: 8px 0 4px; font-size: 18px;">${submissionType.replace('-', ' ').toUpperCase()}</p>
      <p style="color: ${isHighValue ? '#fecaca' : '#e5e7eb'}; margin: 0; font-size: 16px; font-weight: 600;">Score: ${leadScore.score}/100</p>
    </div>
    
    <!-- Client Info -->
    <div style="background-color: ${isHighValue ? '#fef2f2' : '#f8fafc'}; padding: 25px; border-bottom: 1px solid #e5e7eb;">
      <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap;">
        <div>
          <h2 style="color: #1f2937; margin: 0 0 12px; font-size: 22px;">
            ${clientName} ${clientLastName}
            ${businessName ? `<span style="color: #6b7280; font-size: 16px; font-weight: normal;">(${businessName})</span>` : ''}
          </h2>
          <p style="color: #4b5563; margin: 4px 0; font-size: 16px;">
            📧 <a href="mailto:${formData.email}" style="color: #ff4d00; text-decoration: none;">${formData.email}</a>
          </p>
          ${formData.phone ? `<p style="color: #4b5563; margin: 4px 0; font-size: 16px;">
            📞 <a href="tel:${formData.phone}" style="color: #ff4d00; text-decoration: none;">${formData.phone}</a>
          </p>` : ''}
        </div>
        <div style="text-align: right; margin-top: 12px;">
          <div style="background-color: ${isHighValue ? '#dc2626' : '#6b7280'}; color: white; padding: 8px 16px; border-radius: 20px; font-size: 14px; font-weight: 600; display: inline-block;">
            ${urgencyLevel}
          </div>
        </div>
      </div>
    </div>
    
    <!-- Service Analysis -->
    <div style="padding: 25px;">
      <h3 style="color: #1f2937; margin: 0 0 16px; font-size: 18px; font-weight: 600;">📊 Service Analysis</h3>
      <div style="background-color: #f8fafc; border-radius: 8px; padding: 20px; border-left: 4px solid ${isHighValue ? '#dc2626' : '#6b7280'};">
        <pre style="font-family: Monaco, 'Courier New', monospace; font-size: 14px; color: #4b5563; margin: 0; white-space: pre-wrap; line-height: 1.5;">${serviceAnalysis}</pre>
      </div>
    </div>
    
    <!-- Action Items -->
    <div style="padding: 0 25px 25px;">
      <h3 style="color: #1f2937; margin: 0 0 16px; font-size: 18px; font-weight: 600;">✅ Action Items</h3>
      <ul style="color: #4b5563; line-height: 1.6; margin: 0; padding-left: 20px;">
        ${actionItems.map(item => `<li style="margin: 8px 0;">${item}</li>`).join('')}
      </ul>
    </div>
    
    <!-- AI Analysis (if available) -->
    ${aiAnalysis?.analysis ? `
    <div style="padding: 0 25px 25px;">
      <h3 style="color: #1f2937; margin: 0 0 16px; font-size: 18px; font-weight: 600;">🤖 AI Analysis</h3>
      <div style="background-color: #f0f9ff; border: 1px solid #0ea5e9; border-radius: 8px; padding: 20px;">
        <p style="color: #0369a1; margin: 0; font-size: 14px; line-height: 1.5;">${aiAnalysis.analysis}</p>
        ${aiAnalysis.recommendations ? `<p style="color: #0369a1; margin: 12px 0 0; font-weight: 600;">Recommendations: ${aiAnalysis.recommendations}</p>` : ''}
      </div>
    </div>
    ` : ''}
    
    <!-- Score Breakdown -->
    <div style="padding: 0 25px 25px;">
      <h3 style="color: #1f2937; margin: 0 0 16px; font-size: 18px; font-weight: 600;">🎯 Lead Score Breakdown</h3>
      <div style="background-color: #f8fafc; border-radius: 8px; padding: 20px;">
        <div style="margin-bottom: 12px;">
          <div style="background-color: #e5e7eb; height: 8px; border-radius: 4px; overflow: hidden;">
            <div style="background-color: ${leadScore.score >= 70 ? '#dc2626' : leadScore.score >= 50 ? '#f59e0b' : '#6b7280'}; height: 100%; width: ${leadScore.score}%; transition: width 0.3s;"></div>
          </div>
          <p style="color: #4b5563; font-size: 14px; margin: 8px 0 0;">Score: ${leadScore.score}/100 (${leadScore.priority})</p>
        </div>
        <details style="color: #6b7280; font-size: 14px;">
          <summary style="cursor: pointer; font-weight: 600; margin-bottom: 8px;">Score Factors</summary>
          <ul style="margin: 8px 0 0; padding-left: 20px;">
            ${leadScore.factors ? leadScore.factors.map(factor => `<li style="margin: 4px 0;">${factor}</li>`).join('') : '<li>Standard scoring applied</li>'}
          </ul>
        </details>
      </div>
    </div>
    
    <!-- Quick Actions -->
    <div style="background-color: #f8fafc; padding: 25px; border-top: 1px solid #e5e7eb;">
      <h3 style="color: #1f2937; margin: 0 0 16px; font-size: 18px; font-weight: 600;">🚀 Quick Actions</h3>
      <div style="display: flex; flex-wrap: wrap; gap: 12px;">
        <a href="mailto:${formData.email}?subject=Re: Your ${submissionType.replace('-', ' ')} inquiry&body=Hi ${clientName},%0D%0A%0D%0AThank you for your inquiry regarding ${submissionType.replace('-', ' ')}. I'd like to schedule a brief call to discuss your needs.%0D%0A%0D%0ABest regards,%0D%0ADrew Jacobs" 
           style="display: inline-block; background-color: #ff4d00; color: white; padding: 12px 20px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 14px;">
          📧 Email Client
        </a>
        <a href="${calendlyLink}" target="_blank"
           style="display: inline-block; background-color: #059669; color: white; padding: 12px 20px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 14px;">
          📅 Send Calendar Link
        </a>
        ${formData.phone ? `
        <a href="tel:${formData.phone}" 
           style="display: inline-block; background-color: #7c3aed; color: white; padding: 12px 20px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 14px;">
          📞 Call Now
        </a>` : ''}
      </div>
    </div>
    
    <!-- Raw Data (Collapsible) -->
    <div style="padding: 25px; border-top: 1px solid #e5e7eb;">
      <details style="color: #6b7280;">
        <summary style="cursor: pointer; font-weight: 600; font-size: 16px; margin-bottom: 12px; color: #1f2937;">📋 Raw Form Data</summary>
        <div style="background-color: #f8fafc; border-radius: 8px; padding: 20px; border: 1px solid #e5e7eb; overflow-x: auto;">
          <pre style="font-family: Monaco, 'Courier New', monospace; font-size: 12px; color: #4b5563; margin: 0; white-space: pre-wrap; line-height: 1.4;">${JSON.stringify(formData, null, 2)}</pre>
        </div>
      </details>
    </div>
    
    <!-- Footer -->
    <div style="background-color: #1f2937; padding: 20px; text-align: center;">
      <p style="color: #e5e7eb; font-size: 12px; margin: 0;">
        Submission ID: ${submissionId} | Generated at ${new Date().toLocaleString()}<br>
        <a href="https://jacobscounsellaw.com" style="color: #ff4d00; text-decoration: none;">Jacobs Counsel Backend</a>
      </p>
    </div>
  </div>
</body>
</html>`;
}

export function generateNewsletterWelcomeEmail(formData) {
  const clientName = formData.firstName || formData.fullName?.split(' ')[0] || 'there';
  
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to Legal Insights - Jacobs Counsel</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #f8fafc; color: #374151;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); margin-top: 20px; margin-bottom: 20px;">
    
    <!-- Header -->
    <div style="background: linear-gradient(135deg, #7c3aed, #a855f7); padding: 40px 30px; text-align: center;">
      <div style="font-size: 48px; margin-bottom: 16px;">⚖️</div>
      <h1 style="color: #ffffff; font-size: 24px; font-weight: 700; margin: 0; line-height: 1.3;">Welcome to Legal Insights!</h1>
      <p style="color: #e9d5ff; margin: 8px 0 0; font-size: 16px;">Your Weekly Legal Strategy Playbook</p>
    </div>
    
    <!-- Main Content -->
    <div style="padding: 40px 30px;">
      <p style="font-size: 18px; margin: 0 0 20px; font-weight: 600;">Hi ${clientName},</p>
      
      <p style="font-size: 16px; line-height: 1.6; margin: 0 0 24px; color: #4b5563;">
        Thank you for subscribing to Legal Insights! You've just joined a community of entrepreneurs, executives, 
        and high achievers who use smart legal strategies to protect and grow their wealth.
      </p>
      
      <!-- What You'll Get -->
      <div style="background-color: #f0f9ff; border-radius: 8px; padding: 24px; margin: 24px 0;">
        <h3 style="color: #0369a1; margin: 0 0 16px; font-size: 18px;">📬 What You'll Receive:</h3>
        <ul style="color: #0369a1; line-height: 1.8; margin: 0; padding-left: 20px; font-size: 15px;">
          <li><strong>Weekly Legal Insights:</strong> Practical strategies you can implement immediately</li>
          <li><strong>Case Studies:</strong> Real client scenarios and solutions (anonymized)</li>
          <li><strong>Legal Alerts:</strong> Important changes in law that affect your business or estate</li>
          <li><strong>Exclusive Resources:</strong> Guides, checklists, and templates for subscribers only</li>
          <li><strong>Expert Commentary:</strong> My analysis on trending legal issues</li>
        </ul>
      </div>
      
      <!-- Free Resources -->
      <div style="background-color: #ecfdf5; border-radius: 8px; padding: 24px; margin: 24px 0; text-align: center;">
        <h3 style="color: #059669; margin: 0 0 16px; font-size: 18px;">🎁 Subscriber-Only Resources</h3>
        <p style="color: #059669; margin: 0 0 20px; font-size: 14px; line-height: 1.5;">
          Access our exclusive legal resource library with guides on business formation, 
          estate planning, and brand protection.
        </p>
        <div style="display: grid; grid-template-columns: 1fr; gap: 12px; max-width: 400px; margin: 0 auto;">
          <a href="https://jacobscounsellaw.com/s/The-VC-Ready-Business-Formation-Blueprint.pdf" 
             style="display: inline-block; background-color: #059669; color: white; padding: 12px 20px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 14px;">
            📄 Business Formation Blueprint
          </a>
          <a href="https://jacobscounsellaw.com/s/Emergency-Brand-Protection-Playbook.pdf" 
             style="display: inline-block; background-color: #059669; color: white; padding: 12px 20px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 14px;">
            🛡️ Brand Protection Playbook
          </a>
          <a href="https://jacobscounsellaw.com/s/Estate-Planning-for-High-Achievers.pdf" 
             style="display: inline-block; background-color: #059669; color: white; padding: 12px 20px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 14px;">
            🏛️ Estate Planning Guide
          </a>
        </div>
      </div>
      
      <!-- Personal Touch -->
      <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 20px; margin: 24px 0;">
        <h3 style="color: #92400e; margin: 0 0 12px; font-size: 16px;">👋 A Personal Note from Drew</h3>
        <p style="color: #92400e; margin: 0; font-size: 14px; line-height: 1.6;">
          "I started this newsletter because I believe legal knowledge shouldn't be locked away in law books. 
          Every week, I share the same insights I give my clients—practical strategies that help you make 
          better decisions and avoid costly mistakes. Feel free to reply to any newsletter with questions!"
        </p>
        <p style="color: #92400e; margin: 12px 0 0; font-weight: 600; font-size: 14px;">— Drew Jacobs</p>
      </div>
      
      <!-- Next Steps -->
      <div style="background-color: #f8fafc; border-radius: 8px; padding: 24px; margin: 24px 0;">
        <h3 style="color: #1f2937; margin: 0 0 16px; font-size: 18px;">🚀 Ready for Personalized Legal Strategy?</h3>
        <p style="color: #4b5563; margin: 0 0 16px; font-size: 14px; line-height: 1.5;">
          If you need customized legal guidance for your specific situation, I'd be happy to help. 
          During a consultation, we can discuss your goals and create a roadmap to protect your interests.
        </p>
        <div style="text-align: center;">
          <a href="${config.calendlyLinks['general']}" 
             style="display: inline-block; background-color: #7c3aed; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 14px;">
            📅 Schedule Free Consultation
          </a>
        </div>
      </div>
      
      <div style="border-top: 1px solid #e5e7eb; padding-top: 24px; margin-top: 32px;">
        <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 0 0 16px;">
          Questions or suggestions for newsletter topics?
        </p>
        <p style="color: #4b5563; margin: 8px 0;">
          📧 <a href="mailto:drew@jacobscounsellaw.com" style="color: #ff4d00; text-decoration: none;">drew@jacobscounsellaw.com</a><br>
          🌐 <a href="https://jacobscounsellaw.com" style="color: #ff4d00; text-decoration: none;">jacobscounsellaw.com</a><br>
          📱 <a href="https://www.linkedin.com/in/jacobscounsel" style="color: #ff4d00; text-decoration: none;">Connect on LinkedIn</a>
        </p>
      </div>
      
      <div style="text-align: center; margin-top: 32px;">
        <p style="color: #374151; font-size: 16px; font-weight: 600; margin: 0 0 8px;">Drew Jacobs, Esq.</p>
        <p style="color: #6b7280; font-size: 14px; margin: 0;">Founder & Managing Attorney<br>Jacobs Counsel LLC</p>
      </div>
    </div>
    
    <!-- Legal Disclaimer -->
    <div style="background-color: #fef2f2; border: 1px solid #fecaca; padding: 20px 30px; margin: 0;">
      <h4 style="color: #dc2626; margin: 0 0 12px; font-size: 16px; font-weight: 600;">⚖️ Important Legal Notice</h4>
      <p style="color: #7f1d1d; font-size: 13px; line-height: 1.5; margin: 0;">
        <strong>No Attorney-Client Relationship:</strong> This newsletter and communications do not create an attorney-client relationship. 
        Content is for educational purposes only and should not be considered legal advice. 
        Do not send confidential information until a formal attorney-client relationship has been established.
      </p>
    </div>
    
    <!-- Footer -->
    <div style="background-color: #f8fafc; padding: 20px 30px; border-top: 1px solid #e5e7eb;">
      <p style="color: #6b7280; font-size: 12px; text-align: center; margin: 0;">
        © 2025 Jacobs Counsel LLC. All rights reserved.<br>
        <a href="https://jacobscounsellaw.com/unsubscribe" style="color: #6b7280; text-decoration: none;">Unsubscribe</a> | 
        <a href="https://jacobscounsellaw.com/privacy" style="color: #6b7280; text-decoration: none;">Privacy Policy</a>
      </p>
    </div>
  </div>
</body>
</html>`;
}

export function generateResourceThankYouEmail(formData, downloadLink) {
  const clientName = formData.firstName || formData.fullName?.split(' ')[0] || 'there';
  
  // Determine guide type and custom messaging
  let guideTitle = 'Legal Resource Guide';
  let guideDescription = 'comprehensive legal resource guide';
  let nextStepsMessage = 'This guide contains essential legal information to help protect your interests.';
  let consultationMessage = 'Schedule a consultation to discuss your specific legal needs.';
  
  if (formData.guideType === 'business-guide') {
    guideTitle = 'Business Formation Blueprint';
    guideDescription = 'VC-Ready Business Formation Blueprint';
    nextStepsMessage = 'This guide will help you structure your business for success and future funding.';
    consultationMessage = 'Schedule a business formation consultation to get your entity structured properly.';
  } else if (formData.guideType === 'brand-guide') {
    guideTitle = 'Brand Protection Playbook';
    guideDescription = 'Emergency Brand Protection Playbook';
    nextStepsMessage = 'This guide contains critical steps to protect your brand and intellectual property.';
    consultationMessage = 'Schedule a brand protection consultation to secure your trademarks and IP.';
  } else if (formData.guideType === 'estate-guide') {
    guideTitle = 'Estate Planning Guide';
    guideDescription = 'Estate Planning for High Achievers';
    nextStepsMessage = 'This guide outlines sophisticated strategies to protect and transfer your wealth.';
    consultationMessage = 'Schedule an estate planning consultation to create your customized protection plan.';
  }
  
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your ${guideTitle} - Jacobs Counsel</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #f8fafc; color: #374151;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); margin-top: 20px; margin-bottom: 20px;">
    
    <!-- Header -->
    <div style="background: linear-gradient(135deg, #059669, #10b981); padding: 40px 30px; text-align: center;">
      <div style="font-size: 48px; margin-bottom: 16px;">📚</div>
      <h1 style="color: #ffffff; font-size: 24px; font-weight: 700; margin: 0; line-height: 1.3;">Your ${guideTitle} is Ready!</h1>
      <p style="color: #d1fae5; margin: 8px 0 0; font-size: 16px;">Downloaded by 1,000+ Legal Professionals</p>
    </div>
    
    <!-- Main Content -->
    <div style="padding: 40px 30px;">
      <p style="font-size: 18px; margin: 0 0 20px; font-weight: 600;">Hi ${clientName},</p>
      
      <p style="font-size: 16px; line-height: 1.6; margin: 0 0 24px; color: #4b5563;">
        Thank you for downloading our ${guideDescription}! ${nextStepsMessage}
      </p>
      
      <!-- Download Button -->
      <div style="text-align: center; margin: 32px 0;">
        <a href="${downloadLink}" target="_blank"
           style="display: inline-block; background-color: #059669; color: #ffffff; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; margin-bottom: 12px;">
          📥 Download Your Guide
        </a>
        <p style="color: #6b7280; font-size: 14px; margin: 12px 0 0;">
          The download link will remain active for 30 days.
        </p>
      </div>
      
      <!-- What's Inside -->
      <div style="background-color: #f0f9ff; border-radius: 8px; padding: 24px; margin: 24px 0;">
        <h3 style="color: #0369a1; margin: 0 0 16px; font-size: 18px;">📋 What's Inside This Guide:</h3>
        <ul style="color: #0369a1; line-height: 1.6; margin: 0; padding-left: 20px; font-size: 15px;">
          ${formData.guideType === 'business-guide' ? `
          <li>Optimal entity structures for different business models</li>
          <li>VC and investor-ready incorporation strategies</li>
          <li>Cap table design and equity distribution plans</li>
          <li>Compliance systems and governance frameworks</li>
          <li>Tax optimization for startups and growth companies</li>
          ` : formData.guideType === 'brand-guide' ? `
          <li>Comprehensive trademark clearance and search strategies</li>
          <li>Brand protection portfolio development</li>
          <li>Domain name and social media protection</li>
          <li>Enforcement tactics against infringers</li>
          <li>International trademark filing strategies</li>
          ` : formData.guideType === 'estate-guide' ? `
          <li>Advanced estate planning strategies for high net worth individuals</li>
          <li>Trust structures for tax optimization and asset protection</li>
          <li>Business succession planning for entrepreneurs</li>
          <li>Generation-skipping transfer tax planning</li>
          <li>International estate planning considerations</li>
          ` : `
          <li>Essential legal foundations for your business</li>
          <li>Risk assessment and mitigation strategies</li>
          <li>Contract and agreement templates</li>
          <li>Compliance and regulatory guidance</li>
          <li>Next steps for legal protection</li>
          `}
        </ul>
      </div>
      
      <!-- Next Steps -->
      <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 20px; margin: 24px 0;">
        <h3 style="color: #92400e; margin: 0 0 12px; font-size: 16px;">🎯 Ready for Personalized Guidance?</h3>
        <p style="color: #92400e; margin: 0 0 16px; font-size: 14px; line-height: 1.5;">
          ${consultationMessage} During our consultation, we'll create a customized roadmap specific to your situation.
        </p>
        <div style="text-align: center;">
          <a href="${config.calendlyLinks[formData.guideType === 'business-guide' ? 'business-formation' : 
                                         formData.guideType === 'brand-guide' ? 'brand-protection' : 
                                         formData.guideType === 'estate-guide' ? 'estate-planning' : 'general']}" 
             style="display: inline-block; background-color: #f59e0b; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 14px;">
            📅 Schedule Free Consultation
          </a>
        </div>
      </div>
      
      <!-- Value Proposition -->
      <div style="background-color: #f8fafc; border-radius: 8px; padding: 24px; margin: 24px 0;">
        <h3 style="color: #1f2937; margin: 0 0 16px; font-size: 18px;">Why Choose Jacobs Counsel?</h3>
        <div style="display: grid; grid-template-columns: 1fr; gap: 12px;">
          <div style="display: flex; align-items: flex-start;">
            <span style="color: #059669; font-size: 18px; margin-right: 12px;">✓</span>
            <p style="color: #4b5563; margin: 0; font-size: 14px; line-height: 1.5;">Specialized in high-growth businesses and sophisticated legal planning</p>
          </div>
          <div style="display: flex; align-items: flex-start;">
            <span style="color: #059669; font-size: 18px; margin-right: 12px;">✓</span>
            <p style="color: #4b5563; margin: 0; font-size: 14px; line-height: 1.5;">Trusted by entrepreneurs, executives, and high-net-worth families</p>
          </div>
          <div style="display: flex; align-items: flex-start;">
            <span style="color: #059669; font-size: 18px; margin-right: 12px;">✓</span>
            <p style="color: #4b5563; margin: 0; font-size: 14px; line-height: 1.5;">Proactive strategies that save time, money, and reduce risk</p>
          </div>
        </div>
      </div>
      
      <div style="border-top: 1px solid #e5e7eb; padding-top: 24px; margin-top: 32px;">
        <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 0 0 16px;">
          Questions about the guide or need immediate assistance?
        </p>
        <p style="color: #4b5563; margin: 8px 0;">
          📧 <a href="mailto:drew@jacobscounsellaw.com" style="color: #ff4d00; text-decoration: none;">drew@jacobscounsellaw.com</a><br>
          🌐 <a href="https://jacobscounsellaw.com" style="color: #ff4d00; text-decoration: none;">jacobscounsellaw.com</a>
        </p>
      </div>
      
      <div style="text-align: center; margin-top: 32px;">
        <p style="color: #374151; font-size: 16px; font-weight: 600; margin: 0 0 8px;">Drew Jacobs, Esq.</p>
        <p style="color: #6b7280; font-size: 14px; margin: 0;">Founder & Managing Attorney<br>Jacobs Counsel LLC</p>
      </div>
    </div>
    
    <!-- Legal Disclaimer -->
    <div style="background-color: #fef2f2; border: 1px solid #fecaca; padding: 20px 30px; margin: 0;">
      <h4 style="color: #dc2626; margin: 0 0 12px; font-size: 16px; font-weight: 600;">⚖️ Important Legal Notice</h4>
      <p style="color: #7f1d1d; font-size: 13px; line-height: 1.5; margin: 0;">
        <strong>No Attorney-Client Relationship:</strong> This guide and communication do not create an attorney-client relationship. 
        The information provided is for educational purposes only and should not be considered legal advice. 
        Do not send confidential information until a formal attorney-client relationship has been established 
        through a signed engagement agreement.
      </p>
    </div>
    
    <!-- Footer -->
    <div style="background-color: #f8fafc; padding: 20px 30px; border-top: 1px solid #e5e7eb;">
      <p style="color: #6b7280; font-size: 12px; text-align: center; margin: 0;">
        © 2025 Jacobs Counsel LLC. All rights reserved.<br>
        This communication is for informational purposes only.
      </p>
    </div>
  </div>
</body>
</html>`;
}

// ==================== TYPE COMPATIBILITY (Exact copies) ====================
const TYPE_ALIAS = {
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

export function normalizeSubmissionType(submitted, routeDefault) {
  const s = (submitted || '').toLowerCase();
  if (TYPE_ALIAS[s]) return TYPE_ALIAS[s];
  if (TYPE_ALIAS[routeDefault]) return TYPE_ALIAS[routeDefault];
  return routeDefault || 'newsletter';
}

export function withNormalizedType(formData, routeDefault) {
  const norm = normalizeSubmissionType(formData.submissionType, routeDefault);
  return { ...formData, submissionType: norm, _normalizedType: norm };
}

// ==================== OPERATION PROCESSING (Exact copy) ====================
export async function processIntakeOperations(operations) {
  const results = await Promise.allSettled(operations);
  results.forEach((result, index) => {
    if (result.status === 'rejected') {
      console.error(`❌ Operation ${index} failed:`, result.reason);
    }
  });
  return results;
}