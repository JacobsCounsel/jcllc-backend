// Enhanced Email Templates with Professional Formatting and Strong Disclaimers
// Fixes white-on-white issues and makes content more actionable

import { config } from './config/environment.js';

// Helper function to get calendly link
function getCalendlyLink(submissionType, leadScore) {
  if (leadScore.score >= 70) {
    return config.calendlyLinks['priority'];
  }
  
  const typeMap = {
    'estate-intake': 'estate-planning',
    'business-formation-intake': 'business-formation',
    'business-formation': 'business-formation', 
    'brand-protection-intake': 'brand-protection',
    'brand-protection': 'brand-protection',
    'outside-counsel': 'outside-counsel',
    'legal-strategy-builder': 'general',
    'legal-risk-assessment': 'general',
    'newsletter': 'general',
    'resource-guide': 'general'
  };
  
  return config.calendlyLinks[typeMap[submissionType]] || config.calendlyLinks['general'];
}

// Enhanced Client Confirmation Email with Strong Disclaimers
export function generateEnhancedClientEmail(formData, price, submissionType, leadScore) {
  const clientName = formData.firstName || formData.fullName?.split(' ')[0] || formData.contactName?.split(' ')[0] || 'there';
  const calendlyLink = getCalendlyLink(submissionType, leadScore);
  
  // Service-specific content
  let serviceTitle = '';
  let serviceMessage = '';
  let nextSteps = '';
  let timelineMessage = '';
  let actionableSteps = '';
  
  switch (submissionType) {
    case 'estate-intake':
    case 'estate-planning':
      serviceTitle = 'Estate Planning Intake Received';
      serviceMessage = `Thank you for submitting your estate planning information. Based on your submission, we'll prepare customized recommendations to protect your ${formData.grossEstate ? `$${parseFloat(formData.grossEstate.replace(/[,$]/g, '')).toLocaleString()}` : ''} estate.`;
      nextSteps = `
        <li><strong>Document Review:</strong> We'll analyze your current estate planning documents</li>
        <li><strong>Asset Assessment:</strong> Review your asset structure and protection needs</li>
        <li><strong>Tax Strategy:</strong> Develop strategies to minimize estate taxes</li>
        <li><strong>Custom Plan:</strong> Create your personalized estate plan</li>
      `;
      timelineMessage = 'Estate planning consultations are typically scheduled within 4-6 hours.';
      actionableSteps = `
        <div style="background: #f0fdf4; border-left: 4px solid #22c55e; padding: 16px; margin: 20px 0; border-radius: 0 8px 8px 0;">
          <h4 style="color: #15803d; margin: 0 0 8px; font-size: 16px;">📋 What You Can Do Now:</h4>
          <ul style="color: #15803d; margin: 0; padding-left: 20px; font-size: 14px; line-height: 1.6;">
            <li>Gather your current will, trusts, and estate planning documents</li>
            <li>Prepare a list of all assets (real estate, investments, business interests)</li>
            <li>Consider your goals for asset distribution and family protection</li>
            <li>Think about guardian preferences if you have minor children</li>
          </ul>
        </div>
      `;
      break;
      
    case 'business-formation-intake':
    case 'business-formation':
      serviceTitle = 'Business Formation Intake Received';
      serviceMessage = `Thank you for choosing us to help structure ${formData.businessName || 'your business'}. ${formData.investmentPlan === 'vc' ? 'As a venture-backed startup, we\'ll ensure your structure supports funding rounds and growth.' : 'We\'ll help you choose the optimal entity structure for your business goals.'}`;
      nextSteps = `
        <li><strong>Entity Analysis:</strong> Determine optimal structure (LLC, C-Corp, S-Corp)</li>
        <li><strong>Documentation:</strong> Prepare incorporation and operating agreements</li>
        <li><strong>Compliance Setup:</strong> Establish ongoing legal compliance systems</li>
        <li><strong>Growth Planning:</strong> Structure for future investment and scaling</li>
      `;
      timelineMessage = 'Business formation consultations are scheduled within 24 hours.';
      actionableSteps = `
        <div style="background: #f0fdf4; border-left: 4px solid #22c55e; padding: 16px; margin: 20px 0; border-radius: 0 8px 8px 0;">
          <h4 style="color: #15803d; margin: 0 0 8px; font-size: 16px;">📋 What You Can Do Now:</h4>
          <ul style="color: #15803d; margin: 0; padding-left: 20px; font-size: 14px; line-height: 1.6;">
            <li>Decide on your business name and check availability</li>
            <li>Consider ownership structure and equity distribution</li>
            <li>Research your state's business registration requirements</li>
            <li>Prepare information about initial funding and investment plans</li>
          </ul>
        </div>
      `;
      break;
      
    case 'brand-protection-intake':
    case 'brand-protection':
      serviceTitle = 'Brand Protection Intake Received';
      serviceMessage = `Thank you for taking steps to protect ${formData.businessName || 'your brand'}. Proactive brand protection is essential for long-term business success and competitive advantage.`;
      nextSteps = `
        <li><strong>Trademark Search:</strong> Comprehensive clearance search across databases</li>
        <li><strong>Filing Strategy:</strong> Develop optimal trademark application approach</li>
        <li><strong>Portfolio Planning:</strong> Create brand protection roadmap</li>
        <li><strong>Monitoring Setup:</strong> Establish ongoing brand surveillance</li>
      `;
      timelineMessage = 'Brand protection consultations are scheduled within 12 hours.';
      actionableSteps = `
        <div style="background: #f0fdf4; border-left: 4px solid #22c55e; padding: 16px; margin: 20px 0; border-radius: 0 8px 8px 0;">
          <h4 style="color: #15803d; margin: 0 0 8px; font-size: 16px;">📋 What You Can Do Now:</h4>
          <ul style="color: #15803d; margin: 0; padding-left: 20px; font-size: 14px; line-height: 1.6;">
            <li>Document all brand names, logos, and slogans you want to protect</li>
            <li>Gather examples of how you use your brand in commerce</li>
            <li>Research competitors to identify potential conflicts</li>
            <li>Secure relevant domain names and social media handles</li>
          </ul>
        </div>
      `;
      break;
      
    case 'outside-counsel':
      serviceTitle = 'Outside Counsel Inquiry Received';
      serviceMessage = `Thank you for considering Jacobs Counsel as your ${formData.companyName ? formData.companyName + '\'s' : 'organization\'s'} legal partner. We'll review your needs and prepare recommendations for ongoing legal support.`;
      nextSteps = `
        <li><strong>Needs Assessment:</strong> Analyze your current legal challenges and gaps</li>
        <li><strong>Service Design:</strong> Create customized legal service framework</li>
        <li><strong>Engagement Model:</strong> Propose optimal working relationship structure</li>
        <li><strong>Implementation:</strong> Establish communication protocols and workflows</li>
      `;
      timelineMessage = 'Outside counsel inquiries receive priority response within 6 hours.';
      actionableSteps = `
        <div style="background: #f0fdf4; border-left: 4px solid #22c55e; padding: 16px; margin: 20px 0; border-radius: 0 8px 8px 0;">
          <h4 style="color: #15803d; margin: 0 0 8px; font-size: 16px;">📋 What You Can Do Now:</h4>
          <ul style="color: #15803d; margin: 0; padding-left: 20px; font-size: 14px; line-height: 1.6;">
            <li>Identify your most pressing legal challenges and priorities</li>
            <li>Gather information about current legal vendors and costs</li>
            <li>Consider your preferred communication style and frequency</li>
            <li>Think about budget parameters for ongoing legal support</li>
          </ul>
        </div>
      `;
      break;
      
    case 'legal-risk-assessment':
      serviceTitle = 'Legal Risk Assessment Results';
      
      // Parse the detailed assessment data
      const riskScore = formData.overallRiskScore || 'Not calculated';
      const riskBreakdown = formData.riskBreakdown ? JSON.parse(formData.riskBreakdown) : {};
      const recommendations = formData.recommendations ? JSON.parse(formData.recommendations) : [];
      const highRiskAreas = formData.highRiskAreas ? JSON.parse(formData.highRiskAreas) : [];
      
      let riskLevel = 'Low Risk';
      let riskColor = '#10b981';
      if (riskScore > 20) {
        riskLevel = 'High Risk';
        riskColor = '#dc2626';
      } else if (riskScore > 10) {
        riskLevel = 'Medium Risk';
        riskColor = '#f59e0b';
      }
      
      serviceMessage = `Your comprehensive legal risk assessment is complete. Your overall risk level is <strong style="color: ${riskColor};">${riskLevel}</strong> (Score: ${riskScore}/30).`;
      
      if (highRiskAreas.length > 0) {
        serviceMessage += ` We've identified <strong>${highRiskAreas.length}</strong> area${highRiskAreas.length > 1 ? 's' : ''} requiring immediate attention: <em>${highRiskAreas.join(', ')}</em>.`;
      } else {
        serviceMessage += ` Your legal protections are well-structured with opportunities for optimization.`;
      }
      
      nextSteps = `
        <li><strong>Risk Review:</strong> Detailed analysis of your assessment results</li>
        <li><strong>Priority Planning:</strong> Address highest-risk areas first</li>
        <li><strong>Protection Strategy:</strong> Develop comprehensive legal protection plan</li>
        <li><strong>Implementation:</strong> Execute recommendations with professional guidance</li>
      `;
      
      timelineMessage = 'Risk assessment consultations are available within 24 hours for priority cases.';
      actionableSteps = `
        <div style="background: #f8fafc; border-left: 4px solid #ff4d00; padding: 20px; margin: 20px 0; border-radius: 8px;">
          <h3 style="color: #1f2937; margin-bottom: 15px; font-size: 18px; font-weight: 700;">📋 Your Priority Action Items</h3>
          ${highRiskAreas.length > 0 ? 
            `<div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 6px; padding: 15px; margin-bottom: 15px;">
              <p style="color: #dc2626; font-weight: 600; margin: 0 0 8px 0;">⚠️ Immediate Attention Required:</p>
              <ul style="color: #7f1d1d; margin: 0 0 0 20px; padding: 0; list-style-type: disc;">
                ${highRiskAreas.map(area => `<li style="margin-bottom: 5px; line-height: 1.4;">${area}</li>`).join('')}
              </ul>
            </div>` : ''
          }
          <p style="color: #374151; margin-bottom: 10px; font-weight: 600;">Recommended next steps based on your assessment:</p>
          <ol style="color: #4b5563; margin: 0 0 0 20px; padding: 0; list-style-type: decimal;">
            ${recommendations.slice(0, 3).map(rec => `<li style="margin-bottom: 8px; line-height: 1.5;">${rec.includes(':') ? rec.split(':')[1]?.trim() : rec}</li>`).join('')}
          </ol>
        </div>
      `;
      break;
      
    case 'legal-strategy-builder':
      serviceTitle = 'Legal Strategy Assessment Complete';
      serviceMessage = `Your Legal Strategy Assessment score: ${formData.assessmentScore || leadScore.score}/100. ${leadScore.score >= 70 ? 'Your score indicates strong foundations with optimization opportunities.' : leadScore.score >= 50 ? 'Your score shows solid fundamentals with key areas needing attention.' : 'Your score reveals significant opportunities to strengthen your legal position.'}`;
      nextSteps = `
        <li><strong>Results Review:</strong> Deep-dive into your assessment findings</li>
        <li><strong>Priority Ranking:</strong> Identify highest-impact legal initiatives</li>
        <li><strong>Roadmap Creation:</strong> Build 12-month legal strategy plan</li>
        <li><strong>Implementation Support:</strong> Guide execution of recommendations</li>
      `;
      timelineMessage = 'Strategy consultations are scheduled within 2-4 hours for detailed assessments.';
      actionableSteps = `
        <div style="background: #f0fdf4; border-left: 4px solid #22c55e; padding: 16px; margin: 20px 0; border-radius: 0 8px 8px 0;">
          <h4 style="color: #15803d; margin: 0 0 8px; font-size: 16px;">📋 What You Can Do Now:</h4>
          <ul style="color: #15803d; margin: 0; padding-left: 20px; font-size: 14px; line-height: 1.6;">
            <li>Review your assessment answers and consider areas for improvement</li>
            <li>Prioritize which legal gaps feel most urgent to your business</li>
            <li>Gather relevant documents for areas flagged in the assessment</li>
            <li>Consider your timeline and budget for legal improvements</li>
          </ul>
        </div>
      `;
      break;
      
    default:
      serviceTitle = 'Legal Consultation Request Received';
      serviceMessage = 'Thank you for your interest in our legal services. We\'ve received your submission and will be in touch soon with next steps.';
      nextSteps = `
        <li><strong>Initial Review:</strong> Analyze your specific legal needs</li>
        <li><strong>Strategy Development:</strong> Prepare customized recommendations</li>
        <li><strong>Consultation:</strong> Schedule discussion of your legal priorities</li>
        <li><strong>Action Plan:</strong> Create implementation roadmap</li>
      `;
      timelineMessage = 'We typically respond to inquiries within 24 hours.';
  }
  
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${serviceTitle} - Jacobs Counsel LLC</title>
</head>
<body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 20px; background-color: #f8fafc; color: #1f2937; line-height: 1.6;">
  <div style="max-width: 650px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);">
    
    <!-- Header -->
    <div style="background: linear-gradient(135deg, #1f2937 0%, #374151 100%); padding: 40px 30px; text-align: center; color: #ffffff;">
      <div style="background: #ffffff; width: 60px; height: 60px; border-radius: 50%; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center; font-size: 24px;">⚖️</div>
      <h1 style="margin: 0 0 8px; font-size: 26px; font-weight: 700; color: #ffffff;">${serviceTitle}</h1>
      <p style="margin: 0; font-size: 16px; color: #d1d5db; font-weight: 500;">Jacobs Counsel LLC | Strategic Legal Solutions</p>
    </div>
    
    <!-- Main Content -->
    <div style="padding: 40px 30px; color: #1f2937;">
      <div style="background: #fef3f2; border: 2px solid #fca5a5; border-radius: 8px; padding: 20px; margin-bottom: 30px;">
        <h3 style="color: #dc2626; margin: 0 0 12px; font-size: 18px; font-weight: 700;">⚖️ CRITICAL LEGAL NOTICE</h3>
        <p style="color: #7f1d1d; font-size: 14px; line-height: 1.6; margin: 0; font-weight: 600;">
          <strong>NO ATTORNEY-CLIENT PRIVILEGE EXISTS.</strong> This communication does NOT create an attorney-client relationship. 
          Any information you have provided is NOT protected by attorney-client privilege until you have executed a formal 
          engagement letter with Jacobs Counsel LLC. Do not send confidential or sensitive information until a signed 
          engagement agreement is in place.
        </p>
      </div>

      <h2 style="color: #1f2937; margin: 0 0 16px; font-size: 22px; font-weight: 700;">Hello ${clientName},</h2>
      
      <p style="font-size: 16px; line-height: 1.7; margin: 0 0 24px; color: #374151;">${serviceMessage}</p>
      
      ${price ? `
      <div style="background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%); border: 2px solid #3b82f6; border-radius: 12px; padding: 24px; margin: 24px 0; text-align: center;">
        <h3 style="color: #1d4ed8; margin: 0 0 8px; font-size: 18px; font-weight: 700;">Investment Estimate</h3>
        <p style="color: #1d4ed8; font-size: 28px; font-weight: 800; margin: 0;">${typeof price === 'number' ? '$' + price.toLocaleString() : price}</p>
        <p style="color: #3730a3; font-size: 14px; margin: 8px 0 0;">*Final pricing confirmed during consultation</p>
      </div>
      ` : ''}
      
      <div style="background: #f8fafc; border-radius: 12px; padding: 28px; margin: 28px 0; border: 1px solid #e5e7eb;">
        <h3 style="color: #1f2937; margin: 0 0 20px; font-size: 20px; font-weight: 700;">🎯 Your Strategic Legal Roadmap:</h3>
        <ul style="color: #374151; line-height: 1.7; margin: 0; padding-left: 0; list-style: none; font-size: 15px;">
          ${nextSteps.split('<li>').filter(item => item.trim()).map(item => 
            `<li style="margin: 12px 0; padding: 12px; background: #ffffff; border-radius: 8px; border-left: 4px solid #f59e0b; font-weight: 500;">
              ✓ ${item.replace('</li>', '').replace('<strong>', '<strong style="color: #1f2937;">').replace('</strong>', '</strong>')}
            </li>`
          ).join('')}
        </ul>
      </div>
      
      ${actionableSteps}
      
      <div style="text-align: center; margin: 40px 0; padding: 24px; background: linear-gradient(135deg, #ff4d00 0%, #dc2626 100%); border-radius: 12px;">
        <h3 style="color: #ffffff; margin: 0 0 12px; font-size: 18px;">🚀 Ready to Move Forward?</h3>
        <a href="${calendlyLink}" 
           style="display: inline-block; background: #ffffff; color: #1f2937; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: 700; font-size: 16px; margin: 8px 0; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); transition: all 0.3s ease;">
          📅 Schedule Your Strategic Consultation
        </a>
        <p style="color: #fef2f2; font-size: 14px; margin: 12px 0 0; font-weight: 500;">${timelineMessage}</p>
      </div>
      
      ${leadScore.score >= 70 ? `
      <div style="background: linear-gradient(135deg, #dc2626 0%, #7f1d1d 100%); color: #ffffff; padding: 24px; border-radius: 12px; margin: 24px 0; text-align: center; border: 2px solid #fca5a5;">
        <h3 style="margin: 0 0 8px; font-size: 18px; font-weight: 700;">🔥 PRIORITY STATUS ACTIVATED</h3>
        <p style="margin: 0; font-size: 15px; font-weight: 600;">Your submission has been flagged for expedited review due to complexity and strategic value. Expect accelerated response times.</p>
      </div>
      ` : ''}
      
      <!-- Information Disclaimer -->
      <div style="background: #fef7ed; border: 2px solid #fed7aa; border-radius: 8px; padding: 20px; margin: 32px 0;">
        <h4 style="color: #9a3412; margin: 0 0 12px; font-size: 16px; font-weight: 700;">📄 Important Information Notice</h4>
        <p style="color: #9a3412; font-size: 13px; line-height: 1.6; margin: 0; font-weight: 600;">
          This communication is for INFORMATIONAL PURPOSES ONLY and does not constitute legal advice. 
          The information provided is general in nature and may not apply to your specific situation. 
          Legal advice can only be given after establishing a formal attorney-client relationship through a signed engagement agreement.
        </p>
      </div>
      
      <div style="border-top: 2px solid #e5e7eb; padding-top: 28px; margin-top: 40px;">
        <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 20px;">
          <div>
            <h4 style="color: #1f2937; margin: 0 0 8px; font-size: 18px; font-weight: 700;">Drew Jacobs, Esq.</h4>
            <p style="color: #6b7280; margin: 0; font-size: 14px; line-height: 1.5;">
              Founder & Managing Attorney<br>
              Jacobs Counsel LLC<br>
              <strong>Email:</strong> <a href="mailto:drew@jacobscounsellaw.com" style="color: #ff4d00; text-decoration: none; font-weight: 600;">drew@jacobscounsellaw.com</a><br>
              <strong>Web:</strong> <a href="https://jacobscounsellaw.com" style="color: #ff4d00; text-decoration: none; font-weight: 600;">jacobscounsellaw.com</a>
            </p>
          </div>
          <div style="text-align: right;">
            <div style="background: #1f2937; color: #ffffff; padding: 12px 16px; border-radius: 8px; font-size: 12px; font-weight: 600; text-align: center;">
              CONFIDENTIAL<br>LEGAL COMMUNICATION
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Footer -->
    <div style="background: #1f2937; padding: 24px 30px; color: #d1d5db; text-align: center; font-size: 12px; line-height: 1.5;">
      <p style="margin: 0 0 8px;">© 2025 Jacobs Counsel LLC. All rights reserved.</p>
      <p style="margin: 0;">This communication may contain confidential and privileged information once attorney-client relationship is established.</p>
    </div>
  </div>
</body>
</html>`;
}

// Enhanced Internal Alert Email with Actionable Information
export function generateEnhancedInternalEmail(formData, leadScore, submissionType, aiAnalysis, submissionId) {
  const isHighValue = leadScore.score >= 70;
  const calendlyLink = getCalendlyLink(submissionType, leadScore);
  
  // Extract client info
  const clientName = formData.firstName || formData.fullName?.split(' ')[0] || formData.contactName?.split(' ')[0] || formData.email?.split('@')[0] || 'Unknown';
  const businessName = formData.businessName || formData.companyName || '';
  const displayName = businessName ? `${clientName} (${businessName})` : clientName;
  
  // Determine urgency and priority
  let urgencyLevel = 'STANDARD';
  let priorityEmoji = '⚪';
  let actionColor = '#6b7280';
  
  if (leadScore.score >= 80) {
    urgencyLevel = 'URGENT - CALL IMMEDIATELY';
    priorityEmoji = '🚨';
    actionColor = '#dc2626';
  } else if (leadScore.score >= 70) {
    urgencyLevel = 'HIGH PRIORITY';
    priorityEmoji = '🔥';
    actionColor = '#ea580c';
  } else if (leadScore.score >= 60) {
    urgencyLevel = 'WARM LEAD';
    priorityEmoji = '🟡';
    actionColor = '#d97706';
  }
  
  // Get service-specific insights and actions
  let keyInsights = [];
  let immediateActions = [];
  let revenue = 'Unknown';
  
  switch (submissionType) {
    case 'estate-intake':
    case 'estate-planning':
      const estateValue = formData.grossEstate ? parseFloat(formData.grossEstate.replace(/[,$]/g, '')) : 0;
      if (estateValue > 0) {
        revenue = `$${estateValue.toLocaleString()} estate`;
        if (estateValue > 5000000) {
          urgencyLevel = 'ULTRA HIGH VALUE - CALL NOW';
          priorityEmoji = '💎';
          actionColor = '#7c2d12';
          immediateActions.push('Call within 2 hours - ultra high net worth');
        } else if (estateValue > 2000000) {
          immediateActions.push('Priority scheduling - high net worth estate');
        }
      }
      
      keyInsights.push(`Estate Value: ${revenue}`);
      keyInsights.push(`Package: ${formData.packagePreference || 'Not specified'}`);
      keyInsights.push(`Business Owner: ${formData.ownBusiness || 'Unknown'}`);
      keyInsights.push(`Marital Status: ${formData.maritalStatus || 'Unknown'}`);
      
      if (!immediateActions.length) {
        immediateActions.push('Send estate planning consultation calendar link');
        immediateActions.push('Prepare estate value analysis');
      }
      break;
      
    case 'business-formation-intake':
    case 'business-formation':
      if (formData.investmentPlan === 'vc') {
        urgencyLevel = 'URGENT - VC TIMELINE';
        priorityEmoji = '🚀';
        actionColor = '#7c2d12';
        immediateActions.push('Call immediately - VC funding timeline is critical');
        revenue = 'VC-backed startup';
      } else if (formData.investmentPlan === 'angel') {
        immediateActions.push('Fast-track angel-ready structure consultation');
        revenue = 'Angel funding planned';
      }
      
      keyInsights.push(`Investment Plan: ${formData.investmentPlan || 'Not specified'}`);
      keyInsights.push(`Business Type: ${formData.businessType || 'Not specified'}`);
      keyInsights.push(`Projected Revenue: ${formData.projectedRevenue || 'Unknown'}`);
      
      if (!immediateActions.length) {
        immediateActions.push('Send business formation consultation link');
        immediateActions.push('Prepare entity structure recommendations');
      }
      break;
      
    case 'legal-risk-assessment':
      // Parse assessment data for internal analysis
      const assessmentRiskScore = formData.overallRiskScore || 0;
      const assessmentHighRiskAreas = formData.highRiskAreas ? JSON.parse(formData.highRiskAreas) : [];
      const assessmentRecommendations = formData.recommendations ? JSON.parse(formData.recommendations) : [];
      
      if (assessmentRiskScore > 20) {
        urgencyLevel = 'HIGH RISK - IMMEDIATE ACTION REQUIRED';
        priorityEmoji = '🚨';
        actionColor = '#dc2626';
        immediateActions.push('Call within 2 hours - multiple high-risk areas identified');
        immediateActions.push('Prepare comprehensive protection strategy');
      } else if (assessmentRiskScore > 12) {
        urgencyLevel = 'MEDIUM RISK - PRIORITY CONSULTATION';
        priorityEmoji = '⚠️';
        actionColor = '#f59e0b';
        immediateActions.push('Schedule consultation within 24 hours');
      } else {
        immediateActions.push('Send optimization consultation link');
        immediateActions.push('Prepare enhancement recommendations');
      }
      
      keyInsights.push(`Overall Risk Score: ${assessmentRiskScore}/30`);
      if (assessmentHighRiskAreas.length > 0) {
        keyInsights.push(`High-Risk Areas: ${assessmentHighRiskAreas.join(', ')}`);
      }
      keyInsights.push(`Assessment Categories: Entity Structure, Contracts, IP, Employment, Regulatory, Estate Planning, Insurance`);
      
      // Add specific assessment details
      if (formData.entity) keyInsights.push(`Entity Structure: ${formData.entity}`);
      if (formData.contracts) keyInsights.push(`Contracts: ${formData.contracts}`);
      if (formData.ip) keyInsights.push(`IP Protection: ${formData.ip}`);
      if (formData.employment) keyInsights.push(`Employment: ${formData.employment}`);
      if (formData.regulatory) keyInsights.push(`Regulatory: ${formData.regulatory}`);
      if (formData.estate) keyInsights.push(`Estate Planning: ${formData.estate}`);
      if (formData.insurance) keyInsights.push(`Insurance: ${formData.insurance}`);
      
      break;
      
    case 'brand-protection-intake':
    case 'brand-protection':
      keyInsights.push(`Business Stage: ${formData.businessStage || 'Unknown'}`);
      keyInsights.push(`Protection Goal: ${formData.protectionGoal || 'General'}`);
      keyInsights.push(`Service Interest: ${formData.servicePreference || 'Unknown'}`);
      
      if (formData.protectionGoal?.includes('enforcement')) {
        urgencyLevel = 'URGENT - ENFORCEMENT NEEDED';
        priorityEmoji = '⚔️';
        actionColor = '#dc2626';
        immediateActions.push('Call immediately - active infringement situation');
      } else {
        immediateActions.push('Send brand protection consultation link');
        immediateActions.push('Prepare trademark clearance search');
      }
      break;
      
    case 'outside-counsel':
      keyInsights.push(`Company: ${formData.companyName || 'Not specified'}`);
      keyInsights.push(`Legal Needs: ${formData.legalNeeds || 'General counsel'}`);
      keyInsights.push(`Budget Range: ${formData.budget || 'Not specified'}`);
      
      if (formData.urgency?.includes('Immediate')) {
        urgencyLevel = 'CRITICAL - IMMEDIATE NEED';
        priorityEmoji = '🚨';
        actionColor = '#7f1d1d';
        immediateActions.push('Call immediately - client has urgent legal matter');
      } else {
        immediateActions.push('Send outside counsel consultation link');
        immediateActions.push('Prepare needs assessment framework');
      }
      break;
      
    case 'legal-strategy-builder':
      const assessmentScore = parseInt(formData.assessmentScore) || leadScore.score;
      keyInsights.push(`Assessment Score: ${assessmentScore}/100`);
      keyInsights.push(`Role: ${formData.q1 || 'Not specified'}`);
      keyInsights.push(`Business Stage: ${formData.q2 || 'Unknown'}`);
      
      // Identify critical gaps
      const gaps = [];
      if (formData.q3 === 'none') gaps.push('No entity structure');
      if (formData.q4 === 'none') gaps.push('No IP protection');
      if (formData.q5 === 'handshake') gaps.push('No contracts');
      
      if (gaps.length > 0) {
        keyInsights.push(`CRITICAL GAPS: ${gaps.join(', ')}`);
        immediateActions.push('Address critical legal gaps immediately');
      }
      
      immediateActions.push('Send strategic consultation calendar link');
      immediateActions.push('Prepare gap analysis and recommendations');
      break;
  }
  
  // Add AI analysis if available
  if (aiAnalysis?.analysis) {
    keyInsights.push(`AI Analysis: ${aiAnalysis.analysis.substring(0, 100)}...`);
  }
  
  return `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 20px; background: #f8fafc; color: #1f2937; line-height: 1.5;">

<!-- Priority Header -->
<div style="background: linear-gradient(135deg, ${actionColor}, #1f2937); padding: 24px; border-radius: 12px; text-align: center; margin-bottom: 24px; color: #ffffff;">
  <h1 style="color: #ffffff; font-size: 24px; margin: 0 0 8px; font-weight: 800;">${priorityEmoji} ${urgencyLevel}</h1>
  <h2 style="color: #ffffff; font-size: 20px; margin: 0 0 8px; font-weight: 600;">${displayName}</h2>
  <p style="color: #d1d5db; margin: 0; font-size: 16px; font-weight: 500;">Lead Score: ${leadScore.score}/100 | Revenue: ${revenue}</p>
</div>

<!-- Client Information -->
<div style="background: #ffffff; padding: 24px; border-radius: 12px; margin-bottom: 20px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);">
  <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 20px;">
    <div style="flex: 1; min-width: 300px;">
      <h3 style="margin: 0 0 16px; font-size: 18px; font-weight: 700; color: #1f2937;">👤 Client Details</h3>
      <p style="margin: 0; font-size: 15px; line-height: 1.6; color: #374151;">
        <strong>Name:</strong> ${clientName}<br>
        ${businessName ? `<strong>Company:</strong> ${businessName}<br>` : ''}
        <strong>Email:</strong> <a href="mailto:${formData.email}" style="color: #ff4d00; text-decoration: none; font-weight: 600;">${formData.email}</a><br>
        ${formData.phone ? `<strong>Phone:</strong> <a href="tel:${formData.phone}" style="color: #ff4d00; text-decoration: none; font-weight: 600;">${formData.phone}</a><br>` : ''}
        <strong>Service:</strong> ${submissionType.replace('-', ' ')}<br>
        <strong>Submission ID:</strong> ${submissionId}<br>
        <strong>Time:</strong> ${new Date().toLocaleString()}
      </p>
    </div>
    
    <div style="flex: 0 0 auto;">
      <div style="text-align: center; margin-bottom: 16px;">
        <a href="mailto:${formData.email}?subject=Your Legal Strategy Assessment - Next Steps&body=Hi ${clientName},%0D%0A%0D%0AThanks for your submission. I'd like to schedule a strategic consultation to discuss your priorities.%0D%0A%0D%0AHere's my calendar: ${calendlyLink}%0D%0A%0D%0ABest regards,%0D%0ADrew Jacobs" 
           style="display: inline-block; background: linear-gradient(135deg, #ff4d00, #dc2626); color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: 700; font-size: 14px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          📧 Email Client
        </a>
      </div>
      <div style="text-align: center;">
        <a href="${calendlyLink}" target="_blank"
           style="display: inline-block; background: #1f2937; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: 700; font-size: 14px;">
          📅 Calendar Link
        </a>
      </div>
    </div>
  </div>
</div>

<!-- Key Insights -->
<div style="background: #ffffff; padding: 24px; border-radius: 12px; margin-bottom: 20px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);">
  <h3 style="margin: 0 0 16px; font-size: 18px; font-weight: 700; color: #1f2937;">🔍 Key Insights</h3>
  <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 12px;">
    ${keyInsights.map(insight => 
      `<div style="background: #f8fafc; padding: 12px; border-radius: 8px; border-left: 4px solid #ff4d00;">
        <p style="margin: 0; font-size: 14px; font-weight: 600; color: #374151;">${insight}</p>
      </div>`
    ).join('')}
  </div>
</div>

<!-- Immediate Actions -->
<div style="background: linear-gradient(135deg, #dc2626, #7f1d1d); padding: 24px; border-radius: 12px; margin-bottom: 20px; color: #ffffff;">
  <h3 style="color: #ffffff; margin: 0 0 16px; font-size: 18px; font-weight: 700;">🎯 IMMEDIATE ACTIONS REQUIRED</h3>
  <ul style="color: #fecaca; margin: 0; padding-left: 20px; line-height: 1.7;">
    ${immediateActions.map(action => 
      `<li style="margin: 8px 0; font-size: 15px; font-weight: 600;">${action}</li>`
    ).join('')}
  </ul>
</div>

${aiAnalysis?.analysis ? `
<!-- AI Analysis -->
<div style="background: #f0f9ff; border: 2px solid #3b82f6; padding: 20px; border-radius: 12px; margin-bottom: 20px;">
  <h3 style="color: #1d4ed8; margin: 0 0 12px; font-size: 16px; font-weight: 700;">🤖 AI Analysis</h3>
  <p style="color: #1e40af; margin: 0; font-size: 14px; line-height: 1.6;"><strong>Analysis:</strong> ${aiAnalysis.analysis}</p>
  ${aiAnalysis.recommendations ? `<p style="color: #1e40af; margin: 8px 0 0; font-size: 14px; line-height: 1.6;"><strong>Recommendations:</strong> ${aiAnalysis.recommendations}</p>` : ''}
  ${aiAnalysis.riskFlags ? `<p style="color: #dc2626; margin: 8px 0 0; font-size: 14px; line-height: 1.6; font-weight: 700;"><strong>Risk Flags:</strong> ${aiAnalysis.riskFlags}</p>` : ''}
</div>
` : ''}

<!-- Form Data -->
<div style="background: #ffffff; padding: 20px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);">
  <h3 style="margin: 0 0 16px; font-size: 16px; font-weight: 700; color: #1f2937;">📋 Complete Form Submission</h3>
  <pre style="background: #f8fafc; padding: 16px; border-radius: 8px; font-size: 12px; line-height: 1.4; color: #374151; overflow-x: auto; white-space: pre-wrap; margin: 0;">${JSON.stringify(formData, null, 2)}</pre>
</div>

</body>
</html>`;
}