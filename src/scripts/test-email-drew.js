// Simple test to send live email to Drew
import automationEngine from '../services/automationEngine.js';

async function testEmailToDrew() {
  console.log('📧 Testing live email to Drew...');
  
  try {
    // Start automation using the existing method
    const automationId = await automationEngine.startAutomation('drew@jacobscounsel.com', {
      firstName: 'Drew',
      lastName: 'Jacobs',
      email: 'drew@jacobscounsel.com',
      clientProfile: 'athlete',
      leadScore: 85,
      submissionType: 'estate-intake',
      profession: 'athlete',
      industry: 'sports',
      estateValue: 10000000,
      careerType: 'professional_athlete'
    });
    
    if (automationId) {
      console.log(`✅ Started automation ${automationId} for drew@jacobscounsel.com`);
      console.log(`📧 Check your email - you should receive the first email immediately!`);
      console.log(`📊 Dashboard: http://localhost:3000/automations`);
      console.log(`📧 Your emails: http://localhost:3000/automations/emails/drew@jacobscounsel.com`);
    } else {
      console.log('⚠️ Automation not started - check if already running');
    }
    
  } catch (error) {
    console.error('❌ Failed:', error.message);
  }
}

testEmailToDrew();