// Intelligent Kit Tagging System for Advanced Nurture Sequencing
// Creates sophisticated, strategic tags for precise email automation

import { log } from '../utils/logger.js';

export class IntelligentKitTagging {
  constructor() {
    this.log = log;
  }

  /**
   * Generate comprehensive intelligent tags for a lead
   * @param {Object} formData - Form submission data
   * @param {Object} leadScore - Lead scoring object with score and priority
   * @param {String} submissionType - Type of form submitted
   * @returns {Array} Array of intelligent tags for Kit/ConvertKit
   */
  generateIntelligentTags(formData, leadScore, submissionType) {
    const tags = [];
    
    // Core system tags
    tags.push('jc-lead', 'active-prospect');
    
    // Submission type tags
    tags.push(`source-${submissionType}`);
    
    // Lead priority and scoring tags
    tags.push(...this.generateScoringTags(leadScore));
    
    // Client profile tags
    tags.push(...this.generateClientProfileTags(formData));
    
    // Practice area need tags  
    tags.push(...this.generatePracticeAreaTags(formData, submissionType));
    
    // Sophistication and wealth tags
    tags.push(...this.generateSophisticationTags(formData));
    
    // Urgency and timeline tags
    tags.push(...this.generateUrgencyTags(formData));
    
    // Geographic and demographic tags
    tags.push(...this.generateDemographicTags(formData));
    
    // Engagement prediction tags
    tags.push(...this.generateEngagementTags(formData, leadScore));
    
    // Remove duplicates and return sorted
    return [...new Set(tags)].sort();
  }

  generateScoringTags(leadScore) {
    const tags = [];
    const score = leadScore.score || 0;
    
    // Priority level tags
    tags.push(`priority-${leadScore.priority || 'standard'}`);
    
    // Score range tags for segmentation
    if (score >= 90) {
      tags.push('platinum-prospect', 'vip-treatment', 'immediate-response');
    } else if (score >= 80) {
      tags.push('gold-prospect', 'premium-lead', 'high-conversion');
    } else if (score >= 70) {
      tags.push('silver-prospect', 'qualified-lead', 'good-fit');
    } else if (score >= 50) {
      tags.push('bronze-prospect', 'standard-nurture', 'developing');
    } else {
      tags.push('education-needed', 'long-term-nurture', 'awareness-stage');
    }
    
    // Conversion probability tags
    if (score >= 85) tags.push('high-conversion-probability');
    else if (score >= 70) tags.push('medium-conversion-probability');
    else tags.push('low-conversion-probability');
    
    return tags;
  }

  generateClientProfileTags(formData) {
    const tags = [];
    
    // Professional athlete identification
    if (this.isAthlete(formData)) {
      tags.push('athlete', 'sports-professional', 'endorsement-income', 
                'career-transition-planning', 'image-rights', 'contract-negotiation');
    }
    
    // Creator/Influencer identification  
    if (this.isCreator(formData)) {
      tags.push('creator', 'digital-entrepreneur', 'content-monetization',
                'ip-monetization', 'brand-partnerships', 'social-media-business');
    }
    
    // Startup founder identification
    if (this.isStartup(formData)) {
      tags.push('startup-founder', 'equity-planning', 'investor-relations',
                'exit-planning', 'venture-capital', 'rapid-growth');
    }
    
    // High net worth family identification
    if (this.isHighNetWorth(formData)) {
      tags.push('high-net-worth', 'family-office-services', 'generational-wealth',
                'complex-structures', 'tax-optimization', 'philanthropy');
    }
    
    // Business owner identification
    if (this.isBusinessOwner(formData)) {
      tags.push('business-owner', 'succession-planning', 'asset-protection',
                'business-valuation', 'exit-strategies');
    }
    
    return tags;
  }

  generatePracticeAreaTags(formData, submissionType) {
    const tags = [];
    
    // Practice area based on submission type
    switch (submissionType) {
      case 'estate-intake':
        tags.push('estate-planning', 'wealth-transfer', 'tax-planning');
        break;
      case 'business-formation':
        tags.push('business-law', 'entity-formation', 'corporate-structure');
        break;
      case 'brand-protection':
        tags.push('brand-law', 'trademark-strategy', 'ip-enforcement');
        break;
      case 'outside-counsel':
        tags.push('general-counsel', 'strategic-legal', 'ongoing-support');
        break;
      case 'legal-strategy-builder':
        tags.push('strategy-builder', 'comprehensive-planning', 'multi-area');
        break;
    }
    
    // Additional practice area needs based on form data
    if (formData.hasIntellectualProperty || formData.brandProtection) {
      tags.push('ip-needs', 'trademark-candidate', 'brand-protection');
    }
    
    if (formData.businessFormation || formData.entityStructure) {
      tags.push('entity-planning', 'business-structure', 'corporate-needs');
    }
    
    if (formData.estateValue || formData.wealthProtection) {
      tags.push('wealth-planning', 'estate-needs', 'asset-protection');
    }
    
    return tags;
  }

  generateSophisticationTags(formData) {
    const tags = [];
    
    const estateValue = parseInt(formData.estateValue) || 0;
    const businessRevenue = parseInt(formData.businessRevenue) || 0;
    
    // Estate value sophistication
    if (estateValue >= 50000000) {
      tags.push('ultra-high-net-worth', 'dynasty-planning', 'complex-tax-strategies',
                'international-structures', 'family-governance');
    } else if (estateValue >= 10000000) {
      tags.push('very-high-net-worth', 'advanced-planning', 'sophisticated-strategies',
                'tax-minimization', 'generation-skipping');
    } else if (estateValue >= 5000000) {
      tags.push('high-net-worth', 'estate-tax-planning', 'trust-planning',
                'charitable-giving', 'business-succession');
    } else if (estateValue >= 1000000) {
      tags.push('affluent', 'trust-candidate', 'tax-planning', 'wealth-protection');
    } else {
      tags.push('foundational-planning', 'basic-estate-planning', 'will-trust-basics');
    }
    
    // Business sophistication
    if (businessRevenue >= 25000000) {
      tags.push('enterprise-client', 'complex-business', 'sophisticated-operations');
    } else if (businessRevenue >= 5000000) {
      tags.push('growth-business', 'scaling-operations', 'expansion-planning');
    } else if (businessRevenue >= 1000000) {
      tags.push('established-business', 'optimization-focus', 'growth-ready');
    } else {
      tags.push('emerging-business', 'foundation-building', 'early-stage');
    }
    
    return tags;
  }

  generateUrgencyTags(formData) {
    const tags = [];
    
    // Timeline urgency
    if (formData.timeline?.toLowerCase().includes('immediate')) {
      tags.push('urgent', 'immediate-need', 'time-sensitive');
    } else if (formData.timeline?.toLowerCase().includes('month')) {
      tags.push('near-term', 'quarterly-planning', 'active-timeline');
    } else {
      tags.push('long-term-planning', 'strategic-timing', 'flexible-timeline');
    }
    
    // Life event urgency indicators
    if (formData.lifeEvent) {
      tags.push('life-event-driven', 'situational-urgency');
    }
    
    return tags;
  }

  generateDemographicTags(formData) {
    const tags = [];
    
    // Age-based planning
    if (formData.age) {
      const age = parseInt(formData.age);
      if (age >= 65) {
        tags.push('retirement-age', 'legacy-planning', 'distribution-phase');
      } else if (age >= 50) {
        tags.push('pre-retirement', 'succession-planning', 'wealth-transfer');
      } else if (age >= 35) {
        tags.push('wealth-building', 'family-planning', 'growth-phase');
      } else {
        tags.push('early-career', 'foundation-building', 'accumulation-phase');
      }
    }
    
    // Family structure
    if (formData.children || formData.familySize) {
      tags.push('family-planning', 'next-generation', 'education-funding');
    }
    
    return tags;
  }

  generateEngagementTags(formData, leadScore) {
    const tags = [];
    const score = leadScore.score || 0;
    
    // Engagement level prediction
    if (score >= 80) {
      tags.push('high-engagement-likely', 'consultation-ready', 'decision-maker');
    } else if (score >= 60) {
      tags.push('moderate-engagement', 'education-responsive', 'consideration-stage');
    } else {
      tags.push('education-focused', 'awareness-building', 'long-nurture');
    }
    
    // Communication preferences
    if (formData.communicationPreference) {
      tags.push(`prefers-${formData.communicationPreference}`);
    }
    
    return tags;
  }

  // Client profile detection methods
  isAthlete(formData) {
    return formData.profession?.toLowerCase().includes('athlete') ||
           formData.industry === 'sports' ||
           formData.careerType === 'professional_athlete' ||
           formData.revenueStreams?.includes('endorsements');
  }

  isCreator(formData) {
    return formData.industry?.includes('content') ||
           formData.businessType?.includes('creator') ||
           formData.revenueStreams?.includes('brand_partnerships') ||
           (formData.socialFollowing && formData.socialFollowing > 100000);
  }

  isStartup(formData) {
    return formData.businessStage === 'startup' ||
           formData.fundingStage ||
           formData.growthPlans?.includes('venture_capital') ||
           (formData.businessAge && formData.businessAge < 5);
  }

  isHighNetWorth(formData) {
    return (formData.estateValue && formData.estateValue > 10000000) ||
           formData.familyOffice ||
           formData.generationalWealth ||
           formData.familyComplexity === 'high';
  }

  isBusinessOwner(formData) {
    return formData.businessOwnership === 'owner' ||
           formData.businessRole?.includes('owner') ||
           formData.businessRole?.includes('ceo') ||
           (formData.businessRevenue && formData.businessRevenue > 0);
  }

  /**
   * Generate nurture sequence assignment tags
   * These determine which specific email sequences to enroll the lead in
   */
  generateSequenceAssignmentTags(formData, leadScore, submissionType) {
    const tags = [];
    const score = leadScore.score || 0;
    
    // Primary sequence based on client profile
    if (this.isAthlete(formData)) {
      tags.push('seq-athlete-welcome');
      if (score >= 80) tags.push('seq-athlete-vip');
    } else if (this.isCreator(formData)) {
      tags.push('seq-creator-welcome');
      if (score >= 80) tags.push('seq-creator-premium');
    } else if (this.isStartup(formData)) {
      tags.push('seq-startup-welcome');
      if (score >= 80) tags.push('seq-startup-accelerated');
    } else if (this.isHighNetWorth(formData)) {
      tags.push('seq-hnw-welcome');
      if (score >= 90) tags.push('seq-hnw-ultra');
    } else {
      tags.push('seq-general-welcome');
    }
    
    // Practice area sequences
    switch (submissionType) {
      case 'estate-intake':
        tags.push('seq-estate-education');
        break;
      case 'business-formation':
        tags.push('seq-business-education');
        break;
      case 'brand-protection':
        tags.push('seq-brand-education');
        break;
    }
    
    // Score-based nurture intensity
    if (score >= 85) {
      tags.push('seq-high-touch', 'seq-consultation-push');
    } else if (score >= 70) {
      tags.push('seq-medium-touch', 'seq-value-demonstration');
    } else {
      tags.push('seq-low-touch', 'seq-education-first');
    }
    
    return tags;
  }
}

export default IntelligentKitTagging;