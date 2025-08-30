// Send all email types to Drew's actual Gmail address
import Database from 'better-sqlite3';
import automationEngine from '../services/automationEngine.js';

const db = new Database('./legal_email_system.db');

async function sendToGmail() {
  console.log('📧 Sending all strategic email types to jacobsd32@gmail.com...');
  
  const scenarios = [
    {
      profile: 'athlete',
      email: 'jacobsd32@gmail.com',
      data: {
        firstName: 'Drew',
        lastName: 'Jacobs',
        clientProfile: 'athlete',
        leadScore: 85,
        submissionType: 'estate-intake',
        profession: 'athlete',
        industry: 'sports',
        estateValue: 10000000,
        careerType: 'professional_athlete',
        brandPartnerships: true
      },
      description: 'Professional Athlete ($10M+ net worth)'
    },
    {
      profile: 'creator',
      email: 'jacobsd32+creator@gmail.com',
      data: {
        firstName: 'Drew',
        lastName: 'Jacobs',
        clientProfile: 'creator',
        leadScore: 75,
        submissionType: 'brand-protection',
        businessType: 'creator',
        socialFollowing: 2500000,
        revenueStreams: 'brand_partnerships',
        hasIntellectualProperty: true,
        businessRevenue: 3000000
      },
      description: 'Content Creator (2.5M followers, $3M revenue)'
    },
    {
      profile: 'startup',
      email: 'jacobsd32+startup@gmail.com',
      data: {
        firstName: 'Drew',
        lastName: 'Jacobs',
        clientProfile: 'startup',
        leadScore: 80,
        submissionType: 'business-formation',
        businessStage: 'startup',
        fundingStage: 'series_a_prep',
        businessRevenue: 2800000,
        hasIntellectualProperty: true,
        growthPlans: 'venture_capital'
      },
      description: 'Series A Startup Founder ($2.8M revenue)'
    },
    {
      profile: 'family',
      email: 'jacobsd32+family@gmail.com',
      data: {
        firstName: 'Drew',
        lastName: 'Jacobs',
        clientProfile: 'high_performing_family',
        leadScore: 95,
        submissionType: 'estate-intake',
        estateValue: 25000000,
        familyOffice: true,
        generationalWealth: true,
        multipleProperties: true
      },
      description: 'High-Net-Worth Family ($25M+ estate)'
    }
  ];
  
  console.log('🧹 Completing any existing automations first...');
  
  // Complete existing automations for these emails
  for (const scenario of scenarios) {
    const existingSub = db.prepare('SELECT id FROM subscribers WHERE email = ?').get(scenario.email);
    if (existingSub) {
      db.prepare("UPDATE active_automations SET status = 'completed' WHERE subscriber_id = ? AND status IN ('active', 'paused')").run(existingSub.id);
    }
  }
  
  console.log('📧 Starting fresh email automations...\n');
  
  for (const scenario of scenarios) {
    try {
      console.log(`🎯 ${scenario.description}`);
      console.log(`📧 Email: ${scenario.email}`);
      
      const automationId = await automationEngine.startAutomation(scenario.email, scenario.data);
      
      if (automationId) {
        console.log(`✅ Started automation ${automationId}`);
        console.log(`📬 Strategic ${scenario.profile} email sent!\n`);
      } else {
        console.log(`⚠️ Automation not started\n`);
      }
      
      // Small delay between sends
      await new Promise(resolve => setTimeout(resolve, 1500));
      
    } catch (error) {
      console.error(`❌ Failed ${scenario.profile}:`, error.message);
    }
  }
  
  console.log('🎉 ALL STRATEGIC EMAILS SENT TO YOUR GMAIL!');
  console.log('📧 Check these inboxes:');
  console.log('   • jacobsd32@gmail.com (Professional Athlete)');
  console.log('   • jacobsd32+creator@gmail.com (Content Creator)');
  console.log('   • jacobsd32+startup@gmail.com (Startup Founder)');  
  console.log('   • jacobsd32+family@gmail.com (High-Net-Worth Family)');
  console.log('');
  console.log('🎯 Each email is strategically different based on client profile!');
  console.log('📊 Live Dashboard: http://localhost:3000/automations');
  
  // Show what was sent
  const recentEmails = db.prepare(`
    SELECT s.email, eh.subject_line, eh.sent_at
    FROM email_history eh
    JOIN subscribers s ON eh.subscriber_id = s.id
    WHERE s.email LIKE '%jacobsd32%'
    AND eh.sent_at > datetime('now', '-10 minutes')
    ORDER BY eh.sent_at DESC
  `).all();
  
  if (recentEmails.length > 0) {
    console.log('\n📋 Emails just sent:');
    recentEmails.forEach(email => {
      console.log(`   • ${email.subject_line} → ${email.email}`);
    });
  }
  
  db.close();
}

sendToGmail();