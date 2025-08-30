#!/usr/bin/env node
// src/scripts/show-analytics.js - Command line analytics viewer
import { leadDb } from "../models/database-production.js"';

console.log('\n📊 JACOBS COUNSEL LEAD ANALYTICS\n');
console.log('='.repeat(50));

try {
  const stats = leadDb.getDashboardStats();
  
  // Overview
  console.log('\n📈 OVERVIEW');
  console.log('-'.repeat(30));
  console.log(`Total Leads: ${stats.overview.total_leads}`);
  console.log(`High Value (70+): ${stats.overview.high_value_leads}`);
  console.log(`Average Score: ${stats.overview.avg_lead_score}/100`);
  console.log(`Last 7 days: ${stats.overview.leads_last_7_days}`);
  console.log(`Last 30 days: ${stats.overview.leads_last_30_days}`);
  
  // Top Sources
  console.log('\n🎯 TOP LEAD SOURCES (30 days)');
  console.log('-'.repeat(30));
  stats.topSources.forEach((source, i) => {
    console.log(`${i + 1}. ${source.submission_type}: ${source.count} leads`);
  });
  
  // Recent High Value
  console.log('\n🔥 RECENT HIGH-VALUE LEADS');
  console.log('-'.repeat(30));
  if (stats.recentHighValue.length === 0) {
    console.log('No high-value leads yet.');
  } else {
    stats.recentHighValue.slice(0, 5).forEach(lead => {
      const name = lead.first_name || lead.email.split('@')[0];
      const business = lead.business_name ? ` (${lead.business_name})` : '';
      const date = new Date(lead.created_at).toLocaleDateString();
      console.log(`• ${name}${business} - Score: ${lead.lead_score} - ${lead.submission_type} - ${date}`);
    });
  }
  
  // Follow-up needed
  const followups = leadDb.getLeadsNeedingFollowup();
  console.log(`\n⚡ FOLLOW-UP NEEDED: ${followups.length} leads`);
  console.log('-'.repeat(30));
  if (followups.length === 0) {
    console.log('All caught up! 🎉');
  } else {
    followups.slice(0, 5).forEach(lead => {
      const name = lead.first_name || lead.email.split('@')[0];
      const hoursSince = Math.floor((Date.now() - new Date(lead.created_at).getTime()) / (1000 * 60 * 60));
      console.log(`• ${name} (${lead.email}) - Score: ${lead.lead_score} - ${hoursSince}h ago`);
    });
    if (followups.length > 5) {
      console.log(`  ... and ${followups.length - 5} more`);
    }
  }
  
  // Conversion funnel
  const funnel = leadDb.getConversionFunnel();
  console.log('\n🎪 CONVERSION FUNNEL (90 days)');
  console.log('-'.repeat(30));
  funnel.forEach(item => {
    console.log(`${item.submission_type}: ${item.total_leads} leads → ${item.booked_consultations} bookings (${item.booking_rate}%)`);
  });
  
  // Daily trend (last 7 days)
  console.log('\n📈 DAILY TRENDS (Last 7 days)');
  console.log('-'.repeat(30));
  stats.dailyTrends.slice(-7).forEach(day => {
    console.log(`${day.date}: ${day.leads} leads (${day.high_value} high-value, avg: ${day.avg_score})`);
  });
  
  console.log('\n' + '='.repeat(50));
  console.log('💡 View full analytics at: http://localhost:3000/api/analytics/dashboard');
  console.log('💡 Follow-up help at: http://localhost:3000/api/analytics/followup-recommendations');

} catch (error) {
  console.error('❌ Error loading analytics:', error.message);
  console.log('\n💡 Make sure you have leads in the database first.');
}

console.log('');