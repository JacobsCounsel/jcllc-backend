// Clean Endpoint Template for 3-Part Email Flow
// Use this template for all form submission endpoints

const cleanEndpointTemplate = (endpointName, submissionType) => `
app.post('/${endpointName}', upload.array('documents'), async (req, res) => {
  try {
    // 1. SANITIZE AND PREPARE DATA
    const formData = sanitizeInput(req.body || {});
    const submissionId = formData.submissionId || \`\${submissionType}-\${Date.now()}\`;
    
    console.log(\`📥 New \${submissionType} submission:\`, formData.email);

    // 2. CALCULATE LEAD SCORE
    const leadScore = calculateLeadScore(formData, submissionType);
    console.log(\`📊 Lead score: \${leadScore.score}/100 (\${leadScore.priority})\`);

    // 3. STORE IN DATABASE
    const leadId = leadDb.insertLead({
      ...formData,
      submission_type: submissionType,
      lead_score: leadScore.score,
      priority: leadScore.priority,
      submission_id: submissionId
    }).lastInsertRowid;

    // 4. THREE-PART EMAIL FLOW
    
    // PART 1: CLIENT CONFIRMATION EMAIL
    const clientEmail = generateClientEmail(formData, submissionType);
    await sendEnhancedEmail({
      to: [formData.email],
      subject: \`\${getClientSubject(submissionType)} - Next Steps\`,
      html: clientEmail
    }).catch(e => console.error('❌ Client email failed:', e.message));

    // PART 2: INTERNAL ALERT EMAIL
    const internalEmail = generateInternalEmail(formData, leadScore, submissionType);
    const alertRecipients = leadScore.score >= 80 
      ? ['drew@jacobscounsel.com', 'intake@jacobscounsel.com']
      : ['drew@jacobscounsel.com'];
    
    await sendEnhancedEmail({
      to: alertRecipients,
      subject: \`\${leadScore.score >= 80 ? '🔥 HIGH VALUE' : '📋'} \${getServiceName(submissionType)} — \${formData.email} (Score: \${leadScore.score})\`,
      html: internalEmail,
      priority: leadScore.score >= 80 ? 'high' : 'normal'
    }).catch(e => console.error('❌ Internal email failed:', e.message));

    // PART 3: CLIO GROW INTEGRATION
    await createClioLead(formData, leadScore, submissionType)
      .then(result => {
        if (result.success) {
          leadDb.logInteraction(leadId, 'clio_lead_created', { clioId: result.clioId });
          console.log('✅ Clio lead created:', result.clioId);
        }
      })
      .catch(e => console.error('❌ Clio integration failed:', e.message));

    // 5. KIT INTELLIGENT TAGGING
    await addToKitWithIntelligentTagging(formData, leadScore, submissionType)
      .then(result => {
        if (result.success) {
          console.log(\`✅ Kit tagging applied: \${result.tags?.length || 0} tags\`);
        }
      })
      .catch(e => console.error('❌ Kit tagging failed:', e.message));

    // 6. LOG INTERACTION
    leadDb.logInteraction(leadId, 'form_submitted', { 
      type: submissionType,
      score: leadScore.score,
      priority: leadScore.priority
    });

    // 7. SUCCESS RESPONSE
    res.json({ 
      success: true, 
      message: \`\${getServiceName(submissionType)} submission received successfully. Check your email for next steps.\`,
      submissionId
    });

  } catch (error) {
    console.error(\`❌ \${submissionType} error:\`, error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error. Please try again.',
      submissionId: req.body?.submissionId || \`error-\${Date.now()}\`
    });
  }
});`;

// Helper functions for clean endpoints
const getClientSubject = (submissionType) => {
  const subjects = {
    'estate-intake': 'Estate Planning Intake Received',
    'business-formation': 'Business Formation Intake Received', 
    'brand-protection': 'Brand Protection Intake Received',
    'legal-risk-assessment': 'Legal Risk Assessment Complete',
    'newsletter-signup': 'Welcome to Strategic Legal Insights',
    'resource-guide': 'Your Legal Resource Guide',
    'business-guide': 'Your Business Formation Guide',
    'brand-guide': 'Your Brand Protection Guide',
    'estate-guide': 'Your Estate Planning Guide'
  };
  return subjects[submissionType] || 'Submission Received';
};

const getServiceName = (submissionType) => {
  const names = {
    'estate-intake': 'Estate Planning',
    'business-formation': 'Business Formation',
    'brand-protection': 'Brand Protection', 
    'legal-risk-assessment': 'Legal Risk Assessment',
    'newsletter-signup': 'Newsletter Signup',
    'resource-guide': 'Resource Guide',
    'business-guide': 'Business Guide',
    'brand-guide': 'Brand Guide',
    'estate-guide': 'Estate Guide'
  };
  return names[submissionType] || 'Legal Intake';
};

export { cleanEndpointTemplate, getClientSubject, getServiceName };