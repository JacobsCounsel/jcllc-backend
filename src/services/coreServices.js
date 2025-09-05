// Core Services - Essential functions for Jacobs Counsel system
// Replaces legacy compatibility functions with clean implementations

import { config } from '../config/environment.js';
import { log } from '../utils/logger.js';
import IntelligentKitTagging from './intelligentKitTagging.js';

// Initialize intelligent tagging system
const kitTagging = new IntelligentKitTagging();

// Email sending function (Microsoft Graph API)
export async function sendEnhancedEmail({ to, subject, html, replyTo }) {
  try {
    const graphToken = await getGraphToken();
    if (!graphToken) {
      throw new Error('Failed to get Graph API token');
    }

    const emailData = {
      message: {
        subject,
        body: {
          contentType: 'HTML',
          content: html
        },
        toRecipients: Array.isArray(to) ? to.map(email => ({
          emailAddress: { address: email }
        })) : [{ emailAddress: { address: to } }],
        replyTo: replyTo ? [{ emailAddress: { address: replyTo } }] : undefined
      }
    };

    const response = await fetch('https://graph.microsoft.com/v1.0/me/sendMail', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${graphToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(emailData)
    });

    if (!response.ok) {
      throw new Error(`Graph API error: ${response.status}`);
    }

    log.info('Email sent successfully via Microsoft Graph', {
      to: Array.isArray(to) ? to : [to],
      subject
    });

    return { success: true, provider: 'microsoft-graph' };
  } catch (error) {
    log.error('Email sending failed:', error);
    throw error;
  }
}

// Get Microsoft Graph token
export async function getGraphToken() {
  try {
    const tokenUrl = `https://login.microsoftonline.com/${config.microsoft.tenantId}/oauth2/v2.0/token`;
    
    const params = new URLSearchParams({
      client_id: config.microsoft.clientId,
      client_secret: config.microsoft.clientSecret,
      scope: 'https://graph.microsoft.com/.default',
      grant_type: 'client_credentials'
    });

    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(`Token request failed: ${data.error_description || data.error}`);
    }

    return data.access_token;
  } catch (error) {
    log.error('Failed to get Graph token:', error);
    return null;
  }
}

// Create Clio lead
export async function createClioLead(formData, leadScore, submissionType) {
  try {
    if (!config.clio.inboxToken) {
      log.warn('Clio not configured - skipping lead creation');
      return { success: false, reason: 'not_configured' };
    }

    const clioData = {
      data: {
        type: 'Person',
        first_name: formData.firstName || formData.first_name || 'New',
        last_name: formData.lastName || formData.last_name || 'Lead',
        phone_numbers: formData.phone ? [{
          name: 'Primary',
          number: formData.phone
        }] : [],
        email_addresses: [{
          name: 'Primary',
          address: formData.email,
          is_primary: true
        }],
        custom_field_values: [{
          custom_field_id: config.clio.leadScoreFieldId,
          value: leadScore.score?.toString() || '0'
        }, {
          custom_field_id: config.clio.sourceFieldId,
          value: submissionType
        }]
      }
    };

    const response = await fetch('https://app.clio.com/api/v4/people.json', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.clio.inboxToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(clioData)
    });

    if (!response.ok) {
      throw new Error(`Clio API error: ${response.status}`);
    }

    const result = await response.json();
    log.info('Clio lead created successfully', {
      email: formData.email,
      clioId: result.data?.id,
      leadScore: leadScore.score
    });

    return { success: true, clioId: result.data?.id };
  } catch (error) {
    log.error('Failed to create Clio lead:', error);
    return { success: false, error: error.message };
  }
}

// Normalize submission type
export function normalizeSubmissionType(submissionType) {
  const normalizedTypes = {
    'legal-strategy-builder': 'legal-risk-assessment', // Redirect old to new
    'estate-planning': 'estate-intake',
    'business-planning': 'business-formation',
    'brand-planning': 'brand-protection',
    'outside-counsel': 'outside-counsel',
    'newsletter': 'newsletter',
    'resource-guide': 'resource-guide'
  };

  return normalizedTypes[submissionType] || submissionType;
}

// Add lead to Kit with intelligent tagging
export async function addToKitWithIntelligentTagging(formData, leadScore, submissionType) {
  try {
    const apiSecret = config.kit.apiSecret || config.kit.apiKey;
    if (!apiSecret || !config.kit.formId) {
      log.warn('Kit not configured - skipping subscriber addition');
      return { success: false, reason: 'not_configured' };
    }

    // Generate intelligent tags
    const intelligentTags = kitTagging.generateIntelligentTags(formData, leadScore, submissionType);
    const sequenceTags = kitTagging.generateSequenceAssignmentTags(formData, leadScore, submissionType);
    
    // Combine all tags
    const allTags = [...intelligentTags, ...sequenceTags];

    const subscriberData = {
      api_secret: apiSecret,
      email: formData.email,
      first_name: formData.firstName || formData.first_name || '',
      fields: {
        last_name: formData.lastName || formData.last_name || '',
        phone: formData.phone || '',
        lead_score: leadScore.score?.toString() || '0',
        submission_type: submissionType,
        priority: leadScore.priority || 'standard'
      },
      tags: allTags
    };

    const response = await fetch(`https://api.convertkit.com/v3/forms/${config.kit.formId}/subscribe`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(subscriberData)
    });

    if (!response.ok) {
      throw new Error(`Kit API error: ${response.status}`);
    }

    const result = await response.json();
    
    log.info('Kit subscriber added with intelligent tagging', {
      email: formData.email,
      tags: allTags,
      leadScore: leadScore.score,
      subscriberId: result.subscription?.subscriber?.id
    });

    return { 
      success: true, 
      subscriberId: result.subscription?.subscriber?.id,
      tags: allTags,
      sequences: sequenceTags
    };
  } catch (error) {
    log.error('Failed to add Kit subscriber:', error);
    return { success: false, error: error.message };
  }
}

// Input sanitization
export function sanitizeInput(input) {
  if (typeof input !== 'string') return input;
  return input.trim().replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
}

// HTML escaping
export function escapeHtml(text) {
  if (typeof text !== 'string') return text;
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, m => map[m]);
}

export default {
  sendEnhancedEmail,
  getGraphToken,
  createClioLead,
  normalizeSubmissionType,
  addToKitWithIntelligentTagging,
  sanitizeInput,
  escapeHtml
};