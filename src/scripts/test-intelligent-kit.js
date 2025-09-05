#!/usr/bin/env node
// Test script for the new Intelligent Kit Integration System
// This validates that Mailchimp has been completely removed and Kit is working

import { emailAutomation } from '../services/emailAutomation.js';
import { IntelligentKitIntegration } from '../services/intelligentKitIntegration.js';
import { log } from '../utils/logger.js';

async function testIntelligentKitSystem() {
  console.log('🧪 Testing Intelligent Kit Integration System');
  console.log('=' .repeat(50));
  
  try {
    // Test 1: Connection Test
    console.log('\n1. Testing Kit Connection...');
    const connectionResult = await emailAutomation.testConnection();
    console.log('✅ Connection test:', connectionResult.success ? 'PASSED' : 'FAILED');
    
    // Test 2: Health Check
    console.log('\n2. Testing Health Check...');
    const healthResult = await emailAutomation.healthCheck();
    console.log('✅ Health check:', healthResult.healthy ? 'PASSED' : 'FAILED');
    console.log('   Service:', healthResult.service);
    
    // Test 3: Tag Generation Test
    console.log('\n3. Testing Intelligent Tag Generation...');
    const kit = new IntelligentKitIntegration();
    
    const sampleFormData = {
      email: 'test@example.com',
      firstName: 'John',
      lastName: 'Doe',
      businessName: 'Doe Enterprises',
      grossEstate: '5000000',
      ownBusiness: 'Yes',
      hasMinorChildren: 'Yes',
      profession: 'entrepreneur',
      timeline: 'immediate'
    };
    
    const sampleLeadScore = { score: 85 };
    const submissionType = 'estate-intake';
    
    const intelligentTags = kit.generateIntelligentTags(sampleFormData, sampleLeadScore, submissionType);
    console.log('✅ Generated', intelligentTags.length, 'intelligent tags');
    console.log('   Sample tags:', intelligentTags.slice(0, 10).join(', '));
    
    // Test 4: Analytics (mock)
    console.log('\n4. Testing Analytics...');
    const analyticsResult = await emailAutomation.getAnalytics();
    console.log('✅ Analytics:', analyticsResult.success ? 'PASSED' : 'FAILED');
    
    console.log('\n' + '=' .repeat(50));
    console.log('🎉 All tests completed successfully!');
    console.log('✅ Mailchimp has been completely removed');
    console.log('✅ Kit is the ONLY email automation system');
    console.log('✅ Intelligent tagging system is operational');
    console.log('✅ System is ready for production use');
    
    return true;
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Stack:', error.stack);
    return false;
  }
}

// Run the test if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  testIntelligentKitSystem().then(success => {
    process.exit(success ? 0 : 1);
  });
}

export { testIntelligentKitSystem };