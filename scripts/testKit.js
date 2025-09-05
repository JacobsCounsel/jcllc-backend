#!/usr/bin/env node

// Kit Integration Test Script
// Tests the complete intelligent tagging and nurture system

import IntelligentKitTagging from '../src/services/intelligentKitTagging.js';
import { addToKitWithIntelligentTagging } from '../src/services/coreServices.js';

class KitTestRunner {
  constructor() {
    this.kitTagging = new IntelligentKitTagging();
  }

  async runTests() {
    console.log('🧪 Testing Kit Intelligent Tagging System\n');

    const testCases = [
      {
        name: 'High-Scoring Professional Athlete',
        formData: {
          firstName: 'Michael',
          email: 'test+athlete@jacobscounsel.com',
          profession: 'professional athlete',
          estateValue: '15000000',
          businessRevenue: '8000000',
          hasIntellectualProperty: true,
          timeline: 'immediate',
          age: '28'
        },
        leadScore: { score: 92, priority: 'platinum' },
        submissionType: 'legal-risk-assessment'
      },
      {
        name: 'Content Creator with Brand Partnerships',
        formData: {
          firstName: 'Sarah',
          email: 'test+creator@jacobscounsel.com',
          industry: 'content creation',
          socialFollowing: '250000',
          revenueStreams: ['brand_partnerships', 'courses', 'affiliate'],
          businessRevenue: '750000',
          brandProtection: true,
          timeline: 'next_month'
        },
        leadScore: { score: 78, priority: 'gold' },
        submissionType: 'brand-protection'
      },
      {
        name: 'Startup Founder Pre-Series A',
        formData: {
          firstName: 'Alex',
          email: 'test+startup@jacobscounsel.com',
          businessStage: 'startup',
          fundingStage: 'pre-series-a',
          businessRevenue: '2500000',
          hasIntellectualProperty: true,
          businessAge: '3',
          timeline: 'immediate'
        },
        leadScore: { score: 85, priority: 'platinum' },
        submissionType: 'business-formation'
      },
      {
        name: 'Ultra High Net Worth Family',
        formData: {
          firstName: 'Elizabeth',
          email: 'test+hnw@jacobscounsel.com',
          estateValue: '75000000',
          familyOffice: true,
          generationalWealth: true,
          age: '52',
          children: '3',
          businessOwnership: 'owner',
          businessRevenue: '15000000'
        },
        leadScore: { score: 95, priority: 'platinum' },
        submissionType: 'estate-intake'
      },
      {
        name: 'Standard Business Owner',
        formData: {
          firstName: 'Robert',
          email: 'test+business@jacobscounsel.com',
          businessOwnership: 'owner',
          businessRevenue: '1200000',
          businessAge: '8',
          timeline: 'flexible'
        },
        leadScore: { score: 58, priority: 'standard' },
        submissionType: 'business-formation'
      }
    ];

    for (const testCase of testCases) {
      await this.runTestCase(testCase);
    }

    console.log('\n🎉 All tests completed! Review the tagging results above.\n');
    
    console.log('📋 NEXT STEPS:');
    console.log('1. Run: node scripts/setupKit.js');
    console.log('2. Verify sequences created in Kit dashboard');
    console.log('3. Test with real form submissions\n');
  }

  async runTestCase(testCase) {
    console.log(`\n🔍 Testing: ${testCase.name}`);
    console.log('='.repeat(50));

    // Generate intelligent tags
    const intelligentTags = this.kitTagging.generateIntelligentTags(
      testCase.formData, 
      testCase.leadScore, 
      testCase.submissionType
    );

    // Generate sequence assignment tags
    const sequenceTags = this.kitTagging.generateSequenceAssignmentTags(
      testCase.formData,
      testCase.leadScore, 
      testCase.submissionType
    );

    console.log(`\n📊 Lead Details:`);
    console.log(`   Name: ${testCase.formData.firstName}`);
    console.log(`   Email: ${testCase.formData.email}`);
    console.log(`   Score: ${testCase.leadScore.score} (${testCase.leadScore.priority})`);
    console.log(`   Type: ${testCase.submissionType}`);

    console.log(`\n🏷️ Generated Intelligent Tags (${intelligentTags.length}):`);
    this.printTagsByCategory(intelligentTags);

    console.log(`\n📧 Sequence Assignments (${sequenceTags.length}):`);
    sequenceTags.forEach(tag => console.log(`   • ${tag}`));

    console.log(`\n📈 Profile Analysis:`);
    console.log(`   Client Type: ${this.analyzeClientType(testCase.formData)}`);
    console.log(`   Sophistication: ${this.analyzeSophistication(testCase.formData)}`);
    console.log(`   Urgency: ${this.analyzeUrgency(testCase.formData)}`);
    console.log(`   Practice Areas: ${this.analyzePracticeAreas(testCase.formData, testCase.submissionType)}`);

    // Test Kit integration (dry run)
    console.log(`\n🔗 Kit Integration Preview:`);
    console.log(`   Total Tags: ${intelligentTags.length + sequenceTags.length}`);
    console.log(`   Primary Sequence: ${sequenceTags.find(tag => tag.includes('welcome')) || 'seq-general-welcome'}`);
    console.log(`   Additional Sequences: ${sequenceTags.filter(tag => !tag.includes('welcome')).length}`);

    console.log('\n' + '─'.repeat(50));
  }

  printTagsByCategory(tags) {
    const categories = {
      'System': tags.filter(t => ['jc-lead', 'active-prospect', 'platinum-prospect', 'gold-prospect', 'silver-prospect', 'bronze-prospect'].includes(t)),
      'Profile': tags.filter(t => ['athlete', 'creator', 'startup-founder', 'high-net-worth', 'business-owner'].includes(t)),
      'Practice': tags.filter(t => t.includes('planning') || t.includes('law') || t.includes('protection')),
      'Sophistication': tags.filter(t => t.includes('net-worth') || t.includes('sophisticated') || t.includes('complex')),
      'Engagement': tags.filter(t => t.includes('engagement') || t.includes('conversion') || t.includes('consultation'))
    };

    for (const [category, categoryTags] of Object.entries(categories)) {
      if (categoryTags.length > 0) {
        console.log(`   ${category}: ${categoryTags.join(', ')}`);
      }
    }
  }

  analyzeClientType(formData) {
    if (this.kitTagging.isAthlete(formData)) return 'Professional Athlete';
    if (this.kitTagging.isCreator(formData)) return 'Content Creator';
    if (this.kitTagging.isStartup(formData)) return 'Startup Founder';
    if (this.kitTagging.isHighNetWorth(formData)) return 'High Net Worth';
    if (this.kitTagging.isBusinessOwner(formData)) return 'Business Owner';
    return 'General Prospect';
  }

  analyzeSophistication(formData) {
    const estateValue = parseInt(formData.estateValue) || 0;
    const businessRevenue = parseInt(formData.businessRevenue) || 0;
    
    if (estateValue >= 50000000 || businessRevenue >= 25000000) return 'Ultra-Sophisticated';
    if (estateValue >= 10000000 || businessRevenue >= 5000000) return 'Very Sophisticated';
    if (estateValue >= 5000000 || businessRevenue >= 1000000) return 'Sophisticated';
    if (estateValue >= 1000000 || businessRevenue >= 250000) return 'Moderate';
    return 'Basic';
  }

  analyzeUrgency(formData) {
    if (formData.timeline?.includes('immediate')) return 'Urgent';
    if (formData.timeline?.includes('month')) return 'Near-term';
    return 'Standard';
  }

  analyzePracticeAreas(formData, submissionType) {
    const areas = [];
    
    if (submissionType.includes('estate') || formData.estateValue) areas.push('Estate');
    if (submissionType.includes('business') || formData.businessRevenue) areas.push('Business');
    if (submissionType.includes('brand') || formData.hasIntellectualProperty) areas.push('Brand');
    if (formData.estateValue > 5000000) areas.push('Wealth');
    
    return areas.join(', ') || 'General';
  }

  // Live Kit integration test (optional)
  async testLiveKit() {
    console.log('🔴 LIVE KIT TEST - This will create real subscribers!');
    console.log('Only run this when you\'re ready to test with real Kit account.\n');

    const testLead = {
      firstName: 'Test',
      email: 'test+system@jacobscounsel.com',
      profession: 'test case',
      businessRevenue: '1000000'
    };

    const leadScore = { score: 75, priority: 'gold' };
    const submissionType = 'system-test';

    try {
      const result = await addToKitWithIntelligentTagging(testLead, leadScore, submissionType);
      
      if (result.success) {
        console.log('✅ Live Kit test successful!');
        console.log(`   Subscriber ID: ${result.subscriberId}`);
        console.log(`   Tags Applied: ${result.tags?.length || 0}`);
        console.log(`   Sequences: ${result.sequences?.length || 0}`);
      } else {
        console.log('❌ Live Kit test failed:', result.error);
      }
    } catch (error) {
      console.log('❌ Live Kit test error:', error.message);
    }
  }
}

// Run tests
if (import.meta.url === `file://${process.argv[1]}`) {
  const tester = new KitTestRunner();
  
  if (process.argv.includes('--live')) {
    await tester.testLiveKit();
  } else {
    await tester.runTests();
  }
}

export default KitTestRunner;