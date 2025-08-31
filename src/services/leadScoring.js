// src/services/leadScoring.js - Enhanced lead scoring for better conversion
import { config } from '../config/environment.js';
import { log } from '../utils/logger.js';

// Get appropriate Calendly link based on type and score
export function getCalendlyLink(submissionType, leadScore) {
  // High value leads get priority booking
  if (leadScore.score >= 70) {
    return config.calendlyLinks['priority'];
  }
  
  // Map intake types to appropriate Calendly links
  const typeMap = {
    'estate-intake': 'estate-planning',
    'business-formation': 'business-formation', 
    'brand-protection': 'brand-protection',
    'outside-counsel': 'outside-counsel',
    'legal-strategy-builder': 'general',
    'newsletter': 'general',
    'resource-guide': 'general'
  };
  
  return config.calendlyLinks[typeMap[submissionType]] || config.calendlyLinks['general'];
}

// Enhanced lead scoring with more intelligence for conversion
export function calculateLeadScore(formData, submissionType) {
  let score = 0;
  let scoreFactors = [];
  
  // Base scores by service type (higher for revenue-generating services)
  const baseScores = {
    'estate-intake': 45,          // Increased - high value service
    'business-formation': 55,     // Increased - recurring client potential  
    'brand-protection': 40,       // Increased - portfolio opportunities
    'outside-counsel': 50,        // Increased - ongoing relationships
    'legal-strategy-builder': 35, // Assessment leads
    'legal-risk-assessment': 40,  // Risk assessment leads (higher urgency)
    'legal-guide-download': 25,   // Educational content
    'resource-guide': 25,         // Educational content
    'newsletter': 20              // Nurture leads
  };
  
  // Legal Risk Assessment gets special treatment
  if (submissionType === 'legal-risk-assessment') {
    const riskScore = parseInt(formData.overallRiskScore) || 0;
    // Invert risk score for lead scoring (higher risk = higher lead score)
    score = Math.max(30, 100 - (riskScore * 2)); // Convert 0-30 risk to 40-100 lead score
    scoreFactors.push(`Risk Assessment Score: +${score} (Risk: ${riskScore})`);
    
    // Bonus for high-risk cases (more urgent)
    if (riskScore > 20) {
      score += 30;
      scoreFactors.push('High Risk Priority: +30');
    } else if (riskScore > 12) {
      score += 15;
      scoreFactors.push('Medium Risk: +15');
    }
  }
  // Legal Strategy Builder gets special treatment
  else if (submissionType === 'legal-strategy-builder') {
    score = parseInt(formData.assessmentScore) || 0;
    scoreFactors.push(`Frontend Assessment Score: +${score}`);
    
    if (formData.fromAssessment === 'true' || formData.source === 'legal-strategy-builder-conversion') {
      score += 25; // Increased bonus for assessment completion
      scoreFactors.push('Strategy Builder conversion: +25');
    }
  } else {
    score += baseScores[submissionType] || 30;
    scoreFactors.push(`Base ${submissionType}: +${baseScores[submissionType] || 30}`);
  }
  
  // Estate Planning Scoring (enhanced for better targeting)
  if (submissionType === 'estate-intake') {
    const grossEstate = parseFloat(formData.grossEstate?.replace(/[,$]/g, '') || '0');
    
    // More granular estate value scoring
    if (grossEstate > 10000000) { 
      score += 60; 
      scoreFactors.push('Ultra high net worth (>$10M): +60'); 
    } else if (grossEstate > 5000000) { 
      score += 50; 
      scoreFactors.push('High net worth (>$5M): +50'); 
    } else if (grossEstate > 2000000) { 
      score += 35; 
      scoreFactors.push('Significant assets (>$2M): +35'); 
    } else if (grossEstate > 1000000) { 
      score += 25; 
      scoreFactors.push('Substantial assets (>$1M): +25'); 
    } else if (grossEstate > 500000) {
      score += 15;
      scoreFactors.push('Moderate assets (>$500K): +15');
    }
    
    if (formData.packagePreference?.toLowerCase().includes('trust')) {
      score += 35; // Increased - trust clients are higher value
      scoreFactors.push('Trust preference: +35');
    }
    
    if (formData.ownBusiness === 'Yes') { 
      score += 25; // Increased - business succession planning
      scoreFactors.push('Business owner: +25'); 
    }
    
    if (formData.otherRealEstate === 'Yes') { 
      score += 20; // Increased - complex estates
      scoreFactors.push('Multiple properties: +20'); 
    }
    
    if (formData.planningGoal === 'complex') { 
      score += 30; // Increased - higher fees
      scoreFactors.push('Complex situation: +30'); 
    }
    
    // ATHLETE-SPECIFIC SCORING
    if (formData.profession === 'athlete' || formData.careerType === 'professional_athlete' || formData.industry === 'sports') {
      score += 40;
      scoreFactors.push('Professional athlete: +40');
      
      if (formData.brandPartnerships === 'yes' || formData.brandPartnerships === true) {
        score += 20;
        scoreFactors.push('Brand partnerships: +20');
      }
    }
  }
  
  // Business Formation Scoring (enhanced for startup potential)
  if (submissionType === 'business-formation') {
    if (formData.investmentPlan === 'vc') { 
      score += 70; // Increased - these become major clients
      scoreFactors.push('VC-backed startup: +70'); 
    } else if (formData.investmentPlan === 'angel') { 
      score += 50; // Increased
      scoreFactors.push('Angel funding: +50'); 
    }
    
    const revenue = formData.projectedRevenue || '';
    if (revenue.includes('over25m')) { 
      score += 60; // Increased
      scoreFactors.push('High revenue projection: +60'); 
    } else if (revenue.includes('5m-25m')) { 
      score += 45; // Increased
      scoreFactors.push('Significant revenue: +45'); 
    }
    
    if (formData.businessGoal === 'startup') { 
      score += 25; // Increased
      scoreFactors.push('High-growth startup: +25'); 
    }
    
    if (formData.selectedPackage === 'gold') { 
      score += 30; // Increased
      scoreFactors.push('Premium package: +30'); 
    }
  }
  
  // Brand Protection Scoring (Enhanced for Creators)
  if (submissionType === 'brand-protection') {
    if (formData.servicePreference?.includes('Portfolio') || formData.servicePreference?.includes('7500')) {
      score += 50; // Increased - portfolio clients are valuable
      scoreFactors.push('Comprehensive portfolio: +50');
    }
    
    if (formData.businessStage === 'Mature (5+ years)') { 
      score += 25; // Increased
      scoreFactors.push('Established business: +25'); 
    }
    
    if (formData.protectionGoal === 'enforcement') { 
      score += 40; // Increased - enforcement is high-value
      scoreFactors.push('Enforcement need: +40'); 
    }
    
    // CREATOR-SPECIFIC SCORING
    const socialFollowing = parseInt(formData.socialFollowing?.replace(/[,]/g, '') || '0');
    if (socialFollowing > 2000000) {
      score += 60;
      scoreFactors.push('Major creator (2M+ followers): +60');
    } else if (socialFollowing > 1000000) {
      score += 50;
      scoreFactors.push('Large creator (1M+ followers): +50');
    } else if (socialFollowing > 500000) {
      score += 30;
      scoreFactors.push('Mid-tier creator (500K+ followers): +30');
    }
    
    const businessRevenue = parseInt(formData.businessRevenue?.replace(/[,]/g, '') || '0');
    if (businessRevenue > 2000000) {
      score += 50;
      scoreFactors.push('High revenue creator ($2M+): +50');
    } else if (businessRevenue > 1000000) {
      score += 40;
      scoreFactors.push('Successful creator ($1M+): +40');
    } else if (businessRevenue > 500000) {
      score += 25;
      scoreFactors.push('Monetizing creator ($500K+): +25');
    }
    
    if (formData.businessType === 'creator' || formData.revenueStreams?.includes('brand_partnerships')) {
      score += 20;
      scoreFactors.push('Creator business model: +20');
    }
  }
  
  // Outside Counsel Scoring  
  if (submissionType === 'outside-counsel') {
    if (formData.budget?.includes('10K+')) { 
      score += 50; // Increased
      scoreFactors.push('High budget (>$10K): +50'); 
    } else if (formData.budget?.includes('5K-10K')) { 
      score += 30; // Increased
      scoreFactors.push('Substantial budget: +30'); 
    }
    
    if (formData.timeline === 'Immediately') { 
      score += 35; // Increased - urgency premium
      scoreFactors.push('Immediate need: +35'); 
    }
  }
  
  // Universal scoring factors (enhanced)
  if (formData.urgency?.includes('Immediate') || formData.urgency?.includes('urgent')) {
    score += 45; // Increased - urgent clients convert better
    scoreFactors.push('Urgent timeline: +45');
  }
  
  // Business email bonus (indicates seriousness)
  const email = formData.email || '';
  if (email && !email.includes('@gmail.com') && !email.includes('@yahoo.com') && !email.includes('@hotmail.com')) {
    score += 15; // Increased
    scoreFactors.push('Business email: +15');
  }
  
  // Phone number provided (indicates engagement)
  if (formData.phone && formData.phone.length > 5) {
    score += 10;
    scoreFactors.push('Phone provided: +10');
  }
  
  // Company/business name provided
  if (formData.businessName || formData.companyName) {
    score += 10;
    scoreFactors.push('Business name provided: +10');
  }
  
  const finalScore = Math.min(score, 100);
  
  // Log lead score for analytics
  log.info('Lead scored', {
    email: formData.email,
    submissionType,
    score: finalScore,
    factors: scoreFactors.length
  });
  
  return { 
    score: finalScore, 
    factors: scoreFactors,
    priority: finalScore >= 70 ? 'HIGH' : finalScore >= 50 ? 'MEDIUM' : 'STANDARD'
  };
}