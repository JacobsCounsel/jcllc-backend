// Simple, Clean Email Templates - Built from Scratch
// No white on white, readable, actionable

export function generateInternalEmail(formData, riskScore, submissionType) {
  const name = formData.name || 'Unknown';
  const email = formData.email || 'No email';
  const score = formData.overallRiskScore || 'Not calculated';
  
  let riskLevel = 'Low Risk';
  if (score > 20) riskLevel = 'HIGH RISK';
  else if (score > 10) riskLevel = 'Medium Risk';
  
  let highRiskAreas = [];
  let recommendations = [];
  
  try {
    highRiskAreas = formData.highRiskAreas ? JSON.parse(formData.highRiskAreas) : [];
  } catch (e) {
    console.log('Error parsing highRiskAreas:', e);
    highRiskAreas = [];
  }
  
  try {
    recommendations = formData.recommendations ? JSON.parse(formData.recommendations) : [];
  } catch (e) {
    console.log('Error parsing recommendations:', e);
    recommendations = [];
  }
  
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
      <p><strong>Submission Type:</strong> ${submissionType}</p>
    </div>
    
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
  const score = formData.overallRiskScore || 'Not calculated';
  
  let riskLevel = 'Low Risk';
  let riskColor = '#4caf50';
  if (score > 20) {
    riskLevel = 'High Risk';
    riskColor = '#d32f2f';
  } else if (score > 10) {
    riskLevel = 'Medium Risk';
    riskColor = '#ff9800';
  }
  
  let highRiskAreas = [];
  let recommendations = [];
  
  try {
    highRiskAreas = formData.highRiskAreas ? JSON.parse(formData.highRiskAreas) : [];
  } catch (e) {
    console.log('Error parsing highRiskAreas:', e);
    highRiskAreas = [];
  }
  
  try {
    recommendations = formData.recommendations ? JSON.parse(formData.recommendations) : [];
  } catch (e) {
    console.log('Error parsing recommendations:', e);
    recommendations = [];
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
      <p>Thank you for completing your legal risk assessment. Here are your personalized results:</p>
    </div>
    
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