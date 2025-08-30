// Frontend Integration Code for Squarespace
// Add this to your Squarespace Code Injection (Footer)

// Legal Strategy Builder - Ensure Score Pass-Through
function submitLegalStrategyForm(assessmentScore) {
  const formData = {
    // ... other form fields ...
    assessmentScore: assessmentScore, // This ensures the score from frontend passes to backend
    source: 'legal-strategy-builder-conversion',
    fromAssessment: 'true'
  };
  
  // Send to your backend
  fetch('/api/legal-strategy-builder', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(formData)
  })
  .then(response => response.json())
  .then(data => {
    // Handle success
    console.log('Assessment submitted with score:', assessmentScore);
    // Redirect to thank you page or show success message
  })
  .catch(error => {
    console.error('Error:', error);
  });
}

// Example: For a legal strategy builder form
// When user completes assessment and gets score of 40:
// submitLegalStrategyForm(40); // This will pass score=40 to backend

// For other forms, ensure you're sending the correct data structure:
function submitForm(endpoint, formData) {
  // Add any frontend-calculated scores
  if (window.assessmentScore) {
    formData.assessmentScore = window.assessmentScore;
  }
  
  fetch(`/api/${endpoint}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(formData)
  })
  .then(response => response.json())
  .then(data => {
    // Handle success
    window.location.href = '/thank-you';
  })
  .catch(error => {
    console.error('Error:', error);
  });
}

// Usage examples for your different forms:
/*
// Estate Planning Form
submitForm('estate-intake', {
  firstName: 'John',
  lastName: 'Doe',
  email: 'john@example.com',
  grossEstate: '$2,500,000',
  packagePreference: 'Trust Package',
  urgency: 'Within 3 months'
});

// Business Formation Form  
submitForm('business-formation', {
  firstName: 'Jane',
  businessName: 'TechCorp Inc',
  email: 'jane@techcorp.com',
  investmentPlan: 'vc',
  projectedRevenue: '5m-25m'
});

// Brand Protection Form
submitForm('brand-protection', {
  firstName: 'Mike',
  businessName: 'BrandCorp',
  email: 'mike@brandcorp.com',
  servicePreference: 'Portfolio Protection - $7500',
  protectionGoal: 'enforcement'
});
*/