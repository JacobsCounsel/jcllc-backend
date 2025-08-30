// Smart Automation Integration for Main Server
// This connects the main index.js server to our advanced automation system

import automationEngine from '../services/automationEngine.js';
import { sendEnhancedEmail } from '../legacy/compatibility.js';

class SmartAutomationIntegration {
  
  // Process form submission and start smart automation
  async processFormSubmission(email, formData, submissionType) {
    try {
      console.log(`🧠 Processing smart automation for ${email} (${submissionType})`);
      
      // Map submission types to our smart automation system
      const typeMapping = {
        'estate-intake': 'estate-intake',
        'business-formation': 'business-formation',
        'brand-protection': 'brand-protection',
        'outside-counsel': 'outside-counsel',
        'legal-strategy-builder': 'legal-strategy-builder',
        'newsletter': 'newsletter',
        'resource-guide': 'resource-guide'
      };
      
      const mappedType = typeMapping[submissionType] || submissionType;
      
      // Enhance form data with smart analysis
      const enhancedData = {
        ...formData,
        submissionType: mappedType,
        clientProfile: this.identifyClientProfile(formData),
        leadScore: this.calculateSmartLeadScore(formData, submissionType)
      };
      
      console.log(`📊 Client profile: ${enhancedData.clientProfile}, Lead score: ${enhancedData.leadScore}`);
      
      // Start smart automation sequence
      const automationId = await automationEngine.startAutomation(email, enhancedData);
      
      if (automationId) {
        console.log(`✅ Smart automation ${automationId} started for ${email}`);
        
        // Send strategic summary to Drew
        await this.sendStrategicSummary(enhancedData, automationId);
        
        return {
          success: true,
          automationId,
          clientProfile: enhancedData.clientProfile,
          leadScore: enhancedData.leadScore,
          message: 'Smart automation started successfully'
        };
      } else {
        console.log(`⚠️ Smart automation not started for ${email} - may already exist`);
        return {
          success: false,
          message: 'Automation may already be active for this email'
        };
      }
      
    } catch (error) {
      console.error(`❌ Smart automation failed for ${email}:`, error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  // Identify client profile from form data
  identifyClientProfile(formData) {
    // Athletes
    if (formData.profession?.includes('athlete') || 
        formData.industry === 'sports' || 
        formData.careerType === 'professional_athlete') {
      return 'athlete';
    }
    
    // Creators/Influencers  
    if (formData.industry?.includes('content') || 
        formData.businessType?.includes('creator') || 
        formData.revenueStreams?.includes('brand_partnerships') || 
        (formData.socialFollowing && formData.socialFollowing > 100000)) {
      return 'creator';
    }
    
    // High-performing families
    if ((formData.estateValue && formData.estateValue > 10000000) || 
        formData.familyOffice || 
        formData.generationalWealth || 
        formData.familyComplexity === 'high' ||
        (formData.grossEstate && parseFloat(formData.grossEstate.replace(/[,$]/g, '') || '0') > 10000000)) {
      return 'high_performing_family';
    }
    
    // Startups
    if (formData.businessStage === 'startup' || 
        formData.fundingStage || 
        formData.growthPlans?.includes('venture_capital') || 
        (formData.businessAge && formData.businessAge < 5) ||
        formData.investmentPlan?.includes('vc') ||
        formData.investmentPlan?.includes('angel')) {
      return 'startup';
    }

    // Default to strategic business owner
    return 'strategic_business_owner';
  }
  
  // Calculate smart lead score
  calculateSmartLeadScore(formData, submissionType) {
    let score = 0;
    
    // Base scores by submission type
    const baseScores = {
      'estate-intake': 40,
      'business-formation': 50, 
      'brand-protection': 35,
      'outside-counsel': 45,
      'legal-strategy-builder': 35,
      'newsletter': 25,
      'resource-guide': 30
    };
    
    score += baseScores[submissionType] || 30;
    
    // Estate value scoring
    if (formData.estateValue) {
      if (formData.estateValue > 10000000) score += 50;
      else if (formData.estateValue > 5000000) score += 35;
      else if (formData.estateValue > 2000000) score += 25;
    }
    
    // Gross estate from estate intake forms
    if (formData.grossEstate) {
      const estate = parseFloat(formData.grossEstate.replace(/[,$]/g, '') || '0');
      if (estate > 10000000) score += 50;
      else if (estate > 5000000) score += 35;
      else if (estate > 2000000) score += 25;
    }
    
    // Business revenue scoring
    if (formData.businessRevenue) {
      if (formData.businessRevenue > 5000000) score += 40;
      else if (formData.businessRevenue > 2000000) score += 30;
      else if (formData.businessRevenue > 1000000) score += 20;
    }
    
    // Social following scoring
    if (formData.socialFollowing) {
      if (formData.socialFollowing > 2000000) score += 30;
      else if (formData.socialFollowing > 1000000) score += 20;
      else if (formData.socialFollowing > 500000) score += 15;
    }
    
    // Investment/funding scoring
    if (formData.investmentPlan === 'vc') score += 40;
    else if (formData.investmentPlan === 'angel') score += 25;
    
    if (formData.fundingStage) score += 25;
    
    return Math.min(score, 100);
  }
  
  // Send strategic summary email to Drew
  async sendStrategicSummary(formData, automationId) {
    try {
      const strategicSummary = this.generateStrategicSummary(formData, automationId);
      
      await sendEnhancedEmail({
        to: ['drew@jacobscounsellaw.com'],
        subject: `🧠 SMART LEAD: ${formData.clientProfile.toUpperCase()} - ${formData.firstName || formData.email} (Score: ${formData.leadScore})`,
        html: strategicSummary,
        priority: formData.leadScore >= 70 ? 'high' : 'normal'
      });
      
      console.log(`📧 Strategic summary sent to Drew for automation ${automationId}`);
      
    } catch (error) {
      console.error(`❌ Failed to send strategic summary:`, error.message);
    }
  }
  
  // Generate strategic summary HTML for Drew
  generateStrategicSummary(formData, automationId) {
    const isHighValue = formData.leadScore >= 70;
    const clientProfile = formData.clientProfile.replace('_', ' ').toUpperCase();
    
    let profileInsights = '';
    
    if (formData.clientProfile === 'athlete') {
      profileInsights = `
        <li><strong>Professional Athlete</strong> - Compressed earning timeline, brand partnerships</li>
        <li><strong>Estate Value:</strong> ${formData.estateValue ? '$' + (formData.estateValue/1000000).toFixed(1) + 'M' : 'Not specified'}</li>
        <li><strong>Career Type:</strong> ${formData.careerType || 'Not specified'}</li>
        <li><strong>Brand Partnerships:</strong> ${formData.brandPartnerships ? 'Yes' : 'No'}</li>
      `;
    } else if (formData.clientProfile === 'creator') {
      profileInsights = `
        <li><strong>Content Creator/Influencer</strong> - Digital brand monetization focus</li>
        <li><strong>Following:</strong> ${formData.socialFollowing ? (formData.socialFollowing/1000000).toFixed(1) + 'M followers' : 'Not specified'}</li>
        <li><strong>Revenue:</strong> ${formData.businessRevenue ? '$' + (formData.businessRevenue/1000000).toFixed(1) + 'M' : 'Not specified'}</li>
        <li><strong>Revenue Streams:</strong> ${formData.revenueStreams || 'Not specified'}</li>
      `;
    } else if (formData.clientProfile === 'startup') {
      profileInsights = `
        <li><strong>Startup Founder</strong> - High-growth, investment-focused</li>
        <li><strong>Funding Stage:</strong> ${formData.fundingStage || formData.investmentPlan || 'Self-funded'}</li>
        <li><strong>Revenue:</strong> ${formData.businessRevenue ? '$' + (formData.businessRevenue/1000000).toFixed(1) + 'M' : formData.projectedRevenue || 'Not specified'}</li>
        <li><strong>Business Stage:</strong> ${formData.businessStage || 'Not specified'}</li>
      `;
    } else if (formData.clientProfile === 'high_performing_family') {
      profileInsights = `
        <li><strong>High-Net-Worth Family</strong> - Multi-generational wealth planning</li>
        <li><strong>Estate Value:</strong> ${formData.estateValue ? '$' + (formData.estateValue/1000000).toFixed(1) + 'M' : formData.grossEstate || 'Not specified'}</li>
        <li><strong>Family Office:</strong> ${formData.familyOffice ? 'Yes' : 'No'}</li>
        <li><strong>Generational Wealth:</strong> ${formData.generationalWealth ? 'Yes' : 'No'}</li>
      `;
    } else {
      profileInsights = `
        <li><strong>Strategic Business Owner</strong> - Professional legal strategy focus</li>
        <li><strong>Submission Type:</strong> ${formData.submissionType}</li>
        <li><strong>Primary Need:</strong> Legal structure and protection</li>
      `;
    }
    
    return `<!DOCTYPE html>
<html>
<head>
  <title>Strategic Lead Summary</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; margin: 0; padding: 20px; background: #f8fafc; color: #1f2937; }
    .container { max-width: 700px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
    .header { background: ${isHighValue ? 'linear-gradient(135deg, #dc2626, #ef4444)' : 'linear-gradient(135deg, #1f2937, #374151)'}; color: white; padding: 30px; text-align: center; }
    .content { padding: 30px; }
    .profile-box { background: #f0f9ff; border-left: 4px solid #0ea5e9; padding: 20px; margin: 20px 0; border-radius: 8px; }
    .action-box { background: #ecfdf5; border-left: 4px solid #10b981; padding: 20px; margin: 20px 0; border-radius: 8px; }
    .cta-button { display: inline-block; background: #ff4d00; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 10px 5px; }
    ul { padding-left: 20px; }
    li { margin: 8px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 style="margin: 0; font-size: 24px;">${isHighValue ? '🔥 HIGH-VALUE' : '🧠 SMART'} LEAD ANALYSIS</h1>
      <p style="margin: 8px 0 0; opacity: 0.9;">Automation ID: ${automationId} | Score: ${formData.leadScore}/100</p>
    </div>
    
    <div class="content">
      <div class="profile-box">
        <h3 style="margin: 0 0 15px; color: #0c4a6e;">Client Profile: ${clientProfile}</h3>
        <p><strong>Name:</strong> ${formData.firstName || 'Not provided'} ${formData.lastName || ''}</p>
        <p><strong>Email:</strong> <a href="mailto:${formData.email}">${formData.email}</a></p>
        <p><strong>Phone:</strong> ${formData.phone || 'Not provided'}</p>
        
        <h4 style="margin: 20px 0 10px; color: #0c4a6e;">Strategic Insights:</h4>
        <ul style="color: #1f2937;">
          ${profileInsights}
        </ul>
      </div>
      
      <div class="action-box">
        <h3 style="margin: 0 0 15px; color: #065f46;">Smart Automation Status:</h3>
        <ul style="color: #1f2937;">
          <li>✅ Smart welcome email sent based on ${formData.clientProfile} profile</li>
          <li>✅ Client placed in personalized nurture sequence</li>
          <li>✅ Strategic consultation booking link provided</li>
          <li>📊 Interactive dashboard tracking available</li>
        </ul>
        
        <div style="margin-top: 20px;">
          <a href="mailto:${formData.email}?subject=Your Legal Consultation - Next Steps&body=Hi ${formData.firstName || 'there'},%0D%0A%0D%0AI've reviewed your ${formData.submissionType} submission and have some specific recommendations for your ${formData.clientProfile.replace('_', ' ')} situation. Are you available for a consultation this week?" class="cta-button">Email ${formData.firstName || 'Client'}</a>
          <a href="http://localhost:3000/automations" class="cta-button">View Dashboard</a>
        </div>
      </div>
      
      <details style="margin-top: 30px;">
        <summary style="cursor: pointer; font-weight: 600; padding: 10px; background: #f8fafc; border-radius: 6px;">Complete Form Data</summary>
        <pre style="background: #f1f5f9; padding: 16px; border-radius: 6px; overflow-x: auto; font-size: 12px; margin-top: 10px;">${JSON.stringify(formData, null, 2)}</pre>
      </details>
    </div>
  </div>
</body>
</html>`;
  }
  
  // Get automation dashboard stats
  async getDashboardStats() {
    try {
      return await automationEngine.getDashboardStats();
    } catch (error) {
      console.error('❌ Failed to get dashboard stats:', error.message);
      return {
        totalSubscribers: 0,
        activeAutomations: 0,
        emailsSent: 0,
        error: error.message
      };
    }
  }
}

export default new SmartAutomationIntegration();