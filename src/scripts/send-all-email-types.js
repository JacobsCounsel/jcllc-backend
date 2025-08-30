// Send Drew all different email types to demonstrate the strategic intelligence
import Database from 'better-sqlite3';
import automationEngine from '../services/automationEngine.js';

const db = new Database('./legal_email_system.db');

async function sendAllEmailTypes() {
  console.log('📧 Sending Drew all email types to demonstrate strategic intelligence...');
  
  const scenarios = [
    {
      profile: 'creator', 
      email: 'drew+creator@jacobscounsel.com',
      data: {
        firstName: 'Drew',
        lastName: 'Jacobs',
        clientProfile: 'creator',
        leadScore: 75,
        submissionType: 'brand-protection',
        businessType: 'creator',
        socialFollowing: 2000000,
        revenueStreams: 'brand_partnerships',
        hasIntellectualProperty: true
      },
      description: 'Content Creator with 2M followers'
    },
    {
      profile: 'startup',
      email: 'drew+startup@jacobscounsel.com', 
      data: {
        firstName: 'Drew',
        lastName: 'Jacobs',
        clientProfile: 'startup',
        leadScore: 80,
        submissionType: 'business-formation',
        businessStage: 'startup',
        fundingStage: 'series_a_prep',
        businessRevenue: 2500000,
        hasIntellectualProperty: true
      },
      description: 'Series A Ready Startup Founder'
    },
    {
      profile: 'family',
      email: 'drew+family@jacobscounsel.com',
      data: {
        firstName: 'Drew', 
        lastName: 'Jacobs',
        clientProfile: 'high_performing_family',
        leadScore: 90,
        submissionType: 'estate-intake',
        estateValue: 15000000,
        familyOffice: true,
        generationalWealth: true
      },
      description: 'High-Net-Worth Family ($15M+ estate)'
    }
  ];
  
  for (const scenario of scenarios) {
    try {
      console.log(`\n🎯 Testing: ${scenario.description}`);
      
      // Complete any existing automations for this email
      const existingSub = db.prepare('SELECT id FROM subscribers WHERE email = ?').get(scenario.email);
      if (existingSub) {
        db.prepare("UPDATE active_automations SET status = 'completed' WHERE subscriber_id = ? AND status = 'active'").run(existingSub.id);
      }
      
      const automationId = await automationEngine.startAutomation(scenario.email, scenario.data);
      
      if (automationId) {
        console.log(`✅ Started ${scenario.profile} automation for ${scenario.email}`);
      } else {
        console.log(`⚠️ ${scenario.profile} automation already running`);
      }
      
      // Small delay between sends
      await new Promise(resolve => setTimeout(resolve, 1000));
      
    } catch (error) {
      console.error(`❌ Failed ${scenario.profile}:`, error.message);
    }
  }
  
  console.log(`\n🎉 All email types sent!`);
  console.log(`📧 Check your email inboxes:`);
  console.log(`   - drew@jacobscounsel.com (Athlete)`);
  console.log(`   - drew+creator@jacobscounsel.com (Creator)`);
  console.log(`   - drew+startup@jacobscounsel.com (Startup)`);
  console.log(`   - drew+family@jacobscounsel.com (Family)`);
  console.log(`\n📊 Dashboard: http://localhost:3000/automations`);
  
  db.close();
}

sendAllEmailTypes();