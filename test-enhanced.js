#!/usr/bin/env node
// test-enhanced.js - Quick demo script to test the enhanced backend

import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:3000';

console.log('🚀 Testing Enhanced Jacobs Counsel Backend\n');

// Test data for different lead types
const testLeads = [
  {
    endpoint: '/estate-intake',
    name: 'High-Value Estate Client',
    data: {
      email: 'wealthy.client@investment-firm.com',
      firstName: 'Robert',
      lastName: 'Wellington',
      grossEstate: '12500000',
      packagePreference: 'comprehensive-trust-planning',
      ownBusiness: 'Yes',
      maritalStatus: 'married',
      urgency: 'Immediate - year-end planning',
      phone: '555-WEALTH'
    }
  },
  {
    endpoint: '/business-formation-intake', 
    name: 'VC-Backed Startup',
    data: {
      email: 'founder@unicorn-startup.com',
      founderName: 'Sarah Chen',
      businessName: 'AI Unicorn Inc',
      investmentPlan: 'vc',
      projectedRevenue: 'over25m',
      selectedPackage: 'gold',
      timeline: 'Immediately',
      businessType: 'Technology'
    }
  },
  {
    endpoint: '/brand-protection-intake',
    name: 'Established Business',
    data: {
      email: 'legal@established-corp.com',
      fullName: 'Jennifer Martinez',
      businessName: 'Martinez Industries',
      businessStage: 'Mature (5+ years)',
      servicePreference: 'Comprehensive Portfolio Management ($7,500+)',
      protectionGoal: 'enforcement',
      phone: '555-BRAND'
    }
  },
  {
    endpoint: '/legal-strategy-builder',
    name: 'Strategy Assessment',
    data: {
      email: 'entrepreneur@growth-company.com',
      firstName: 'David',
      q1: 'founder',
      q2: 'growth',
      q3: 'llc',
      q4: 'basic',
      q5: 'templates',
      q6: '1m-5m',
      q7: ['liability', 'contracts'],
      q8: 'fundraise',
      assessmentScore: 78
    }
  },
  {
    endpoint: '/newsletter-signup',
    name: 'Newsletter Subscriber',
    data: {
      email: 'subscriber@gmail.com',
      firstName: 'Alex',
      source: 'website'
    }
  }
];

async function testLead(lead) {
  try {
    console.log(`📝 Submitting: ${lead.name}...`);
    
    const response = await fetch(`${BASE_URL}${lead.endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(lead.data)
    });
    
    const result = await response.json();
    
    if (result.ok || result.success) {
      console.log(`   ✅ Success! Lead Score: ${result.leadScore || 'N/A'}`);
      if (result.leadScore >= 70) {
        console.log(`   🔥 HIGH VALUE LEAD detected!`);
      }
    } else {
      console.log(`   ❌ Failed: ${result.error}`);
    }
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
  }
}

async function showAnalytics() {
  try {
    console.log('\n📊 Fetching Analytics Dashboard...');
    
    const response = await fetch(`${BASE_URL}/api/analytics/dashboard`);
    const analytics = await response.json();
    
    if (analytics.ok) {
      const data = analytics.data;
      console.log('\n📈 ANALYTICS SUMMARY:');
      console.log(`   Total Leads: ${data.overview.total_leads}`);
      console.log(`   High Value: ${data.overview.high_value_leads}`);
      console.log(`   Average Score: ${data.overview.avg_lead_score}`);
      
      console.log('\n🎯 TOP SOURCES:');
      data.topSources.slice(0, 3).forEach((source, i) => {
        console.log(`   ${i + 1}. ${source.submission_type}: ${source.count} leads`);
      });
      
      if (data.followupNeeded && data.followupNeeded.length > 0) {
        console.log('\n⚡ NEEDS FOLLOW-UP:');
        data.followupNeeded.slice(0, 3).forEach(lead => {
          const name = lead.first_name || lead.email.split('@')[0];
          console.log(`   • ${name} (${lead.email}) - Score: ${lead.lead_score}`);
        });
      }
    }
  } catch (error) {
    console.log(`❌ Analytics error: ${error.message}`);
  }
}

async function showFollowupRecommendations() {
  try {
    console.log('\n🎯 Fetching Follow-up Recommendations...');
    
    const response = await fetch(`${BASE_URL}/api/analytics/followup-recommendations`);
    const result = await response.json();
    
    if (result.ok && result.data.highPriorityFollowups.length > 0) {
      console.log('\n⚡ PRIORITY FOLLOW-UPS:');
      result.data.recommendations.slice(0, 3).forEach(rec => {
        console.log(`   📞 ${rec.lead.first_name || rec.lead.email}: ${rec.action}`);
        console.log(`      ${rec.reason}`);
      });
    } else {
      console.log('   ✅ All caught up - no urgent follow-ups needed!');
    }
  } catch (error) {
    console.log(`❌ Follow-up error: ${error.message}`);
  }
}

async function checkHealth() {
  try {
    console.log('🏥 Checking System Health...');
    
    const response = await fetch(`${BASE_URL}/health`);
    const health = await response.json();
    
    console.log('   Services Status:');
    Object.entries(health.services).forEach(([service, status]) => {
      const icon = status.includes('✅') ? '✅' : status.includes('active') ? '✅' : '⚠️';
      console.log(`     ${icon} ${service}: ${status}`);
    });
    
    if (health.database) {
      console.log('   Database Stats:');
      console.log(`     📊 Total Leads: ${health.database.totalLeads}`);
      console.log(`     🔥 High Value: ${health.database.highValueLeads}`);
      console.log(`     ⏰ Last 24h: ${health.database.last24Hours}`);
    }
  } catch (error) {
    console.log(`❌ Health check failed: ${error.message}`);
    console.log('   💡 Make sure the enhanced backend is running: node index-improved.js');
  }
}

// Run the demo
async function runDemo() {
  await checkHealth();
  console.log('\n' + '='.repeat(60));
  
  // Submit test leads
  for (const lead of testLeads) {
    await testLead(lead);
    await new Promise(resolve => setTimeout(resolve, 500)); // Brief pause
  }
  
  console.log('\n' + '='.repeat(60));
  await showAnalytics();
  
  console.log('\n' + '='.repeat(60));
  await showFollowupRecommendations();
  
  console.log('\n' + '='.repeat(60));
  console.log('🎉 Demo Complete!');
  console.log('\n💡 Next steps:');
  console.log('   • View full dashboard: http://localhost:3000/api/analytics/dashboard');
  console.log('   • Check database: sqlite3 data/leads.db "SELECT * FROM leads;"');
  console.log('   • Run analytics: npm run analytics');
}

runDemo().catch(console.error);