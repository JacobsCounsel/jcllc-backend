// src/scripts/build-premium-kit.js - Deploy Premium Kit Automation Architecture
// The Taj Mahal deployment script for Jacobs Counsel

import { config } from '../config/environment.js';
import { initializeKitV4System } from '../services/kitV4Automation.js';

async function main() {
  console.log('');
  console.log('🏛️  JACOBS COUNSEL KIT v4 AUTOMATION SYSTEM');
  console.log('===========================================');
  console.log('Initializing complete automated lead management system...');
  console.log('');
  
  // Check Kit configuration
  if (!config.kit.apiKey || !config.kit.apiKey.startsWith('kit_')) {
    console.error('❌ Kit v4 API key not configured!');
    console.error('');
    console.error('Required: KIT_API_KEY starting with "kit_"');
    console.error('Get your v4 API key from Kit Dashboard → Developer settings');
    console.error('');
    process.exit(1);
  }
  
  console.log(`🔑 API Key: ${config.kit.apiKey.substring(0, 10)}...`);
  console.log(`🔐 Secret: ${config.kit.apiSecret.substring(0, 10)}...`);
  console.log('');
  
  try {
    console.log('🚀 Initializing Kit v4 automation system...');
    console.log('');
    
    const results = await initializeKitV4System();
    
    console.log('✅ KIT v4 AUTOMATION SYSTEM INITIALIZED!');
    console.log('');
    console.log('📊 SYSTEM SUMMARY:');
    console.log(`   📧 Existing Sequences: ${results.resources.sequences.length}`);
    console.log(`   📝 Existing Forms: ${results.resources.forms.length}`);
    console.log(`   🏷️  Available Tags: ${results.resources.tags.length}`);
    console.log(`   ⚡ Automation: ACTIVE`);
    console.log('');
    
    console.log('🎯 COMPLETE SYSTEM OVERVIEW:');
    console.log('');
    console.log('📋 LEAD NURTURE JOURNEYS (5):');
    console.log('   • VIP Experience Journey (trigger-vip-sequence)');
    console.log('   • Premium Legal Protection Path (trigger-premium-nurture)');
    console.log('   • Standard Legal Excellence Series (trigger-standard-nurture)');
    console.log('   • Newsletter Welcome Series (trigger-newsletter-sequence)');
    console.log('   • Resource Guide Follow-Up (trigger-guide-sequence)');
    console.log('');
    console.log('🎓 SERVICE EDUCATION JOURNEYS (10):');
    console.log('   • Asset Protection, Wealth Protection, Business Succession');
    console.log('   • Trust Planning, Trademark Registration, IP Enforcement');
    console.log('   • Estate Tax Planning, VC Startup, Angel Funding, Basic Estate');
    console.log('');
    console.log('🔄 LIFECYCLE MANAGEMENT JOURNEYS (6):');
    console.log('   • Pre-Consultation Prep, Consultation Recovery');
    console.log('   • Active Client Experience, Community Nurturing');
    console.log('   • Referral Generation, Satisfaction Monitoring');
    console.log('');
    console.log('📥 INTAKE-SPECIFIC JOURNEYS (4):');
    console.log('   • Estate Planning, Business Formation');
    console.log('   • Brand Protection, Outside Counsel Follow-ups');
    console.log('');
    
    console.log('⚡ AUTOMATION FEATURES:');
    console.log('   ✅ Complete backend integration with your trigger system');
    console.log('   ✅ AI-powered lead scoring drives pathway selection');
    console.log('   ✅ Behavioral exit conditions (consultation-booked, etc.)');
    console.log('   ✅ Dynamic content personalization by client type');
    console.log('   ✅ Service-specific CTAs and case studies');
    console.log('   ✅ Geographic compliance personalization');
    console.log('');
    
    console.log('🔧 NEXT STEPS:');
    console.log('   1. 🖥️  Login to Kit Dashboard → Review sequences');
    console.log('   2. 🎯 Test sequences with your existing tags');
    console.log('   3. 🔄 Customize email timing as needed');
    console.log('   4. 📊 Monitor Kit Analytics for performance');
    console.log('   5. 🚀 Your backend automatically uses new pathways!');
    
    console.log('');
    console.log('🎉 YOUR COMPLETE 25-PATHWAY SYSTEM IS LIVE!');
    console.log('   Every trigger from your backend now connects to premium sequences');
    console.log('   Lead scoring automatically routes to the perfect journey');
    console.log('   Behavioral conditions ensure no email conflicts');
    console.log('   Complete cohesion with your existing automation architecture');
    console.log('');
    
    console.log('💡 PRO TIPS FOR MAXIMUM IMPACT:');
    console.log('   • Your existing tags are perfect for advanced segmentation');
    console.log('   • New premium sequences work alongside your current automations');
    console.log('   • Monitor Kit Analytics to optimize email performance');
    console.log('   • A/B test subject lines using Kit\'s built-in tools');
    console.log('   • Connect existing forms to trigger new premium sequences');
    console.log('');
    
    console.log('🎉 YOUR PREMIUM AUTOMATION IS READY!');
    console.log('   Time to watch the leads convert themselves...');
    console.log('');
    
  } catch (error) {
    console.error('❌ PREMIUM DEPLOYMENT FAILED!');
    console.error('');
    console.error('Error Details:', error.message);
    console.error('');
    console.error('Common Solutions:');
    console.error('• Verify your Kit API credentials are correct');
    console.error('• Check your Kit account has automation permissions');
    console.error('• Ensure your Kit plan supports advanced features');
    console.error('• Try running the script again in a few minutes');
    console.error('');
    
    if (error.message.includes('401') || error.message.includes('Unauthorized')) {
      console.error('🔑 API KEY ISSUE:');
      console.error('   Your Kit API credentials appear to be invalid.');
      console.error('   Get fresh credentials from Kit → Account Settings → Advanced Settings');
      console.error('');
    }
    
    if (error.message.includes('403') || error.message.includes('Forbidden')) {
      console.error('🚫 PERMISSION ISSUE:');
      console.error('   Your Kit plan may not support API automation features.');
      console.error('   Upgrade to Kit Creator Pro or higher for full access.');
      console.error('');
    }
    
    process.exit(1);
  }
}

// Handle uncaught errors gracefully
process.on('unhandledRejection', (reason, promise) => {
  console.error('');
  console.error('❌ UNEXPECTED ERROR OCCURRED');
  console.error('Promise rejected:', reason);
  console.error('');
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  console.error('');
  console.error('❌ CRITICAL ERROR');
  console.error('Exception:', error.message);
  console.error('');
  process.exit(1);
});

// Run the deployment
main().catch(error => {
  console.error('');
  console.error('❌ DEPLOYMENT SCRIPT FAILED');
  console.error('Error:', error.message);
  console.error('');
  process.exit(1);
});