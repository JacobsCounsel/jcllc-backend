// src/services/kitAutomationBuilder.js - Simple Kit (ConvertKit) Integration
import fetch from 'node-fetch';
import { config } from '../config/environment.js';
import { log } from '../utils/logger.js';

// Kit API base URL  
const KIT_API_BASE = 'https://api.convertkit.com/v3';

// Simple function to add subscriber to Kit
async function addSubscriberToKit(email, firstName = '', lastName = '') {
  try {
    // Use a default form ID for now - you'll need to get this from your Kit account
    const formId = '7185434'; // This needs to be replaced with actual form ID from Kit account
    
    const body = {
      email: email,
      api_key: config.kit.apiKey
    };
    
    if (firstName) body.first_name = firstName;
    if (lastName) body.last_name = lastName;
    
    const response = await fetch(`${KIT_API_BASE}/forms/${formId}/subscribe`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(`Kit API error: ${response.status} - ${data.message || 'Unknown error'}`);
    }
    
    log.info('Kit subscriber added', { email, kitId: data.subscription?.subscriber?.id });
    return { success: true, data };
    
  } catch (error) {
    log.error('Kit integration failed:', error.message);
    throw error;
  }
}

// Main function called from the backend
export async function addToKitWithAutomation(formData, leadScore, submissionType) {
  // Skip Kit integration if not properly configured
  if (!config.kit.apiKey || config.kit.apiKey === '_asjUkBoW6K8ORx6w2lSpg') {
    log.warn('Kit integration skipped - API credentials not configured');
    return {
      success: true,
      skipped: true,
      reason: 'Kit credentials not configured'
    };
  }
  
  try {
    const firstName = formData.firstName || formData.fullName?.split(' ')[0] || '';
    const lastName = formData.lastName || formData.fullName?.split(' ')[1] || '';
    
    const result = await addSubscriberToKit(formData.email, firstName, lastName);
    
    log.info('Kit integration completed:', {
      email: formData.email,
      success: result.success,
      leadScore: leadScore.score
    });
    
    return {
      success: true,
      subscriber_added: true,
      form_id: '7185434'
    };
    
  } catch (error) {
    log.error('Kit integration failed:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

// Placeholder for building automations (not implemented yet)
export async function buildKitAutomations() {
  log.info('Kit automation building not implemented - using simple subscriber addition');
  return {
    success: true,
    message: 'Using simple Kit integration - complex automations not built'
  };
}