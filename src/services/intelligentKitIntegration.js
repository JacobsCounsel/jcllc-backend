// src/services/intelligentKitIntegration.js - Super Smart Kit Integration with Strategic Tagging
// This is the ONLY email automation system - no Mailchimp dependencies

import fetch from 'node-fetch';
import { config } from '../config/environment.js';
import { log } from '../utils/logger.js';

const KIT_API_BASE = 'https://api.kit.com/v4';

export class IntelligentKitIntegration {
  constructor() {
    this.apiKey = config.kit.apiKey;
    this.headers = {
      'X-Kit-Api-Key': this.apiKey,
      'Content-Type': 'application/json'
    };
  }

  // Test connection to Kit
  async testConnection() {
    try {
      const response = await fetch(`${KIT_API_BASE}/account`, {
        headers: this.headers
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(`Kit connection failed: ${data.error || 'Unknown error'}`);
      }
      
      log.info('✅ Kit connection successful', { account: data.name });
      return { success: true, account: data };
    } catch (error) {
      log.error('❌ Kit connection failed:', error.message);
      throw error;
    }
  }

  // Generate intelligent tags based on comprehensive lead analysis
  generateIntelligentTags(formData, leadScore, submissionType) {
    const tags = [];
    
    // Base submission tracking
    tags.push(`intake-${submissionType}`);
    tags.push(`date-${new Date().toISOString().split('T')[0]}`);
    tags.push(`source-website`);
    
    // LEAD SCORE TAGGING (inverted from risk scale 0-30 to lead score 0-100)
    const leadScoreValue = leadScore.score;
    if (leadScoreValue >= 90) {
      tags.push('lead-score-ultra-high', 'priority-platinum', 'vip-prospect');
    } else if (leadScoreValue >= 80) {
      tags.push('lead-score-very-high', 'priority-gold', 'premium-prospect');
    } else if (leadScoreValue >= 70) {
      tags.push('lead-score-high', 'priority-silver', 'qualified-prospect');
    } else if (leadScoreValue >= 50) {
      tags.push('lead-score-medium', 'priority-bronze', 'standard-prospect');
    } else {
      tags.push('lead-score-developing', 'priority-nurture', 'emerging-prospect');
    }
    
    // SUBMISSION TYPE SPECIFIC TAGGING
    this.addSubmissionTypeTags(tags, formData, submissionType);
    
    // CLIENT PROFILE DETECTION
    this.addClientProfileTags(tags, formData, leadScoreValue);
    
    // PRACTICE AREA NEEDS
    this.addPracticeAreaTags(tags, formData, submissionType);
    
    // SOPHISTICATION LEVEL
    this.addSophisticationLevelTags(tags, formData, leadScoreValue);
    
    // URGENCY AND TIMELINE TAGS
    this.addUrgencyTags(tags, formData);
    
    // GEOGRAPHIC AND DEMOGRAPHIC TAGS
    this.addDemographicTags(tags, formData);
    
    // ENGAGEMENT LEVEL PREDICTION
    this.addEngagementTags(tags, formData, leadScoreValue);
    
    return tags;
  }

  // Add submission type specific tags
  addSubmissionTypeTags(tags, formData, submissionType) {
    switch (submissionType) {
      case 'estate-intake':
        tags.push('service-estate-planning', 'practice-area-wealth');
        const estate = this.parseMonetaryValue(formData.grossEstate);
        
        if (estate >= 50000000) {
          tags.push('estate-ultra-high-net-worth', 'sequence-dynasty-trust', 'tax-optimization-complex');
        } else if (estate >= 10000000) {
          tags.push('estate-very-high-net-worth', 'sequence-advanced-estate', 'tax-planning-sophisticated');
        } else if (estate >= 5000000) {
          tags.push('estate-high-net-worth', 'sequence-estate-tax', 'tax-planning-required');
        } else if (estate >= 1000000) {
          tags.push('estate-affluent', 'sequence-wealth-protection', 'trust-planning-candidate');
        } else {
          tags.push('estate-standard', 'sequence-basic-planning', 'will-trust-basics');
        }
        
        if (formData.ownBusiness === 'Yes') {
          tags.push('business-owner', 'succession-planning-needed', 'business-estate-integration');
        }
        
        if (formData.hasMinorChildren === 'Yes') {
          tags.push('minor-children', 'guardian-planning', 'education-funding');
        }
        break;
        
      case 'business-formation':
        tags.push('service-business-formation', 'practice-area-business');
        
        if (formData.investmentPlan?.includes('vc') || formData.investmentPlan?.includes('venture')) {
          tags.push('startup-vc-track', 'sequence-vc-startup', 'equity-structure-complex');
        } else if (formData.investmentPlan?.includes('angel')) {
          tags.push('startup-angel-track', 'sequence-angel-funding', 'early-stage-venture');
        }
        
        if (formData.businessType?.includes('tech') || formData.businessType?.includes('software')) {
          tags.push('tech-startup', 'ip-protection-likely', 'equity-comp-needed');
        }
        
        const revenue = this.parseMonetaryValue(formData.projectedRevenue);
        if (revenue >= 10000000) {
          tags.push('high-growth-potential', 'complex-structure-needed');
        } else if (revenue >= 1000000) {
          tags.push('scaling-business', 'tax-planning-important');
        }
        break;
        
      case 'brand-protection':
        tags.push('service-brand-protection', 'practice-area-brand');
        
        if (formData.protectionGoal?.includes('enforcement')) {
          tags.push('ip-enforcement-needed', 'sequence-ip-enforcement', 'litigation-risk');
        }
        
        if (formData.protectionGoal?.includes('registration')) {
          tags.push('trademark-registration', 'sequence-trademark-registration', 'brand-building');
        }
        
        if (formData.businessStage?.includes('established')) {
          tags.push('established-brand', 'portfolio-management', 'defensive-strategy');
        }
        break;
        
      case 'outside-counsel':
        tags.push('service-outside-counsel', 'practice-area-multiple');
        tags.push('ongoing-relationship', 'retainer-candidate', 'strategic-counsel');
        break;
    }
  }

  // Add client profile tags based on indicators
  addClientProfileTags(tags, formData, leadScore) {
    // ATHLETE DETECTION
    if (this.isAthlete(formData)) {
      tags.push('client-profile-athlete', 'high-performer', 'contract-negotiation', 'image-rights', 'endorsement-deals');
      if (leadScore >= 80) tags.push('professional-athlete');
      else tags.push('emerging-athlete');
    }
    
    // CREATOR DETECTION  
    if (this.isCreator(formData)) {
      tags.push('client-profile-creator', 'digital-entrepreneur', 'ip-monetization', 'content-licensing', 'brand-partnerships');
      if (leadScore >= 80) tags.push('established-creator');
      else tags.push('growing-creator');
    }
    
    // STARTUP FOUNDER
    if (this.isStartupFounder(formData)) {
      tags.push('client-profile-startup', 'entrepreneur', 'equity-structure', 'investor-relations', 'exit-planning');
      if (leadScore >= 80) tags.push('serial-entrepreneur');
      else tags.push('first-time-founder');
    }
    
    // FAMILY OFFICE / HIGH NET WORTH
    if (this.isHighNetWorth(formData)) {
      tags.push('client-profile-family', 'ultra-high-net-worth', 'family-office', 'generational-wealth', 'philanthropy');
      tags.push('white-glove-service', 'concierge-level');
    }
    
    // BUSINESS OWNER
    if (this.isBusinessOwner(formData)) {
      tags.push('client-profile-business-owner', 'succession-planning', 'tax-optimization', 'asset-protection');
    }
  }

  // Add practice area specific tags
  addPracticeAreaTags(tags, formData, submissionType) {
    // BUSINESS PRACTICE TAGS
    if (this.needsBusinessLaw(formData, submissionType)) {
      tags.push('practice-business-law', 'corporate-structure', 'contract-drafting', 'compliance-needs');
    }
    
    // BRAND PRACTICE TAGS
    if (this.needsBrandLaw(formData, submissionType)) {
      tags.push('practice-brand-law', 'trademark-needs', 'ip-strategy', 'brand-enforcement');
    }
    
    // WEALTH PRACTICE TAGS  
    if (this.needsWealthLaw(formData, submissionType)) {
      tags.push('practice-wealth-law', 'tax-planning', 'asset-protection', 'estate-planning');
    }
    
    // ESTATE PRACTICE TAGS
    if (this.needsEstateLaw(formData, submissionType)) {
      tags.push('practice-estate-law', 'succession-planning', 'trust-administration', 'probate-avoidance');
    }
  }

  // Add sophistication level tags
  addSophisticationLevelTags(tags, formData, leadScore) {
    const sophistication = this.assessSophisticationLevel(formData, leadScore);
    
    switch (sophistication) {
      case 'ultra-high-net-worth':
        tags.push('sophistication-uhnw', 'complex-strategies', 'multi-generational', 'international-structures');
        tags.push('sequence-uhnw-exclusive', 'white-glove-only');
        break;
        
      case 'advanced':
        tags.push('sophistication-advanced', 'complex-planning', 'tax-sophisticated', 'multi-entity-structures');
        tags.push('sequence-advanced-strategies');
        break;
        
      case 'intermediate':
        tags.push('sophistication-intermediate', 'some-experience', 'growth-oriented', 'planning-aware');
        tags.push('sequence-intermediate-education');
        break;
        
      case 'basic':
        tags.push('sophistication-basic', 'education-needed', 'first-time-client', 'foundation-building');
        tags.push('sequence-educational-nurture');
        break;
    }
  }

  // Add urgency and timeline tags
  addUrgencyTags(tags, formData) {
    const urgency = formData.urgency?.toLowerCase() || formData.timeline?.toLowerCase() || '';
    
    if (urgency.includes('immediate') || urgency.includes('urgent') || urgency.includes('asap')) {
      tags.push('urgency-immediate', 'priority-rush', 'same-day-response');
    } else if (urgency.includes('week') || urgency.includes('soon')) {
      tags.push('urgency-high', 'priority-expedited', 'quick-turnaround');
    } else if (urgency.includes('month')) {
      tags.push('urgency-normal', 'priority-standard', 'normal-timeline');
    } else {
      tags.push('urgency-flexible', 'priority-when-ready', 'education-phase');
    }
  }

  // Add demographic and geographic tags
  addDemographicTags(tags, formData) {
    // Age/generation detection from form patterns
    if (formData.hasMinorChildren === 'Yes' && formData.email?.includes('gmail')) {
      tags.push('generation-millennial', 'tech-savvy', 'digital-first');
    }
    
    // Geographic indicators (if available)
    if (formData.state || formData.location) {
      const location = (formData.state || formData.location || '').toLowerCase();
      if (['ca', 'california', 'san francisco', 'los angeles'].some(l => location.includes(l))) {
        tags.push('location-california', 'high-cost-area', 'tech-hub');
      } else if (['ny', 'new york', 'nyc', 'manhattan'].some(l => location.includes(l))) {
        tags.push('location-new-york', 'financial-hub', 'high-net-worth-area');
      } else if (['tx', 'texas', 'austin', 'dallas'].some(l => location.includes(l))) {
        tags.push('location-texas', 'business-friendly', 'no-state-tax');
      } else if (['fl', 'florida', 'miami'].some(l => location.includes(l))) {
        tags.push('location-florida', 'asset-protection-friendly', 'no-state-tax');
      }
    }
  }

  // Add engagement prediction tags
  addEngagementTags(tags, formData, leadScore) {
    // Email domain analysis
    const emailDomain = formData.email?.split('@')[1]?.toLowerCase();
    
    if (['gmail.com', 'yahoo.com', 'hotmail.com'].includes(emailDomain)) {
      tags.push('email-personal', 'individual-client');
    } else if (emailDomain && !emailDomain.includes('gmail') && !emailDomain.includes('yahoo')) {
      tags.push('email-professional', 'business-client', 'corporate-entity');
    }
    
    // Form completion quality
    const completionQuality = this.assessFormCompletion(formData);
    if (completionQuality === 'high') {
      tags.push('engagement-high', 'detail-oriented', 'serious-inquiry');
    } else if (completionQuality === 'medium') {
      tags.push('engagement-medium', 'interested-but-cautious');
    } else {
      tags.push('engagement-low', 'needs-nurturing', 'early-stage-interest');
    }
    
    // Lead score correlation
    if (leadScore >= 85) {
      tags.push('conversion-high-probability', 'close-ready', 'decision-maker');
    } else if (leadScore >= 70) {
      tags.push('conversion-medium-probability', 'qualified-lead', 'needs-consultation');
    } else if (leadScore >= 50) {
      tags.push('conversion-developing', 'nurture-candidate', 'education-needed');
    } else {
      tags.push('conversion-long-term', 'awareness-stage', 'content-consumer');
    }
  }

  // Helper functions for client detection
  isAthlete(formData) {
    const indicators = [
      formData.profession?.toLowerCase(),
      formData.businessType?.toLowerCase(), 
      formData.industry?.toLowerCase(),
      formData.background?.toLowerCase()
    ].filter(Boolean).join(' ');
    
    return ['athlete', 'sports', 'professional sports', 'nfl', 'nba', 'mlb', 'olympic'].some(term => 
      indicators.includes(term)
    );
  }

  isCreator(formData) {
    const indicators = [
      formData.profession?.toLowerCase(),
      formData.businessType?.toLowerCase(),
      formData.industry?.toLowerCase(),
      formData.background?.toLowerCase()
    ].filter(Boolean).join(' ');
    
    return ['creator', 'influencer', 'content', 'youtube', 'instagram', 'tiktok', 'social media', 'artist', 'musician', 'author'].some(term => 
      indicators.includes(term)
    );
  }

  isStartupFounder(formData) {
    return formData.investmentPlan?.includes('vc') || 
           formData.investmentPlan?.includes('angel') ||
           formData.businessType?.includes('startup') ||
           formData.businessStage?.includes('startup');
  }

  isHighNetWorth(formData) {
    const estate = this.parseMonetaryValue(formData.grossEstate);
    const revenue = this.parseMonetaryValue(formData.projectedRevenue);
    
    return estate >= 5000000 || revenue >= 10000000 || formData.familyOffice;
  }

  isBusinessOwner(formData) {
    return formData.ownBusiness === 'Yes' || 
           formData.businessName || 
           formData.companyName ||
           formData.businessType;
  }

  // Practice area need detection
  needsBusinessLaw(formData, submissionType) {
    return submissionType === 'business-formation' ||
           submissionType === 'outside-counsel' ||
           formData.ownBusiness === 'Yes' ||
           formData.businessType;
  }

  needsBrandLaw(formData, submissionType) {
    return submissionType === 'brand-protection' ||
           this.isCreator(formData) ||
           formData.protectionGoal?.includes('trademark') ||
           formData.protectionGoal?.includes('brand');
  }

  needsWealthLaw(formData, submissionType) {
    const estate = this.parseMonetaryValue(formData.grossEstate);
    return estate >= 1000000 || submissionType === 'estate-intake';
  }

  needsEstateLaw(formData, submissionType) {
    return submissionType === 'estate-intake' ||
           formData.hasMinorChildren === 'Yes' ||
           formData.planningGoal;
  }

  // Assess sophistication level
  assessSophisticationLevel(formData, leadScore) {
    const estate = this.parseMonetaryValue(formData.grossEstate);
    const revenue = this.parseMonetaryValue(formData.projectedRevenue);
    
    if (estate >= 25000000 || revenue >= 50000000 || formData.familyOffice) {
      return 'ultra-high-net-worth';
    } else if ((estate >= 5000000 || revenue >= 10000000) && leadScore >= 80) {
      return 'advanced';
    } else if ((estate >= 1000000 || revenue >= 1000000) && leadScore >= 60) {
      return 'intermediate';
    } else {
      return 'basic';
    }
  }

  // Assess form completion quality
  assessFormCompletion(formData) {
    const requiredFields = ['email', 'firstName', 'lastName'];
    const optionalFields = ['phone', 'businessName', 'timeline', 'budget'];
    
    const requiredCompleted = requiredFields.filter(field => formData[field]).length;
    const optionalCompleted = optionalFields.filter(field => formData[field]).length;
    
    const completionScore = (requiredCompleted / requiredFields.length) * 0.7 + 
                           (optionalCompleted / optionalFields.length) * 0.3;
    
    if (completionScore >= 0.8) return 'high';
    else if (completionScore >= 0.5) return 'medium';
    else return 'low';
  }

  // Parse monetary values from strings
  parseMonetaryValue(value) {
    if (!value) return 0;
    return parseFloat(value.toString().replace(/[,$]/g, '')) || 0;
  }

  // Main function to process a lead submission
  async processLeadSubmission(formData, leadScore, submissionType) {
    try {
      const tags = this.generateIntelligentTags(formData, leadScore, submissionType);
      
      // Create or get subscriber
      const email = formData.email;
      const firstName = formData.firstName || formData.fullName?.split(' ')[0] || '';
      const lastName = formData.lastName || formData.fullName?.split(' ').slice(1).join(' ') || '';
      
      let subscriber = await this.getSubscriberByEmail(email);
      
      if (!subscriber) {
        subscriber = await this.createSubscriber(email, firstName, lastName);
      }
      
      // Apply all intelligent tags
      const tagResults = [];
      for (const tagName of tags) {
        try {
          // Create tag if it doesn't exist, then apply
          const tagResult = await this.createAndApplyTag(email, tagName);
          tagResults.push({ tag: tagName, success: true, result: tagResult });
        } catch (error) {
          log.warn(`Failed to apply tag: ${tagName}`, error.message);
          tagResults.push({ tag: tagName, success: false, error: error.message });
        }
      }
      
      // Add to appropriate sequence based on lead score and type
      const sequenceResult = await this.addToIntelligentSequence(email, formData, leadScore, submissionType);
      
      log.info(`✅ Intelligent Kit processing complete for ${email}`, {
        tagsApplied: tagResults.filter(r => r.success).length,
        totalTags: tags.length,
        sequence: sequenceResult?.sequenceName || 'none'
      });
      
      return {
        success: true,
        subscriber: subscriber,
        tags: tagResults,
        sequence: sequenceResult,
        intelligentTags: tags
      };
      
    } catch (error) {
      log.error(`❌ Intelligent Kit processing failed for ${formData.email}:`, error.message);
      throw error;
    }
  }

  // Helper methods for Kit API calls
  async getSubscriberByEmail(email) {
    try {
      const response = await fetch(`${KIT_API_BASE}/subscribers?email_address=${encodeURIComponent(email)}`, {
        headers: this.headers
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(`Subscriber lookup failed: ${data.error}`);
      }
      
      return data.data && data.data.length > 0 ? data.data[0] : null;
    } catch (error) {
      log.error(`Subscriber lookup failed: ${email}`, error.message);
      return null;
    }
  }

  async createSubscriber(email, firstName = '', lastName = '') {
    try {
      const response = await fetch(`${KIT_API_BASE}/subscribers`, {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify({
          email_address: email,
          first_name: firstName,
          last_name: lastName
        })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        if (response.status === 409) {
          return await this.getSubscriberByEmail(email);
        }
        throw new Error(`Subscriber creation failed: ${data.error || 'Unknown error'}`);
      }
      
      log.info(`✅ Kit subscriber created: ${email}`);
      return data.data;
    } catch (error) {
      log.error(`Subscriber creation failed: ${email}`, error.message);
      throw error;
    }
  }

  async createAndApplyTag(email, tagName) {
    try {
      // First try to create the tag (will succeed or fail gracefully if exists)
      await this.createTag(tagName);
      
      // Then apply the tag to the subscriber
      return await this.applyTagByName(email, tagName);
    } catch (error) {
      log.error(`Create and apply tag failed: ${tagName} for ${email}`, error.message);
      throw error;
    }
  }

  async createTag(tagName) {
    try {
      const response = await fetch(`${KIT_API_BASE}/tags`, {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify({
          name: tagName
        })
      });
      
      const data = await response.json();
      
      if (!response.ok && response.status !== 409) { // 409 means tag already exists
        throw new Error(`Tag creation failed: ${data.error}`);
      }
      
      return data.data;
    } catch (error) {
      // Don't throw on tag creation errors - tag might already exist
      log.debug(`Tag creation note: ${tagName}`, error.message);
      return null;
    }
  }

  async applyTagByName(email, tagName) {
    try {
      // Get tag ID first
      const tags = await this.listTags();
      const tag = tags.find(t => t.name === tagName);
      
      if (!tag) {
        // Create tag if it doesn't exist
        const newTag = await this.createTag(tagName);
        if (newTag) {
          return await this.applyTag(email, newTag.id);
        }
        throw new Error(`Could not create or find tag: ${tagName}`);
      }
      
      return await this.applyTag(email, tag.id);
    } catch (error) {
      log.error(`Apply tag by name failed: ${tagName} for ${email}`, error.message);
      throw error;
    }
  }

  async applyTag(email, tagId) {
    try {
      const response = await fetch(`${KIT_API_BASE}/tags/${tagId}/subscribers`, {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify({
          email_address: email
        })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(`Tag application failed: ${data.error}`);
      }
      
      return data.data;
    } catch (error) {
      log.error(`Tag application failed: ${email} -> ${tagId}`, error.message);
      throw error;
    }
  }

  async listTags() {
    try {
      const response = await fetch(`${KIT_API_BASE}/tags`, {
        headers: this.headers
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(`List tags failed: ${data.error}`);
      }
      
      return data.data || [];
    } catch (error) {
      log.error('List tags failed:', error.message);
      return [];
    }
  }

  async addToIntelligentSequence(email, formData, leadScore, submissionType) {
    // Determine best sequence based on lead profile
    let sequenceName;
    
    if (leadScore.score >= 90) {
      sequenceName = 'VIP-Immediate-Response';
    } else if (leadScore.score >= 80) {
      sequenceName = 'High-Priority-Consultation';
    } else if (leadScore.score >= 70) {
      sequenceName = 'Qualified-Lead-Nurture';
    } else if (leadScore.score >= 50) {
      sequenceName = 'Standard-Lead-Education';
    } else {
      sequenceName = 'Long-Term-Nurture-Sequence';
    }
    
    // Add service-specific suffix
    if (submissionType === 'estate-intake') {
      sequenceName += '-Estate';
    } else if (submissionType === 'business-formation') {
      sequenceName += '-Business';
    } else if (submissionType === 'brand-protection') {
      sequenceName += '-Brand';
    }
    
    try {
      // Note: In a real implementation, you would get the sequence ID
      // For now, we'll just log the intended sequence
      log.info(`Would add ${email} to sequence: ${sequenceName}`);
      
      return { sequenceName, email };
    } catch (error) {
      log.error(`Sequence assignment failed: ${email}`, error.message);
      return null;
    }
  }
}

export default IntelligentKitIntegration;