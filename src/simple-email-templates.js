// Simple, Clean Email Templates - Built from Scratch
// No white on white, readable, actionable

export function generateInternalEmail(formData, riskScore, submissionType) {
  const name = formData.name || 'Unknown';
  const email = formData.email || 'No email';
  const score = parseInt(formData.overallRiskScore) || 0;
  
  let riskLevel = 'Low Risk';
  let urgency = 'Standard';
  let leadPriority = 'Medium';
  
  if (score > 20) {
    riskLevel = 'HIGH RISK';
    urgency = 'URGENT - Contact within 4 hours';
    leadPriority = 'HIGH PRIORITY';
  } else if (score > 10) {
    riskLevel = 'Medium Risk';
    urgency = 'Contact within 24 hours';
    leadPriority = 'Medium Priority';
  }
  
  let highRiskAreas = [];
  let recommendations = [];
  let riskBreakdown = {};
  
  try {
    highRiskAreas = formData.highRiskAreas ? JSON.parse(formData.highRiskAreas) : [];
  } catch (e) {
    highRiskAreas = [];
  }
  
  try {
    recommendations = formData.recommendations ? JSON.parse(formData.recommendations) : [];
  } catch (e) {
    recommendations = [];
  }
  
  try {
    riskBreakdown = formData.riskBreakdown ? JSON.parse(formData.riskBreakdown) : {};
  } catch (e) {
    riskBreakdown = {};
  }
  
  // Generate intelligent analysis
  const hasEntityRisk = riskBreakdown.entity > 15;
  const hasIPRisk = riskBreakdown.ip > 15;
  const hasEstateRisk = riskBreakdown.estate > 20;
  const hasInsuranceRisk = riskBreakdown.insurance > 18;
  
  let businessAnalysis = '';
  if (hasEntityRisk && hasIPRisk) {
    businessAnalysis = 'Business structure and IP protection gaps indicate potential significant liability exposure.';
  } else if (hasEntityRisk) {
    businessAnalysis = 'Entity structure needs optimization for asset protection and tax efficiency.';
  } else if (hasIPRisk) {
    businessAnalysis = 'Intellectual property assets are unprotected and at risk.';
  }
  
  let personalAnalysis = '';
  if (hasEstateRisk && hasInsuranceRisk) {
    personalAnalysis = 'Personal wealth protection is inadequate - estate and insurance gaps create major vulnerabilities.';
  } else if (hasEstateRisk) {
    personalAnalysis = 'Estate planning deficiencies could result in significant tax liability and family disputes.';
  }
  
  const totalExposure = Object.values(riskBreakdown).reduce((sum, val) => sum + (val || 0), 0);
  let potentialValue = 'Standard consultation';
  if (totalExposure > 100) potentialValue = '$25K+ engagement potential';
  else if (totalExposure > 80) potentialValue = '$15K+ engagement potential';
  else if (totalExposure > 60) potentialValue = '$10K+ engagement potential';
  
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>New Legal Risk Assessment</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; background-color: #f4f4f4; margin: 0; padding: 20px;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 30px; border-radius: 8px;">
    
    <h1 style="color: #d32f2f; margin-bottom: 20px; font-size: 24px;">
      🚨 New Legal Risk Assessment
    </h1>
    
    <div style="background-color: #f5f5f5; padding: 20px; border-radius: 5px; margin-bottom: 20px;">
      <h2 style="color: #333; margin-top: 0;">Client Information</h2>
      <p><strong>Name:</strong> ${name}</p>
      <p><strong>Email:</strong> ${email}</p>
      <p><strong>Risk Score:</strong> ${score}/30 (${riskLevel})</p>
      <p><strong>Lead Priority:</strong> ${leadPriority}</p>
      <p><strong>Urgency:</strong> ${urgency}</p>
      <p><strong>Potential Value:</strong> ${potentialValue}</p>
    </div>
    
    ${businessAnalysis || personalAnalysis ? `
    <div style="background-color: #fff3cd; border-left: 4px solid #f0ad4e; padding: 15px; margin: 20px 0;">
      <h3 style="color: #8a6d3b; margin-top: 0;">🎯 STRATEGIC ANALYSIS</h3>
      ${businessAnalysis ? `<p><strong>Business Risk:</strong> ${businessAnalysis}</p>` : ''}
      ${personalAnalysis ? `<p><strong>Personal Risk:</strong> ${personalAnalysis}</p>` : ''}
    </div>
    ` : ''}
    
    ${Object.keys(riskBreakdown).length > 0 ? `
    <div style="background-color: #f8f9fa; border: 1px solid #dee2e6; padding: 15px; margin: 20px 0; border-radius: 5px;">
      <h3 style="color: #495057; margin-top: 0;">📊 RISK BREAKDOWN</h3>
      <ul style="margin: 0; padding-left: 20px;">
        ${Object.entries(riskBreakdown).map(([area, score]) => {
          const areaName = area.charAt(0).toUpperCase() + area.slice(1);
          const color = score > 15 ? '#d32f2f' : score > 8 ? '#f57c00' : '#388e3c';
          return `<li style="margin-bottom: 5px;"><strong>${areaName}:</strong> <span style="color: ${color}; font-weight: bold;">${score}/30</span></li>`;
        }).join('')}
      </ul>
    </div>
    ` : ''}
    
    ${highRiskAreas.length > 0 ? `
    <div style="background-color: #ffebee; border-left: 4px solid #d32f2f; padding: 15px; margin: 20px 0;">
      <h3 style="color: #d32f2f; margin-top: 0;">⚠️ HIGH RISK AREAS</h3>
      <ul style="margin: 0; padding-left: 20px;">
        ${highRiskAreas.map(area => `<li style="margin-bottom: 5px;">${area}</li>`).join('')}
      </ul>
    </div>
    ` : ''}
    
    ${recommendations.length > 0 ? `
    <div style="background-color: #e8f5e8; border-left: 4px solid #4caf50; padding: 15px; margin: 20px 0;">
      <h3 style="color: #2e7d32; margin-top: 0;">💡 RECOMMENDATIONS</h3>
      <ul style="margin: 0; padding-left: 20px;">
        ${recommendations.slice(0, 3).map(rec => `<li style="margin-bottom: 5px;">${rec}</li>`).join('')}
      </ul>
    </div>
    ` : ''}
    
    <div style="margin-top: 30px; padding: 20px; background-color: #1976d2; border-radius: 5px;">
      <p style="color: #ffffff; margin: 0; text-align: center; font-size: 16px;">
        <strong>Action Required:</strong> Contact client within 24 hours
      </p>
    </div>
    
  </div>
</body>
</html>
  `;
}

export function generateClientEmail(formData, riskScore, submissionType) {
  const name = formData.name?.split(' ')[0] || 'there';
  const score = parseInt(formData.overallRiskScore) || 0;
  
  let riskLevel = 'Low Risk';
  let riskColor = '#4caf50';
  let personalizedMessage = '';
  let urgencyMessage = '';
  
  if (score > 20) {
    riskLevel = 'High Risk';
    riskColor = '#d32f2f';
    personalizedMessage = `Your assessment reveals significant legal vulnerabilities that require immediate attention. The areas we've identified could expose you to substantial liability and financial risk.`;
    urgencyMessage = 'We recommend scheduling a consultation within the next 48 hours to address these critical gaps.';
  } else if (score > 10) {
    riskLevel = 'Medium Risk';
    riskColor = '#ff9800';
    personalizedMessage = `Your assessment shows moderate legal exposure with specific areas that need strengthening. While not immediately critical, addressing these gaps will significantly improve your legal protection.`;
    urgencyMessage = 'We recommend scheduling a consultation within the next week to discuss optimization strategies.';
  } else {
    personalizedMessage = `Your assessment shows strong legal foundations with opportunities for optimization. You're ahead of most businesses/individuals in legal preparedness.`;
    urgencyMessage = 'Consider a consultation to explore advanced strategies for continued protection and growth.';
  }
  
  let highRiskAreas = [];
  let recommendations = [];
  let riskBreakdown = {};
  
  try {
    highRiskAreas = formData.highRiskAreas ? JSON.parse(formData.highRiskAreas) : [];
  } catch (e) {
    highRiskAreas = [];
  }
  
  try {
    recommendations = formData.recommendations ? JSON.parse(formData.recommendations) : [];
  } catch (e) {
    recommendations = [];
  }
  
  try {
    riskBreakdown = formData.riskBreakdown ? JSON.parse(formData.riskBreakdown) : {};
  } catch (e) {
    riskBreakdown = {};
  }
  
  // Generate specific insights based on risk areas
  let specificInsights = '';
  const hasEntityRisk = riskBreakdown.entity > 15;
  const hasIPRisk = riskBreakdown.ip > 15;
  const hasEstateRisk = riskBreakdown.estate > 20;
  
  if (hasEntityRisk && hasIPRisk) {
    specificInsights = 'Your business structure and intellectual property are your biggest vulnerabilities. Proper entity formation and IP protection could save you hundreds of thousands in liability exposure.';
  } else if (hasEstateRisk) {
    specificInsights = 'Estate planning gaps are your primary concern. Without proper structures, your family could face significant tax burdens and potential conflicts.';
  } else if (hasEntityRisk) {
    specificInsights = 'Your business entity structure needs optimization. The right setup could provide better asset protection and tax advantages.';
  }
  
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Your Legal Risk Assessment Results</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; background-color: #f4f4f4; margin: 0; padding: 20px;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 30px; border-radius: 8px;">
    
    <div style="text-align: center; margin-bottom: 30px;">
      <h1 style="color: #1976d2; margin-bottom: 10px; font-size: 28px;">Legal Risk Assessment Results</h1>
      <p style="color: #666; margin: 0;">Jacobs Counsel - Strategic Legal Guidance</p>
    </div>
    
    <div style="background-color: #f5f5f5; padding: 20px; border-radius: 5px; margin-bottom: 20px;">
      <h2 style="color: #333; margin-top: 0;">Hi ${name},</h2>
      <p>Thank you for completing your legal risk assessment. Here's your personalized analysis:</p>
      <p><strong>${personalizedMessage}</strong></p>
      ${urgencyMessage ? `<p style="color: ${riskColor}; font-weight: bold;">${urgencyMessage}</p>` : ''}
    </div>
    
    ${specificInsights ? `
    <div style="background-color: #e3f2fd; border-left: 4px solid #1976d2; padding: 20px; margin: 30px 0;">
      <h3 style="color: #1565c0; margin-top: 0;">💡 KEY INSIGHT FOR YOU</h3>
      <p style="font-size: 16px; line-height: 1.6; margin: 0;">${specificInsights}</p>
    </div>
    ` : ''}
    
    <div style="text-align: center; margin: 30px 0;">
      <div style="display: inline-block; background-color: ${riskColor}; color: white; padding: 20px 40px; border-radius: 50px;">
        <h2 style="margin: 0; font-size: 24px;">Risk Score: ${score}/30</h2>
        <p style="margin: 5px 0 0 0; font-size: 18px;">${riskLevel}</p>
      </div>
    </div>
    
    ${highRiskAreas.length > 0 ? `
    <div style="background-color: #ffebee; border-left: 4px solid #d32f2f; padding: 20px; margin: 30px 0;">
      <h3 style="color: #d32f2f; margin-top: 0;">⚠️ Areas Requiring Immediate Attention</h3>
      <ul style="margin: 10px 0 0 0; padding-left: 20px;">
        ${highRiskAreas.map(area => `<li style="margin-bottom: 8px; font-weight: 500;">${area}</li>`).join('')}
      </ul>
    </div>
    ` : ''}
    
    ${recommendations.length > 0 ? `
    <div style="background-color: #e8f5e8; border-left: 4px solid #4caf50; padding: 20px; margin: 30px 0;">
      <h3 style="color: #2e7d32; margin-top: 0;">📋 Your Next Steps</h3>
      <ol style="margin: 10px 0 0 0; padding-left: 20px;">
        ${recommendations.slice(0, 3).map(rec => `<li style="margin-bottom: 8px;">${rec}</li>`).join('')}
      </ol>
    </div>
    ` : ''}
    
    <div style="text-align: center; margin: 40px 0;">
      <a href="https://calendly.com/jacobscounsel/general-consultation" 
         style="display: inline-block; background-color: #1976d2; color: white; padding: 15px 30px; 
                text-decoration: none; border-radius: 5px; font-weight: bold; font-size: 16px;">
        📅 Schedule Free Strategy Call
      </a>
    </div>
    
    <div style="border-top: 1px solid #ddd; padding-top: 20px; margin-top: 30px; text-align: center; color: #666;">
      <p style="margin: 0;">Drew Jacobs, Esq. | Jacobs Counsel</p>
      <p style="margin: 5px 0 0 0; font-size: 14px;">Strategic Legal Counsel for High-Performers</p>
    </div>
    
  </div>
</body>
</html>
  `;
}