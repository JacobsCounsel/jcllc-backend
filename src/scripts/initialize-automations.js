// Initialize automation sequences in database
import Database from 'better-sqlite3';
import automationEngine from '../services/automationEngine.js';

const db = new Database('./legal_email_system.db');

async function initializeAutomations() {
  console.log('🚀 Initializing automation sequences...');
  
  try {
    // Initialize sequences from automationEngine
    await automationEngine.initializeSequences();
    
    // Add some test subscribers with active automations
    const testSubscribers = [
      {
        email: 'marcus@athlete.com',
        first_name: 'Marcus',
        last_name: 'Johnson',
        client_profile: 'athlete',
        lead_score: 75,
        submission_type: 'estate-intake'
      },
      {
        email: 'sarah@creator.com', 
        first_name: 'Sarah',
        last_name: 'Williams',
        client_profile: 'creator',
        lead_score: 65,
        submission_type: 'brand-protection'
      },
      {
        email: 'alex@startup.com',
        first_name: 'Alex',
        last_name: 'Chen',
        client_profile: 'startup',
        lead_score: 80,
        submission_type: 'business-formation'
      },
      {
        email: 'johnson@family.com',
        first_name: 'Robert',
        last_name: 'Johnson',
        client_profile: 'high_performing_family',
        lead_score: 90,
        submission_type: 'estate-intake'
      },
      {
        email: 'taylor@business.com',
        first_name: 'Taylor',
        last_name: 'Smith',
        client_profile: 'strategic_business_owner',
        lead_score: 45,
        submission_type: 'business-formation'
      }
    ];
    
    for (const subscriber of testSubscribers) {
      console.log(`Adding test subscriber: ${subscriber.email}`);
      
      // Check if subscriber exists
      const existing = db.prepare('SELECT id FROM subscribers WHERE email = ?').get(subscriber.email);
      
      if (!existing) {
        // Create subscriber
        const subStmt = db.prepare(`
          INSERT INTO subscribers
          (email, first_name, last_name, client_profile, lead_score, submission_type, status)
          VALUES (?, ?, ?, ?, ?, ?, 'active')
        `);
        
        subStmt.run(
          subscriber.email,
          subscriber.first_name,
          subscriber.last_name,
          subscriber.client_profile,
          subscriber.lead_score,
          subscriber.submission_type
        );
      }
      
      // Start automation
      await automationEngine.startAutomation(subscriber.email, {
        firstName: subscriber.first_name,
        lastName: subscriber.last_name,
        clientProfile: subscriber.client_profile,
        leadScore: subscriber.lead_score,
        submissionType: subscriber.submission_type
      });
    }
    
    // Add some consultation bookings to test exit triggers
    db.prepare(`
      INSERT OR REPLACE INTO consultation_bookings
      (subscriber_email, booking_date, consultation_type, calendly_event_id)
      VALUES 
      ('sarah@creator.com', datetime('now', '-2 days'), 'Creator Strategy Session', 'cal-123'),
      ('johnson@family.com', datetime('now', '-1 day'), 'Family Wealth Planning', 'cal-456')
    `).run();
    
    // Test some exit triggers
    const sarahSub = db.prepare('SELECT id FROM subscribers WHERE email = ?').get('sarah@creator.com');
    const sarahAutomation = db.prepare('SELECT id FROM active_automations WHERE subscriber_id = ?').get(sarahSub?.id);
    if (sarahAutomation) {
      await automationEngine.checkExitTriggers(sarahAutomation.id, 'consultation_booked');
    }
    
    console.log('✅ Automation initialization complete!');
    
    // Show stats
    const stats = await automationEngine.getAutomationStats();
    console.log('\n📊 System Stats:');
    console.log(`- Total Subscribers: ${stats.totalSubscribers}`);
    console.log(`- Active Automations: ${stats.activeAutomations}`);
    console.log(`- Paused Automations: ${stats.pausedAutomations}`);
    console.log(`- Completed Automations: ${stats.completedAutomations}`);
    console.log(`- Emails Sent: ${stats.emailsSent}`);
    console.log(`- Consultations Booked: ${stats.consultationsBooked}`);
    
  } catch (error) {
    console.error('❌ Initialization failed:', error);
  } finally {
    db.close();
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  initializeAutomations();
}