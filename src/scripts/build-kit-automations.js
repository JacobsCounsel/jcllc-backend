#!/usr/bin/env node
// src/scripts/build-kit-automations.js - Build complete Kit automation architecture
import { buildKitAutomations, testKitConnection } from '../services/kitAutomationBuilder.js';
import { config } from '../config/environment.js';
import { log } from '../utils/logger.js';

async function main() {
  console.log('🚀 JACOBS COUNSEL KIT AUTOMATION BUILDER');
  console.log('=========================================\n');
  
  // Preflight check
  if (!config.kit.apiKey || !config.kit.apiSecret) {
    console.error('❌ Kit not configured!');
    console.error('Required: KIT_API_KEY and KIT_API_SECRET');
    process.exit(1);
  }
  
  console.log('✅ Configuration check passed');
  console.log(`🔑 API Key: ${config.kit.apiKey.substring(0, 10)}...`);
  console.log(`🔐 Secret: ${config.kit.apiSecret.substring(0, 10)}...\n`);
  
  try {
    // Test connection first
    console.log('🔍 Testing Kit connection...');
    const testResult = await testKitConnection();
    
    if (!testResult.success) {
      console.error('❌ Connection test failed:', testResult.error);
      process.exit(1);
    }
    
    console.log('✅ Connection successful!');
    if (testResult.account) {
      console.log(`📧 Account: ${testResult.account.name || 'Kit Account'}`);
    }
    console.log('');
    
    // Build complete automation architecture
    console.log('🏗️ Building complete automation architecture...');
    console.log('This will create:');
    console.log('• 25+ email sequences');
    console.log('• Smart tagging system');
    console.log('• Behavioral triggers');
    console.log('• Lead scoring integration\n');
    
    const results = await buildKitAutomations();
    
    // Report results
    console.log('📊 BUILD RESULTS:');
    console.log('==================');
    console.log(`✅ Email Sequences: ${results.sequences.length}`);
    console.log(`✅ Tags Created: ${results.tags.length}`);
    console.log(`✅ Automations: ${results.automations.length}`);
    
    if (results.sequences.length > 0) {
      console.log('\\n📧 Created Sequences:');
      results.sequences.forEach(seq => {
        console.log(`   • ${seq.name} (${seq.emails} emails)`);
      });
    }
    
    if (results.automations.length > 0) {
      console.log('\\n🤖 Automated Triggers:');
      results.automations.forEach(auto => {
        console.log(`   • ${auto.trigger} → ${auto.sequence}`);
      });
    }
    
    if (results.errors.length > 0) {
      console.log(`\\n⚠️ Warnings/Errors: ${results.errors.length}`);
      results.errors.forEach(error => console.log(`   • ${error}`));
    }
    
    console.log('\\n🎉 KIT AUTOMATION ARCHITECTURE COMPLETE!');
    console.log('\\nNext steps:');
    console.log('1. Log into kit.com to review sequences');
    console.log('2. Set up any missing automation triggers');
    console.log('3. Test with sample subscribers');
    console.log('4. Your backend will start using Kit immediately!');
    console.log('\\n💡 Pro tip: Check Kit Dashboard → Automations to see triggers');
    
  } catch (error) {
    console.error('\\n❌ BUILD FAILED:', error.message);
    if (error.stack) {
      console.error('Stack trace:', error.stack);
    }
    process.exit(1);
  }
}

// Handle unhandled rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Run the script
main().catch(error => {
  console.error('Script failed:', error);
  process.exit(1);
});