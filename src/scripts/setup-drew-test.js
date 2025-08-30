// Setup live email test for Drew's account
import Database from 'better-sqlite3';
import automationEngine from '../services/automationEngine.js';

const db = new Database('./legal_email_system.db');

async function setupDrewTest() {
  console.log('🎯 Setting up live email test for Drew...');
  
  try {
    // Clear any existing automations for Drew, but keep the subscriber
    const drewSub = db.prepare('SELECT id FROM subscribers WHERE email = ?').get('drew@jacobscounsel.com');
    if (drewSub) {
      db.prepare("UPDATE active_automations SET status = 'completed' WHERE subscriber_id = ?").run(drewSub.id);
      console.log('🧹 Completed existing Drew automations');
    }
    
    // Test scenarios to demonstrate different email paths
    const testScenarios = [
      // VIP Athlete Test
      {
        profile: 'athlete',
        formData: {
          firstName: 'Drew',
          lastName: 'Jacobs',
          email: 'drew@jacobscounsel.com',
          clientProfile: 'athlete',
          leadScore: 75,
          submissionType: 'estate-intake',
          profession: 'athlete',
          industry: 'sports',
          estateValue: 8000000,
          careerType: 'professional_athlete'
        },
        description: 'VIP Athlete Journey - High Net Worth Sports Professional'
      }
    ];
    
    // Start with the athlete scenario
    const scenario = testScenarios[0];
    console.log(`🚀 Starting: ${scenario.description}`);
    
    // Create/update subscriber
    db.prepare(`
      INSERT OR REPLACE INTO subscribers
      (email, first_name, last_name, client_profile, lead_score, submission_type, status)
      VALUES (?, ?, ?, ?, ?, ?, 'active')
    `).run(
      scenario.formData.email,
      scenario.formData.firstName,
      scenario.formData.lastName,
      scenario.formData.clientProfile,
      scenario.formData.leadScore,
      scenario.formData.submissionType
    );
    
    // Start automation
    const automationId = await automationEngine.startAutomation(
      scenario.formData.email, 
      scenario.formData
    );
    
    console.log(`✅ Started automation ${automationId} for ${scenario.formData.email}`);
    console.log(`📧 First email should be sent immediately`);
    console.log(`📅 Next emails will be sent based on the sequence timing`);
    
    // Show the sequence that will be sent
    const activeAutomation = db.prepare(`
      SELECT aa.*, s.name as sequence_name
      FROM active_automations aa
      JOIN automation_sequences s ON aa.sequence_id = s.id
      WHERE aa.id = ?
    `).get(automationId);
    
    if (activeAutomation) {
      console.log(`\n📋 Sequence: ${activeAutomation.sequence_name}`);
      
      const emails = db.prepare(`
        SELECT se.*, aa.started_at
        FROM sequence_emails se
        JOIN active_automations aa ON se.sequence_id = aa.sequence_id
        WHERE aa.id = ?
        ORDER BY se.email_order
      `).all(automationId);
      
      emails.forEach((email, index) => {
        const sendTime = new Date(Date.now() + (email.delay_hours * 60 * 60 * 1000));
        console.log(`  ${index + 1}. ${email.subject_line} (${email.delay_hours}h delay - ${sendTime.toLocaleString()})`);
      });
    }
    
    console.log(`\n🎯 Check your email at drew@jacobscounsel.com for the first email!`);
    console.log(`📊 View dashboard: http://localhost:3000/automations`);
    console.log(`📧 View Drew's emails: http://localhost:3000/automations/emails/drew@jacobscounsel.com`);
    
  } catch (error) {
    console.error('❌ Setup failed:', error);
  } finally {
    db.close();
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  setupDrewTest();
}