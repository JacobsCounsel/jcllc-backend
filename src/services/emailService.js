// Production-grade email sending service with multiple providers and failover
import { config } from '../config/environment.js';
import { log } from '../utils/logger.js';

// Email service configuration
const EMAIL_PROVIDERS = {
  microsoftGraph: {
    name: 'Microsoft Graph',
    priority: 1,
    available: !!(config.microsoft?.clientId && config.microsoft?.clientSecret && config.microsoft?.tenantId && config.microsoft?.sender),
    send: async (to, subject, html, options = {}) => {
      // Import Microsoft Graph functionality
      const { getGraphToken } = await import('../legacy/compatibility.js');
      
      try {
        const token = await getGraphToken();
        
        const messageBody = {
          message: {
            subject,
            body: {
              contentType: 'HTML',
              content: html
            },
            toRecipients: (Array.isArray(to) ? to : [to]).map(email => ({
              emailAddress: { address: email }
            })),
            from: {
              emailAddress: {
                address: config.microsoft.sender,
                name: config.email?.fromName || 'Jacobs Counsel'
              }
            }
          }
        };

        const response = await fetch(
          `https://graph.microsoft.com/v1.0/users/${encodeURIComponent(config.microsoft.sender)}/sendMail`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(messageBody)
          }
        );

        if (!response.ok) {
          const error = await response.text();
          throw new Error(`Microsoft Graph API error: ${response.status} - ${error}`);
        }

        return { messageId: `graph_${Date.now()}`, success: true };
        
      } catch (error) {
        throw new Error(`Microsoft Graph send failed: ${error.message}`);
      }
    }
  },

  sendgrid: {
    name: 'SendGrid',
    priority: 2,
    available: !!config.sendgridApiKey,
    send: async (to, subject, html, options = {}) => {
      const sgMail = await import('@sendgrid/mail');
      sgMail.default.setApiKey(config.sendgridApiKey);

      const msg = {
        to: Array.isArray(to) ? to : [to],
        from: {
          email: config.email.fromAddress,
          name: config.email.fromName
        },
        subject,
        html,
        trackingSettings: {
          clickTracking: { enable: true },
          openTracking: { enable: true }
        },
        mailSettings: {
          sandboxMode: { enable: config.isDevelopment }
        },
        ...options
      };

      return sgMail.default.send(msg);
    }
  },
  
  resend: {
    name: 'Resend',
    priority: 2,
    available: !!config.resendApiKey,
    send: async (to, subject, html, options = {}) => {
      const { Resend } = await import('resend');
      const resend = new Resend(config.resendApiKey);

      return resend.emails.send({
        from: `${config.email.fromName} <${config.email.fromAddress}>`,
        to: Array.isArray(to) ? to : [to],
        subject,
        html,
        ...options
      });
    }
  },

  mailgun: {
    name: 'Mailgun',
    priority: 3,
    available: !!config.mailgunApiKey && !!config.mailgunDomain,
    send: async (to, subject, html, options = {}) => {
      const mailgun = await import('mailgun.js');
      const mg = mailgun.default.client({
        username: 'api',
        key: config.mailgunApiKey
      });

      return mg.messages.create(config.mailgunDomain, {
        from: `${config.email.fromName} <${config.email.fromAddress}>`,
        to: Array.isArray(to) ? to : [to],
        subject,
        html,
        'o:tracking': 'yes',
        'o:tracking-clicks': 'yes',
        'o:tracking-opens': 'yes',
        ...options
      });
    }
  },

  smtp: {
    name: 'SMTP',
    priority: 4,
    available: !!config.smtpHost,
    send: async (to, subject, html, options = {}) => {
      const nodemailer = await import('nodemailer');
      
      const transporter = nodemailer.default.createTransporter({
        host: config.smtpHost,
        port: config.smtpPort || 587,
        secure: config.smtpSecure || false,
        auth: {
          user: config.smtpUser,
          pass: config.smtpPassword
        }
      });

      return transporter.sendMail({
        from: `${config.email.fromName} <${config.email.fromAddress}>`,
        to: Array.isArray(to) ? to.join(', ') : to,
        subject,
        html,
        ...options
      });
    }
  }
};

// Get available providers sorted by priority
function getAvailableProviders() {
  return Object.entries(EMAIL_PROVIDERS)
    .filter(([_, provider]) => provider.available)
    .sort(([_, a], [__, b]) => a.priority - b.priority)
    .map(([name, provider]) => ({ name, ...provider }));
}

// Enhanced email sending with failover
export async function sendEmail(to, subject, html, options = {}) {
  const providers = getAvailableProviders();
  
  if (providers.length === 0) {
    throw new Error('No email providers configured');
  }

  let lastError;
  
  for (const provider of providers) {
    try {
      log.info(`📧 Sending email via ${provider.name}`, {
        to: Array.isArray(to) ? to.join(', ') : to,
        subject: subject.substring(0, 50) + '...',
        provider: provider.name
      });

      const result = await provider.send(to, subject, html, options);
      
      log.info(`✅ Email sent successfully via ${provider.name}`, {
        to: Array.isArray(to) ? to.join(', ') : to,
        messageId: result?.messageId || result?.id || 'unknown'
      });

      return {
        success: true,
        provider: provider.name,
        messageId: result?.messageId || result?.id,
        result
      };

    } catch (error) {
      lastError = error;
      log.warn(`❌ Email failed via ${provider.name}:`, {
        error: error.message,
        to: Array.isArray(to) ? to.join(', ') : to,
        subject
      });
      
      // Continue to next provider
      continue;
    }
  }

  // All providers failed
  log.error('❌ All email providers failed:', {
    error: lastError?.message,
    to: Array.isArray(to) ? to.join(', ') : to,
    subject,
    providers: providers.map(p => p.name)
  });

  throw new Error(`Email sending failed: ${lastError?.message || 'Unknown error'}`);
}

// Email validation and preprocessing
export function validateEmailAddress(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function preprocessEmailContent(html) {
  // Add tracking pixels, utm parameters, etc.
  const trackingPixel = config.isDevelopment ? '' : 
    `<img src="${config.baseUrl}/api/email-automations/track/open/{{tracking_id}}" width="1" height="1" style="display:none;">`;
    
  return html.replace('</body>', `${trackingPixel}</body>`);
}

// Bulk email sending with rate limiting
export async function sendBulkEmails(emails, options = {}) {
  const { batchSize = 10, delayBetweenBatches = 1000 } = options;
  const results = [];
  
  for (let i = 0; i < emails.length; i += batchSize) {
    const batch = emails.slice(i, i + batchSize);
    
    const batchPromises = batch.map(async (emailData) => {
      try {
        const result = await sendEmail(
          emailData.to, 
          emailData.subject, 
          emailData.html, 
          emailData.options
        );
        return { ...emailData, ...result, success: true };
      } catch (error) {
        return { ...emailData, success: false, error: error.message };
      }
    });
    
    const batchResults = await Promise.allSettled(batchPromises);
    results.push(...batchResults.map(r => r.value));
    
    // Delay between batches to respect rate limits
    if (i + batchSize < emails.length) {
      await new Promise(resolve => setTimeout(resolve, delayBetweenBatches));
    }
  }
  
  const successful = results.filter(r => r.success).length;
  const failed = results.length - successful;
  
  log.info(`📧 Bulk email sending completed`, {
    total: emails.length,
    successful,
    failed,
    successRate: `${((successful / emails.length) * 100).toFixed(1)}%`
  });
  
  return {
    total: emails.length,
    successful,
    failed,
    results
  };
}

// Email deliverability helpers
export function generateTrackingId() {
  return `track_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export function addUnsubscribeLink(html, email) {
  const baseUrl = config.baseUrl || 'http://localhost:3000';
  const unsubscribeUrl = `${baseUrl}/unsubscribe?email=${encodeURIComponent(email)}`;
  const unsubscribeFooter = `
    <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center; font-size: 12px; color: #6b7280; background: #f9f9f9; padding: 20px;">
      <p style="margin: 0; color: #6b7280 !important;">
        <a href="${unsubscribeUrl}" style="color: #6b7280; text-decoration: underline;">✉️ Unsubscribe</a> | 
        <a href="${baseUrl}" style="color: #6b7280; text-decoration: underline;">🏢 Jacobs Counsel LLC</a> | 
        <span style="color: #6b7280;">📍 Strategic Legal Counsel</span>
      </p>
      <p style="margin: 10px 0 0 0; color: #9ca3af !important; font-size: 11px;">
        This email was sent to ${email}. You can unsubscribe at any time.
      </p>
    </div>
  `;
  
  // Try multiple replacement patterns for better compatibility
  if (html.includes('</div></body>')) {
    return html.replace('</div></body>', `${unsubscribeFooter}</div></body>`);
  } else if (html.includes('</body>')) {
    return html.replace('</body>', `${unsubscribeFooter}</body>`);
  } else {
    return html + unsubscribeFooter;
  }
}

// Email template processing
export function processEmailTemplate(html, variables = {}) {
  let processedHtml = html;
  
  // Replace all variables in the format {{variable}}
  Object.entries(variables).forEach(([key, value]) => {
    const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
    processedHtml = processedHtml.replace(regex, String(value));
  });
  
  // Replace any remaining unreplaced variables with empty strings
  processedHtml = processedHtml.replace(/\{\{[^}]+\}\}/g, '');
  
  return processedHtml;
}

// Email queue management
const emailQueue = [];
let isProcessing = false;

export function queueEmail(emailData) {
  emailQueue.push({
    ...emailData,
    id: generateTrackingId(),
    createdAt: new Date(),
    attempts: 0,
    maxAttempts: 3
  });
  
  // Start processing if not already running
  if (!isProcessing) {
    processEmailQueue();
  }
}

async function processEmailQueue() {
  if (isProcessing || emailQueue.length === 0) return;
  
  isProcessing = true;
  
  while (emailQueue.length > 0) {
    const emailData = emailQueue.shift();
    
    try {
      await sendEmail(emailData.to, emailData.subject, emailData.html, emailData.options);
      log.info(`✅ Queued email sent`, { id: emailData.id });
    } catch (error) {
      emailData.attempts++;
      
      if (emailData.attempts < emailData.maxAttempts) {
        // Re-queue with delay
        setTimeout(() => emailQueue.push(emailData), 5000 * emailData.attempts);
        log.warn(`🔄 Re-queuing email`, { id: emailData.id, attempt: emailData.attempts });
      } else {
        log.error(`❌ Email permanently failed`, { id: emailData.id, error: error.message });
      }
    }
    
    // Small delay between emails
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  isProcessing = false;
}

// Export email service status
export function getEmailServiceStatus() {
  const providers = getAvailableProviders();
  
  return {
    availableProviders: providers.map(p => ({ name: p.name, priority: p.priority })),
    primaryProvider: providers[0]?.name || 'None',
    queueLength: emailQueue.length,
    isProcessing
  };
}

export default {
  sendEmail,
  sendBulkEmails,
  queueEmail,
  getEmailServiceStatus,
  validateEmailAddress,
  preprocessEmailContent,
  generateTrackingId,
  addUnsubscribeLink,
  processEmailTemplate
};