// src/services/mailchimpAutomation.js - Advanced Mailchimp automation based on lead scoring
import Mailchimp from 'mailchimp-api-v3';
import { config } from '../config/environment.js';
import { log } from '../utils/logger.js';

let mailchimp = null;

// Initialize Mailchimp client
function initializeMailchimp() {
  if (!config.mailchimp.apiKey || !config.mailchimp.audienceId) {
    log.warn('Mailchimp not configured - automation disabled');
    return null;
  }
  
  try {
    mailchimp = new Mailchimp(config.mailchimp.apiKey);
    log.info('Mailchimp automation initialized');
    return mailchimp;
  } catch (error) {
    log.error('Failed to initialize Mailchimp:', error.message);
    return null;
  }
}

// Lead scoring to Mailchimp tags mapping
function getAutomationTags(leadScore, submissionType, formData) {
  const tags = [];
  
  // Priority level tags
  if (leadScore.score >= 70) {
    tags.push('high-priority-lead');
  } else if (leadScore.score >= 50) {
    tags.push('medium-priority-lead');
  } else {
    tags.push('nurture-lead');
  }
  
  // Service type tags
  tags.push(`service-${submissionType}`);
  
  // Specific behavior tags
  if (submissionType === 'estate-intake') {
    const grossEstate = parseFloat(formData.grossEstate?.replace(/[,$]/g, '') || '0');
    if (grossEstate > 5000000) {
      tags.push('ultra-high-net-worth');
    } else if (grossEstate > 1000000) {
      tags.push('high-net-worth');
    }
    
    if (formData.packagePreference?.toLowerCase().includes('trust')) {
      tags.push('trust-interested');
    }
    
    if (formData.ownBusiness === 'Yes') {
      tags.push('business-owner');
    }
  }
  
  if (submissionType === 'business-formation') {
    if (formData.investmentPlan === 'vc') {
      tags.push('vc-backed-startup');
    } else if (formData.investmentPlan === 'angel') {
      tags.push('angel-funded');
    }
    
    if (formData.projectedRevenue?.includes('over25m')) {
      tags.push('high-revenue-projection');
    }
  }
  
  if (submissionType === 'brand-protection') {
    if (formData.servicePreference?.includes('Portfolio')) {
      tags.push('ip-portfolio-client');
    }
    
    if (formData.protectionGoal === 'enforcement') {
      tags.push('ip-enforcement-need');
    }
  }
  
  if (submissionType === 'outside-counsel') {
    if (formData.budget?.includes('10K+')) {
      tags.push('high-budget-client');
    }
    
    if (formData.timeline === 'Immediately') {
      tags.push('urgent-legal-need');
    }
  }
  
  // Urgency tags
  if (formData.urgency?.includes('Immediate') || formData.urgency?.includes('urgent')) {
    tags.push('urgent-need');
  }
  
  // Business indicators
  const email = formData.email || '';
  if (email && !email.includes('@gmail.com') && !email.includes('@yahoo.com') && !email.includes('@hotmail.com')) {
    tags.push('business-email');
  }
  
  return tags;
}

// Create merge fields for Mailchimp based on form data
function createMergeFields(leadScore, submissionType, formData) {
  const mergeFields = {
    LEADSCORE: leadScore.score,
    PRIORITY: leadScore.priority,
    SERVICETYPE: submissionType,
    FNAME: formData.firstName || formData.name || '',
    LNAME: formData.lastName || '',
    PHONE: formData.phone || '',
    COMPANY: formData.businessName || formData.companyName || ''
  };
  
  // Service-specific merge fields
  if (submissionType === 'estate-intake') {
    mergeFields.ESTATE_VAL = formData.grossEstate || '';
    mergeFields.TRUST_INT = formData.packagePreference?.toLowerCase().includes('trust') ? 'Yes' : 'No';
    mergeFields.BUS_OWNER = formData.ownBusiness || 'No';
  }
  
  if (submissionType === 'business-formation') {
    mergeFields.FUNDING = formData.investmentPlan || '';
    mergeFields.REVENUE = formData.projectedRevenue || '';
    mergeFields.INDUSTRY = formData.industry || '';
  }
  
  if (submissionType === 'brand-protection') {
    mergeFields.IP_SERVICE = formData.servicePreference || '';
    mergeFields.BUS_STAGE = formData.businessStage || '';
  }
  
  if (submissionType === 'outside-counsel') {
    mergeFields.BUDGET = formData.budget || '';
    mergeFields.TIMELINE = formData.timeline || '';
  }
  
  return mergeFields;
}

// Add subscriber to Mailchimp with advanced segmentation
export async function addToMailchimpAutomation(leadScore, submissionType, formData) {
  if (!mailchimp && !initializeMailchimp()) {
    log.warn('Mailchimp not available - skipping automation');
    return { success: false, reason: 'Mailchimp not configured' };
  }
  
  try {
    const email = formData.email;
    if (!email) {
      log.warn('No email provided - skipping Mailchimp automation');
      return { success: false, reason: 'No email provided' };
    }
    
    // Create automation tags and merge fields
    const tags = getAutomationTags(leadScore, submissionType, formData);
    const mergeFields = createMergeFields(leadScore, submissionType, formData);
    
    // Add/update subscriber
    const memberData = {
      email_address: email,
      status: 'subscribed',
      merge_fields: mergeFields,
      tags: tags
    };
    
    // Use upsert to handle existing subscribers
    const result = await mailchimp.put({
      path: `/lists/${config.mailchimp.audienceId}/members/${email}`,
      body: memberData
    });
    
    // Track automation trigger
    await logAutomationEvent(email, leadScore, submissionType, tags);
    
    log.info('Mailchimp automation triggered', {
      email,
      score: leadScore.score,
      priority: leadScore.priority,
      service: submissionType,
      tags: tags.length
    });
    
    return {
      success: true,
      memberId: result.id,
      tags: tags,
      automationTriggered: determineAutomationFlow(leadScore, submissionType)
    };
    
  } catch (error) {
    log.error('Mailchimp automation failed:', {
      error: error.message,
      email: formData.email,
      service: submissionType
    });
    
    return { 
      success: false, 
      reason: error.message 
    };
  }
}

// Determine which automation flow should be triggered
function determineAutomationFlow(leadScore, submissionType) {
  const flows = [];
  
  // Priority-based flows
  if (leadScore.score >= 70) {
    flows.push('high-priority-immediate-outreach');
  } else if (leadScore.score >= 50) {
    flows.push('medium-priority-educational-sequence');
  } else {
    flows.push('nurture-long-term-education');
  }
  
  // Service-specific flows
  flows.push(`${submissionType}-specific-sequence`);
  
  // Behavioral flows
  if (submissionType === 'legal-strategy-builder') {
    flows.push('assessment-completion-follow-up');
  }
  
  return flows;
}

// Log automation events for analytics
async function logAutomationEvent(email, leadScore, submissionType, tags) {
  try {
    const eventData = {
      timestamp: new Date().toISOString(),
      email,
      leadScore: leadScore.score,
      priority: leadScore.priority,
      serviceType: submissionType,
      tags: tags,
      automationFlow: determineAutomationFlow(leadScore, submissionType)
    };
    
    // This could be logged to your analytics system
    log.info('Automation event logged', eventData);
    
  } catch (error) {
    log.error('Failed to log automation event:', error.message);
  }
}

// Create audience segments based on lead data
export async function createAdvancedSegments() {
  if (!mailchimp && !initializeMailchimp()) {
    return { success: false, reason: 'Mailchimp not configured' };
  }
  
  try {
    const segments = [
      {
        name: 'High-Value Estate Planning Leads',
        static_segment: [],
        options: {
          match: 'all',
          conditions: [
            {
              condition_type: 'TextMerge',
              field: 'SERVICETYPE',
              op: 'is',
              value: 'estate-intake'
            },
            {
              condition_type: 'NumberMerge', 
              field: 'LEADSCORE',
              op: 'greater',
              value: 60
            }
          ]
        }
      },
      {
        name: 'VC-Backed Business Formation',
        static_segment: [],
        options: {
          match: 'all',
          conditions: [
            {
              condition_type: 'TextMerge',
              field: 'SERVICETYPE', 
              op: 'is',
              value: 'business-formation'
            },
            {
              condition_type: 'TextMerge',
              field: 'FUNDING',
              op: 'is', 
              value: 'vc'
            }
          ]
        }
      },
      {
        name: 'Urgent Legal Needs',
        static_segment: [],
        options: {
          match: 'any',
          conditions: [
            {
              condition_type: 'StaticSegment',
              field: 'static_segment',
              op: 'static_is',
              value: 'urgent-need'
            }
          ]
        }
      }
    ];
    
    const createdSegments = [];
    for (const segment of segments) {
      try {
        const result = await mailchimp.post({
          path: `/lists/${config.mailchimp.audienceId}/segments`,
          body: segment
        });
        createdSegments.push(result);
      } catch (error) {
        log.warn(`Failed to create segment ${segment.name}:`, error.message);
      }
    }
    
    return {
      success: true,
      segments: createdSegments
    };
    
  } catch (error) {
    log.error('Failed to create Mailchimp segments:', error.message);
    return { success: false, reason: error.message };
  }
}

// Get automation performance metrics
export async function getAutomationMetrics() {
  if (!mailchimp && !initializeMailchimp()) {
    return { success: false, reason: 'Mailchimp not configured' };
  }
  
  try {
    // Get list stats
    const listStats = await mailchimp.get({
      path: `/lists/${config.mailchimp.audienceId}`
    });
    
    // Get segment performance (if segments exist)
    const segments = await mailchimp.get({
      path: `/lists/${config.mailchimp.audienceId}/segments`
    });
    
    return {
      success: true,
      totalSubscribers: listStats.stats.member_count,
      segments: segments.segments?.length || 0,
      lastUpdated: new Date().toISOString()
    };
    
  } catch (error) {
    log.error('Failed to get automation metrics:', error.message);
    return { success: false, reason: error.message };
  }
}

// Initialize on import
initializeMailchimp();