#!/usr/bin/env node
// src/scripts/build-mailchimp-journeys.js - Execute complete journey build
import { buildCompleteJourneyArchitecture, testJourneySetup } from '../services/mailchimpJourneyBuilder.js';
import { config } from '../config/environment.js';
import { log } from '../utils/logger.js';

async function main() {
  console.log('🚀 JACOBS COUNSEL MAILCHIMP JOURNEY BUILDER');
  console.log('==========================================\n');
  
  // Preflight check
  if (!config.mailchimp.apiKey || !config.mailchimp.audienceId) {
    console.error('❌ Mailchimp not configured!');
    console.error('Required environment variables:');
    console.error('- MAILCHIMP_API_KEY');
    console.error('- MAILCHIMP_AUDIENCE_ID');
    console.error('- MAILCHIMP_SERVER (e.g., us21)');
    process.exit(1);
  }
  
  console.log('✅ Configuration check passed');
  console.log(`📧 Using audience: ${config.mailchimp.audienceId}`);
  console.log(`🌐 Server: ${config.mailchimp.server}\n`);
  
  try {
    // Test connection first
    console.log('🔍 Testing Mailchimp connection...');
    const testResult = await testJourneySetup();
    
    if (!testResult.success) {
      console.error('❌ Connection test failed:', testResult.error);
      process.exit(1);
    }
    
    console.log('✅ Connection successful\n');
    
    // Build complete architecture
    console.log('🏗️ Building complete journey architecture...');
    const results = await buildCompleteJourneyArchitecture();
    
    // Report results
    console.log('\n📊 BUILD RESULTS:');
    console.log('==================');
    console.log(`✅ Journeys created: ${results.journeys.length}`);
    console.log(`✅ Segments created: ${results.segments.length}`);
    console.log(`✅ Tags created: ${results.tags.length}`);
    console.log(`✅ Merge fields: ${results.mergeFields.length}`);
    
    if (results.errors.length > 0) {
      console.log(`\n⚠️ Warnings/Errors: ${results.errors.length}`);
      results.errors.forEach(error => console.log(`   • ${error}`));
    }
    
    console.log('\n🎉 JOURNEY ARCHITECTURE BUILD COMPLETE!');
    console.log('\nNext steps:');
    console.log('1. Log into Mailchimp to review the created automations');
    console.log('2. Test the journeys with sample contacts');
    console.log('3. Customize email templates as needed');
    console.log('4. Your backend is already sending the right tags!');
    
  } catch (error) {
    console.error('\n❌ BUILD FAILED:', error.message);
    if (error.detail) {
      console.error('Details:', error.detail);
    }
    process.exit(1);
  }
}

// Run the script
main().catch(error => {
  console.error('Script failed:', error);
  process.exit(1);
});