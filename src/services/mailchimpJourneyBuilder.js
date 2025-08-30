// src/services/mailchimpJourneyBuilder.js - Complete Journey Architecture Builder
import Mailchimp from 'mailchimp-api-v3';
import { config } from '../config/environment.js';
import { log } from '../utils/logger.js';

let mailchimp = null;

// Initialize Mailchimp
function initializeMailchimp() {
  if (!config.mailchimp.apiKey) {
    throw new Error('Mailchimp API key not configured');
  }
  mailchimp = new Mailchimp(config.mailchimp.apiKey);
  return mailchimp;
}

// Master audience configuration
const AUDIENCE_CONFIG = {
  name: "Jacobs Counsel Master",
  contact: {
    company: "Jacobs Counsel Law",
    address1: "123 Legal Street",
    city: "New York",
    state: "NY",
    zip: "10001",
    country: "US"
  },
  permission_reminder: "You are receiving this because you requested legal information from Jacobs Counsel Law.",
  campaign_defaults: {
    from_name: "Drew Jacobs, Esq.",
    from_email: "admin@jacobscounsellaw.com",
    subject: "",
    language: "en"
  },
  email_type_option: true
};

// Required merge fields
const MERGE_FIELDS = [
  { name: "FNAME", tag: "FNAME", type: "text", required: false },
  { name: "LNAME", tag: "LNAME", type: "text", required: false },
  { name: "LEAD_SCORE", tag: "LEAD_SCORE", type: "number", required: false },
  { name: "CLIENT_TYPE", tag: "CLIENT_TYPE", type: "text", required: false, default_value: "general" },
  { name: "SERVICE_INTENT", tag: "SERVICE_INTENT", type: "text", required: false, default_value: "newsletter" },
  { name: "JURISDICTION", tag: "JURISDICTION", type: "text", required: false },
  { name: "STATE", tag: "STATE", type: "text", required: false },
  { name: "CALENDLY", tag: "CALENDLY", type: "url", required: false }
];

// Master tag taxonomy
const MASTER_TAGS = [
  // Score bands
  "trigger-vip-sequence", "trigger-premium-nurture", "trigger-standard-nurture",
  
  // Newsletter & resources
  "trigger-newsletter-sequence", "trigger-guide-sequence", "newsletter-signup", "resource-guide-download",
  
  // Intake by service
  "intake-estate-intake", "intake-business-formation", "intake-brand-protection", "intake-outside-counsel",
  
  // Service education sequences
  "sequence-asset-protection", "sequence-wealth-protection", "sequence-business-succession", 
  "sequence-trust-planning", "sequence-trademark-registration", "sequence-ip-enforcement",
  "sequence-estate-tax", "sequence-vc-startup", "sequence-angel-funding", "sequence-basic-planning",
  
  // Lifecycle states
  "stage-active", "community-member", "ltv-high", "restart-nurture",
  
  // Booking control
  "stop-booking-reminders", "consultation-booked", "consultation-canceled",
  
  // Safety
  "do-not-contact"
];

// Copy modules (email templates)
const COPY_MODULES = {
  CM01: {
    subject: "Welcome to Jacobs Counsel",
    preheader: "Here's how we help you move faster with less risk",
    content: `Hi *|FNAME|*,

Thanks for reaching out. We help high performers turn legal into an advantage.

You'll get clear steps, useful tools, and direct answers. No fluff.

If you already know your next move, book a strategy session. If you're still scoping, start with the checklist below.

Best,
Drew Jacobs, Esq.`
  },
  
  CM02: {
    subject: "Your personal legal strategy session",
    preheader: "A focused call to map next steps",
    content: `Hi *|FNAME|*,

Let's get specific. We'll review your goals, surface risks, and set a path you can execute this week.

Bring your top three questions. Leave with a plan.

Best,
Drew Jacobs, Esq.`
  },
  
  CM03: {
    subject: "Priority access is open today",
    preheader: "Grab a slot before the calendar fills",
    content: `Hi *|FNAME|*,

Short note: if you want priority scheduling, use this link. It routes to earlier availability.

Best,
Drew Jacobs, Esq.`
  },
  
  CM04: {
    subject: "How we solved this in 30 days",
    preheader: "The playbook and results",
    content: `Hi *|FNAME|*,

A client with a similar profile came to us with [situation]. We set [structure/plan], executed [steps], and reached [result].

Here's the short version of what worked and why.

Best,
Drew Jacobs, Esq.`
  },
  
  CM05: {
    subject: "Your guide is ready",
    preheader: "Save this and use it today",
    content: `Hi *|FNAME|*,

Here's the guide. Start with page one, then skip to the checklist.

If anything is unclear, reply to this email.

Best,
Drew Jacobs, Esq.`
  },
  
  CM06: {
    subject: "Make the most of your guide",
    preheader: "Three quick wins",
    content: `Hi *|FNAME|*,

Do these three things this week:

• [Action 1]
• [Action 2] 
• [Action 3]

If you want us to set this up with you, book below.

Best,
Drew Jacobs, Esq.`
  },
  
  CM07: {
    subject: "Questions from what you sent",
    preheader: "We can sort this out fast",
    content: `Hi *|FNAME|*,

You likely have one or two blockers. Send them by reply or pick a time.

We'll clear them and move.

Best,
Drew Jacobs, Esq.`
  },
  
  CM08: {
    subject: "Why high performers run legal on offense",
    preheader: "Clarity, speed, and fewer surprises",
    content: `Hi *|FNAME|*,

Legal can slow you down or speed you up. We design structure, contracts, and protection so you can move without rework.

Less drag. Fewer "uh ohs."

Best,
Drew Jacobs, Esq.`
  },
  
  CM09: {
    subject: "Common legal myths that get expensive",
    preheader: "Five mistakes we see every week",
    content: `Hi *|FNAME|*,

We see smart people lose time and money from these myths. Here's the short list and what to do instead.

Best,
Drew Jacobs, Esq.`
  },
  
  CM10: {
    subject: "Final invitation for now",
    preheader: "Keep this link if timing isn't right",
    content: `Hi *|FNAME|*,

If now isn't the time, no problem. Keep this link. When you're ready, we'll be ready.

Best,
Drew Jacobs, Esq.`
  }
};

// Journey definitions
const JOURNEY_DEFINITIONS = {
  'VIP Sequence': {
    trigger: 'trigger-vip-sequence',
    emails: [
      { delay: 0, template: 'CM01' },
      { delay: 2 * 60, template: 'CM02' }, // 2 hours
      { delay: 24 * 60, template: 'CM03' }, // 24 hours
      { delay: 3 * 24 * 60, template: 'CM04' }, // 3 days
      { delay: 7 * 24 * 60, template: 'CM10' } // 7 days
    ],
    exit_conditions: ['consultation-booked', 'stage-active']
  },
  
  'Premium Nurture': {
    trigger: 'trigger-premium-nurture',
    emails: [
      { delay: 0, template: 'CM01' },
      { delay: 24 * 60, template: 'CM08' }, // 1 day
      { delay: 3 * 24 * 60, template: 'CM04' }, // 3 days
      { delay: 5 * 24 * 60, template: 'CM02' }, // 5 days
      { delay: 7 * 24 * 60, template: 'CM05' }, // 7 days
      { delay: 10 * 24 * 60, template: 'CM10' } // 10 days
    ],
    exit_conditions: ['consultation-booked', 'stage-active']
  },
  
  'Standard Nurture': {
    trigger: 'trigger-standard-nurture',
    emails: [
      { delay: 0, template: 'CM01' },
      { delay: 2 * 24 * 60, template: 'CM08' }, // 2 days
      { delay: 4 * 24 * 60, template: 'CM05' }, // 4 days
      { delay: 7 * 24 * 60, template: 'CM04' }, // 7 days
      { delay: 10 * 24 * 60, template: 'CM02' }, // 10 days
      { delay: 14 * 24 * 60, template: 'CM09' }, // 14 days
      { delay: 21 * 24 * 60, template: 'CM10' } // 21 days
    ],
    exit_conditions: ['consultation-booked', 'stage-active']
  },
  
  'Newsletter Welcome Series': {
    trigger: 'trigger-newsletter-sequence',
    emails: [
      { delay: 0, template: 'CM05' },
      { delay: 3 * 24 * 60, template: 'CM06' }, // 3 days
      { delay: 7 * 24 * 60, template: 'CM07' } // 7 days
    ],
    exit_conditions: []
  },
  
  'Resource Guide Follow-Up': {
    trigger: 'trigger-guide-sequence',
    emails: [
      { delay: 0, template: 'CM05' },
      { delay: 2 * 24 * 60, template: 'CM06' }, // 2 days
      { delay: 5 * 24 * 60, template: 'CM07' } // 5 days
    ],
    exit_conditions: ['consultation-booked']
  }
};

// Service education journeys (simplified version - can be expanded)
const SERVICE_EDUCATION_JOURNEYS = {
  'Asset Protection Journey': {
    trigger: 'sequence-asset-protection',
    emails: [
      { delay: 0, template: 'CM08' },
      { delay: 2 * 24 * 60, template: 'CM04' },
      { delay: 4 * 24 * 60, template: 'CM07' },
      { delay: 7 * 24 * 60, template: 'CM02' }
    ],
    exit_conditions: ['consultation-booked']
  },
  
  'VC Startup Formation': {
    trigger: 'sequence-vc-startup',
    emails: [
      { delay: 0, template: 'CM08' },
      { delay: 2 * 24 * 60, template: 'CM04' },
      { delay: 5 * 24 * 60, template: 'CM06' },
      { delay: 8 * 24 * 60, template: 'CM02' }
    ],
    exit_conditions: ['consultation-booked']
  },
  
  'Estate Tax Planning': {
    trigger: 'sequence-estate-tax',
    emails: [
      { delay: 0, template: 'CM08' },
      { delay: 3 * 24 * 60, template: 'CM04' },
      { delay: 6 * 24 * 60, template: 'CM06' },
      { delay: 10 * 24 * 60, template: 'CM02' }
    ],
    exit_conditions: ['consultation-booked']
  }
};

// Main builder functions
export async function buildCompleteJourneyArchitecture() {
  try {
    initializeMailchimp();
    log.info('🚀 Starting complete Mailchimp journey architecture build...');
    
    const results = {
      audience: null,
      mergeFields: [],
      tags: [],
      segments: [],
      journeys: [],
      errors: []
    };
    
    // Step 1: Create or update audience
    log.info('📝 Setting up audience...');
    try {
      results.audience = await setupAudience();
    } catch (error) {
      log.error('Failed to setup audience:', error.message);
      results.errors.push(`Audience setup: ${error.message}`);
    }
    
    // Step 2: Create merge fields
    log.info('🔧 Creating merge fields...');
    for (const field of MERGE_FIELDS) {
      try {
        const mergeField = await createMergeField(field);
        results.mergeFields.push(mergeField);
      } catch (error) {
        log.warn(`Merge field ${field.tag} may already exist:`, error.message);
      }
    }
    
    // Step 3: Create all tags
    log.info('🏷️ Creating tags...');
    for (const tagName of MASTER_TAGS) {
      try {
        await createTag(tagName);
        results.tags.push(tagName);
      } catch (error) {
        log.warn(`Tag ${tagName} may already exist:`, error.message);
      }
    }
    
    // Step 4: Create saved segments
    log.info('🎯 Creating segments...');
    try {
      const segments = await createSavedSegments();
      results.segments = segments;
    } catch (error) {
      log.error('Failed to create segments:', error.message);
      results.errors.push(`Segments: ${error.message}`);
    }
    
    // Step 5: Build all journeys
    log.info('📨 Building email journeys...');
    const allJourneys = { ...JOURNEY_DEFINITIONS, ...SERVICE_EDUCATION_JOURNEYS };
    
    for (const [journeyName, journeyConfig] of Object.entries(allJourneys)) {
      try {
        const journey = await createCustomerJourney(journeyName, journeyConfig);
        results.journeys.push({ name: journeyName, id: journey.id });
      } catch (error) {
        log.error(`Failed to create journey ${journeyName}:`, error.message);
        results.errors.push(`Journey ${journeyName}: ${error.message}`);
      }
    }
    
    log.info('✅ Journey architecture build complete!');
    log.info(`Created: ${results.journeys.length} journeys, ${results.segments.length} segments, ${results.tags.length} tags`);
    
    if (results.errors.length > 0) {
      log.warn('⚠️ Build completed with errors:', results.errors);
    }
    
    return results;
    
  } catch (error) {
    log.error('❌ Journey architecture build failed:', error);
    throw error;
  }
}

// Setup audience
async function setupAudience() {
  try {
    const audience = await mailchimp.post({
      path: '/lists',
      body: AUDIENCE_CONFIG
    });
    log.info(`Audience created: ${audience.id}`);
    return audience;
  } catch (error) {
    if (error.message.includes('already exists')) {
      log.info('Using existing audience');
      const lists = await mailchimp.get({ path: '/lists' });
      return lists.lists.find(list => list.name === AUDIENCE_CONFIG.name);
    }
    throw error;
  }
}

// Create merge field
async function createMergeField(field) {
  return await mailchimp.post({
    path: `/lists/${config.mailchimp.audienceId}/merge-fields`,
    body: {
      name: field.name,
      tag: field.tag,
      type: field.type,
      required: field.required,
      default_value: field.default_value || ''
    }
  });
}

// Create tag
async function createTag(tagName) {
  return await mailchimp.post({
    path: `/lists/${config.mailchimp.audienceId}/segments`,
    body: {
      name: tagName,
      type: 'static'
    }
  });
}

// Create saved segments
async function createSavedSegments() {
  const segments = [
    {
      name: 'VIP Leads',
      type: 'static',
      static_segment: []
    },
    {
      name: 'Premium Leads', 
      type: 'static',
      static_segment: []
    },
    {
      name: 'Standard Leads',
      type: 'static', 
      static_segment: []
    },
    {
      name: 'Active Clients',
      type: 'static',
      static_segment: []
    },
    {
      name: 'Exclude All Nurture',
      type: 'static',
      static_segment: []
    }
  ];
  
  const createdSegments = [];
  for (const segment of segments) {
    try {
      const created = await mailchimp.post({
        path: `/lists/${config.mailchimp.audienceId}/segments`,
        body: segment
      });
      createdSegments.push(created);
    } catch (error) {
      log.warn(`Segment ${segment.name} may already exist`);
    }
  }
  
  return createdSegments;
}

// Create customer journey
async function createCustomerJourney(name, config) {
  const journeyData = {
    settings: {
      title: name,
      from_name: "Drew Jacobs, Esq.",
      reply_to: "admin@jacobscounsellaw.com"
    },
    trigger_settings: {
      workflow_type: "emailSequence",
      workflow_emails_count: config.emails.length
    },
    emails: config.emails.map((email, index) => ({
      settings: {
        subject_line: COPY_MODULES[email.template]?.subject || `Email ${index + 1}`,
        title: `${name} - Email ${index + 1}`,
        from_name: "Drew Jacobs, Esq.",
        reply_to: "admin@jacobscounsellaw.com"
      },
      delay: {
        amount: Math.floor(email.delay / 60) || 0, // Convert minutes to hours
        type: email.delay < 60 ? 'immediate' : 'hours',
        direction: 'after'
      },
      content: createEmailContent(email.template)
    }))
  };
  
  // Note: This is a simplified version. Mailchimp's Customer Journey API 
  // has specific requirements that would need to be adapted based on their current API structure
  
  return await mailchimp.post({
    path: '/customer-journeys',
    body: journeyData
  });
}

// Create email content
function createEmailContent(templateKey) {
  const template = COPY_MODULES[templateKey];
  if (!template) return { html: '<p>Template not found</p>' };
  
  return {
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>${template.subject}</title>
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, sans-serif; line-height: 1.6; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="white-space: pre-line;">${template.content}</div>
        
        <div style="margin: 30px 0; text-align: center;">
          <a href="*|CALENDLY|*" style="background: #ff4d00; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: 600; display: inline-block;">Book Your Strategy Session</a>
        </div>
        
        <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e2e8f0; font-size: 12px; color: #64748b;">
          <p>Jacobs Counsel Law - Serving NY, NJ, OH</p>
          <p>This is general information, not legal advice.</p>
        </div>
      </body>
      </html>
    `
  };
}

// Test function to verify setup
export async function testJourneySetup() {
  try {
    initializeMailchimp();
    
    // Test audience access
    const lists = await mailchimp.get({ path: '/lists' });
    log.info(`Found ${lists.lists.length} audiences`);
    
    // Test specific audience
    if (config.mailchimp.audienceId) {
      const audience = await mailchimp.get({
        path: `/lists/${config.mailchimp.audienceId}`
      });
      log.info(`Target audience: ${audience.name} (${audience.stats.member_count} members)`);
    }
    
    return { success: true, ready: true };
    
  } catch (error) {
    log.error('Journey setup test failed:', error.message);
    return { success: false, error: error.message };
  }
}

// Initialize on import
if (config.mailchimp.apiKey) {
  initializeMailchimp();
}