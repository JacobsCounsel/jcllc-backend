// src/config/environment.js - Centralized environment configuration
import dotenv from 'dotenv';

dotenv.config();

export const config = {
  // Server
  port: process.env.PORT || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  
  // AI Configuration
  openai: {
    apiKey: process.env.OPENAI_API_KEY || '',
    model: process.env.OPENAI_MODEL || 'gpt-4o-mini'
  },
  
  // Microsoft Graph
  microsoft: {
    tenantId: process.env.MS_TENANT_ID || '',
    clientId: process.env.MS_CLIENT_ID || '',
    clientSecret: process.env.MS_CLIENT_SECRET || '',
    sender: process.env.MS_GRAPH_SENDER || ''
  },
  
  // Email Configuration
  email: {
    fromAddress: process.env.FROM_EMAIL || 'drew@jacobscounsellaw.com',
    fromName: process.env.FROM_NAME || 'Drew Jacobs, Esq.',
  },
  
  // Base URL
  baseUrl: process.env.BASE_URL || 'http://localhost:3000',
  
  // Development flag
  isDevelopment: process.env.NODE_ENV !== 'production',
  
  // Mailchimp
  mailchimp: {
    apiKey: process.env.MAILCHIMP_API_KEY || '',
    server: process.env.MAILCHIMP_SERVER || 'us21',
    audienceId: process.env.MAILCHIMP_AUDIENCE_ID || ''
  },
  
  // Kit (ConvertKit)
  kit: {
    apiKey: process.env.KIT_API_KEY || '_asjUkBoW6K8ORx6w2lSpg',
    apiSecret: process.env.KIT_API_SECRET || 'WfeiRBsWUCmG1K2mTpA4AXfm-orT866YY3-p5A9Oo14'
  },
  
  // Calendly Links - YOUR ACTUAL LINKS (preserved exactly)
  calendlyLinks: {
    'estate-planning': 'https://calendly.com/jacobscounsel/wealth-protection-consultation',
    'business-formation': 'https://calendly.com/jacobscounsel/business-protection-consultation',
    'brand-protection': 'https://calendly.com/jacobscounsel/brand-protection-consultation',
    'outside-counsel': 'https://calendly.com/jacobscounsel/outside-counsel-consultation',
    'priority': 'https://calendly.com/jacobscounsel/priority-consultation',
    'general': 'https://calendly.com/jacobscounsel/general-consultation'
  },
  
  // Clio Grow
  clio: {
    base: process.env.CLIO_GROW_BASE || 'https://grow.clio.com',
    inboxToken: process.env.CLIO_GROW_INBOX_TOKEN || ''
  },
  
  // Email notifications
  notifications: {
    intakeNotifyTo: process.env.INTAKE_NOTIFY_TO || 'intake@jacobscounsellaw.com',
    highValueNotifyTo: process.env.HIGH_VALUE_NOTIFY_TO || 'drew@jacobscounsellaw.com'
  },
  
  // Resources
  resources: {
    guideUrl: process.env.RESOURCE_GUIDE_URL || 'https://jacobscounsellaw.com/downloads/legal-guide.pdf'
  },
  
  // Analytics
  mixpanel: {
    token: process.env.MIXPANEL_TOKEN || null
  },
  
  // Calendly Webhook
  calendly: {
    webhookSecret: process.env.CALENDLY_WEBHOOK_SECRET || ''
  }
};

// Environment validation (improved)
export function validateEnvironment() {
  const requiredEmail = config.microsoft.clientId && 
                       config.microsoft.clientSecret && 
                       config.microsoft.tenantId && 
                       config.microsoft.sender;
  
  const requiredMailchimp = config.mailchimp.apiKey && config.mailchimp.audienceId;
  
  const status = {
    email: requiredEmail ? '✅ Configured' : '⚠️ Not configured (emails disabled)',
    mailchimp: requiredMailchimp ? '✅ Configured' : '⚠️ Not configured (nurture disabled)',
    openai: config.openai.apiKey ? '✅ Configured' : '⚠️ Not configured (AI disabled)',
    clio: config.clio.inboxToken ? '✅ Configured' : '⚠️ Not configured (CRM disabled)',
    mixpanel: config.mixpanel.token ? '✅ Configured' : '⚠️ Not configured (analytics disabled)'
  };
  
  console.log('🔍 Environment Check:');
  Object.entries(status).forEach(([service, status]) => {
    console.log(` ${service.charAt(0).toUpperCase() + service.slice(1)}: ${status}`);
  });
  
  return {
    hasEmail: requiredEmail,
    hasMailchimp: requiredMailchimp,
    hasOpenAI: !!config.openai.apiKey,
    hasClio: !!config.clio.inboxToken,
    hasMixpanel: !!config.mixpanel.token,
    status
  };
}