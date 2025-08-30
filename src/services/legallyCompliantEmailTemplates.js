// Legally Compliant Email Templates for Law Firm
// All content reviewed for legal compliance and appropriate disclaimers

// Strategic Email Personalization System
// Contextual emails based on client profile and form responses

// Client profile identification
function identifyClientProfile(formData = {}) {
  // Athletes
  if (formData.profession?.includes('athlete') || formData.industry === 'sports' || 
      formData.careerType === 'professional_athlete') {
    return 'athlete';
  }
  
  // Creators/Influencers
  if (formData.industry?.includes('content') || formData.businessType?.includes('creator') || 
      formData.revenueStreams?.includes('brand_partnerships') || formData.socialFollowing > 100000) {
    return 'creator';
  }
  
  // High-performing families
  if (formData.estateValue > 10000000 || formData.familyOffice || 
      formData.generationalWealth || formData.familyComplexity === 'high') {
    return 'high_performing_family';
  }
  
  // Startups
  if (formData.businessStage === 'startup' || formData.fundingStage || 
      formData.growthPlans?.includes('venture_capital') || formData.businessAge < 5) {
    return 'startup';
  }

  return 'strategic_business_owner';
}

// Practice area needs analysis
function analyzePracticeAreaNeeds(formData = {}) {
  const needs = [];
  
  // Business needs
  if (formData.businessFormation || formData.entityStructure || formData.contractNeeds) {
    needs.push('business');
  }
  
  // Brand/IP needs
  if (formData.hasIntellectualProperty || formData.brandProtection || formData.trademarkNeeds) {
    needs.push('brand');
  }
  
  // Wealth protection needs
  if (formData.estateValue > 1000000 || formData.assetProtection || formData.taxPlanning) {
    needs.push('wealth');
  }
  
  // Outside counsel needs
  if (formData.businessRevenue > 500000 || formData.ongoingLegal || formData.generalCounselNeeds) {
    needs.push('outside_counsel');
  }
  
  return needs;
}

// Sophistication assessment
function assessClientSophistication(formData = {}) {
  let score = 0;
  
  if (formData.businessRevenue > 1000000) score += 2;
  if (formData.estateValue > 5000000) score += 2;
  if (formData.hasLegalCounsel) score += 1;
  if (formData.industryExperience === 'expert') score += 1;
  if (formData.legalComplexity === 'high') score += 1;
  
  return score >= 5 ? 'high' : score >= 3 ? 'medium' : 'standard';
}

// Helper function to map submission types to practice area names
function getPracticeAreaName(submissionType) {
  const practiceAreas = {
    'estate-intake': 'estate planning and asset protection',
    'business-formation': 'business formation and corporate strategy',
    'brand-protection': 'intellectual property and brand protection',
    'outside-counsel': 'general counsel and strategic legal support',
    'wealth-protection': 'wealth management and asset protection',
    'legal-strategy-builder': 'comprehensive legal strategy and planning',
    'newsletter': 'strategic legal insights and education',
    'resource-guide': 'strategic legal resource implementation',
    'add-subscriber': 'strategic legal counsel and guidance',
    'business-guide-download': 'business legal strategy and planning',
    'brand-guide-download': 'intellectual property and brand protection',
    'estate-guide-download': 'estate planning and wealth protection'
  };
  return practiceAreas[submissionType] || 'strategic legal counsel';
}

// Brand-aligned strategic content generators - SHORT & PUNCHY
function generateStrategicOpening(clientProfile, practiceAreaNeeds, formData) {
  const firstName = formData.firstName || formData.fullName?.split(' ')[0] || 'there';
  
  // Parse numeric values properly
  const grossEstate = parseFloat(formData.grossEstate?.replace(/[,$]/g, '') || '0');
  const businessRevenue = parseFloat(formData.businessRevenue?.replace(/[,$]/g, '') || '0');
  const socialFollowing = parseInt(formData.socialFollowing?.replace(/[,]/g, '') || '0');
  
  const estateValue = grossEstate > 0 ? `$${(grossEstate/1000000).toFixed(1)}M` : '';
  const revenue = businessRevenue > 0 ? `$${(businessRevenue/1000000).toFixed(1)}M` : '';
  const following = socialFollowing > 0 ? `${(socialFollowing/1000000).toFixed(1)}M` : '';
  
  // Athletes - Career-focused legal strategy
  if (clientProfile === 'athlete') {
    if (grossEstate > 5000000) {
      return `${firstName}, with ${estateValue} in assets, you need legal structures designed for high-value estates and career earnings. Athletic careers have unique challenges that require specialized planning.`;
    }
    return `${firstName}, your athletic career creates unique legal opportunities and challenges. The right legal foundation protects your current earnings and sets up your post-career success.`;
  }

  // Creators - Content and IP protection
  if (clientProfile === 'creator') {
    if (socialFollowing > 1000000) {
      return `${firstName}, with ${following} followers, you've built significant audience value. Your content, brand, and partnerships need proper legal protection to secure your business foundation.`;
    }
    if (businessRevenue > 500000) {
      return `${firstName}, generating ${revenue} in revenue means you're running a serious business. Time to structure it like one - with proper IP protection, business entity, and strategic partnerships.`;
    }
    return `${firstName}, your content creates value and your audience is an asset. Both deserve legal protection that grows with your creator business.`;
  }

  // High-performing families - Multi-generational planning
  if (clientProfile === 'high_performing_family') {
    if (grossEstate > 10000000) {
      return `${firstName}, managing ${estateValue} requires sophisticated planning beyond basic estate work. Multi-generational wealth needs strategic legal architecture designed for family legacy.`;
    }
    return `${firstName}, high-performing families benefit from comprehensive legal strategies that coordinate wealth preservation, tax planning, and family governance for long-term success.`;
  }

  // Startups - Growth-focused legal foundation
  if (clientProfile === 'startup') {
    if (formData.fundingStage || formData.growthPlans?.includes('venture_capital')) {
      return `${firstName}, preparing for investment means having clean legal foundations. Investors evaluate your legal structure as carefully as your business model.`;
    }
    if (formData.businessRevenue && formData.businessRevenue > 1000000) {
      return `${firstName}, ${revenue} in revenue signals it's time for growth-stage legal structures. Scale requires solid IP protection, proper governance, and strategic risk management.`;
    }
    return `${firstName}, startup success requires legal foundations built for rapid scaling. The right structure supports growth while protecting your innovations and equity.`;
  }

  // Strategic business owner default
  return `${firstName}, smart business owners build strong legal foundations early. Strategic legal planning protects your assets and enables confident growth.`;
}

function generateStrategicInsights(clientProfile, practiceAreaNeeds, formData) {
  const insights = [];

  // Athlete-specific insights
  if (clientProfile === 'athlete') {
    insights.push(`Professional athletes benefit from legal structures that bridge competitive careers with post-athletic business ventures, including brand licensing, coaching businesses, and strategic investment opportunities that leverage athletic success.`);
    
    if (practiceAreaNeeds.includes('brand')) {
      insights.push(`Athletic success creates valuable image rights and endorsement opportunities that require sophisticated IP protection and contract negotiation to maximize both immediate and long-term value across multiple revenue streams.`);
    }
  }

  // Creator-specific insights
  if (clientProfile === 'creator') {
    insights.push(`Content creators operating across platforms need comprehensive IP strategies that protect creative works while enabling strategic licensing, brand partnership optimization, and audience monetization that scales with business growth.`);
    
    if (practiceAreaNeeds.includes('business')) {
      insights.push(`Successful creators building sustainable businesses require legal frameworks that support team expansion, strategic partnerships, brand collaborations, and potential acquisition opportunities while maintaining creative control.`);
    }
  }

  // Family-specific insights
  if (clientProfile === 'high_performing_family') {
    insights.push(`High-performing families require coordination between wealth preservation, business succession, and family governance that serves both current generation objectives and multi-generational wealth transfer goals.`);
    
    if (practiceAreaNeeds.includes('business')) {
      insights.push(`Family businesses benefit from structures that separate business operations from family wealth while creating frameworks for succession planning, conflict resolution, and strategic decision-making across generations.`);
    }
  }

  // Startup-specific insights
  if (clientProfile === 'startup') {
    insights.push(`High-growth startups require legal architecture that satisfies investor requirements while preserving founder control and enabling rapid scaling through strategic partnerships, team expansion, and market development.`);
    
    if (practiceAreaNeeds.includes('outside_counsel')) {
      insights.push(`Venture-backed companies benefit from strategic general counsel relationships that provide ongoing legal support for rapid decision-making, contract negotiation, and strategic initiatives that support aggressive growth timelines.`);
    }
  }

  return insights;
}

function generateTailoredCTA(clientProfile, formData) {
  if (clientProfile === 'athlete') {
    return {
      text: 'Get Your Wealth Protection Strategy',
      url: 'https://calendly.com/jacobscounsel/athlete-consultation',
      urgency: 'Champions secure their legacy'
    };
  }

  if (clientProfile === 'creator') {
    return {
      text: 'Bulletproof Your Creator Business', 
      url: 'https://calendly.com/jacobscounsel/creator-consultation',
      urgency: 'Smart creators protect their empire'
    };
  }

  if (clientProfile === 'startup') {
    return {
      text: 'Make Your Startup Investor-Ready',
      url: 'https://calendly.com/jacobscounsel/startup-consultation', 
      urgency: 'Scaling companies need legal foundations'
    };
  }

  if (clientProfile === 'high_performing_family') {
    return {
      text: 'Build Your Legacy Architecture',
      url: 'https://calendly.com/jacobscounsel/family-consultation',
      urgency: 'Generational wealth requires strategic planning'
    };
  }

  return {
    text: 'Get Your Legal Foundation Right',
    url: 'https://calendly.com/jacobscounsel/strategic-consultation',
    urgency: 'Smart business owners plan ahead'
  };
}

// Generate contextual content based on template type and client profile
function generateContextualContent(templateType, clientProfile, practiceAreaNeeds, formData) {
  const strategicOpening = generateStrategicOpening(clientProfile, practiceAreaNeeds, formData);
  const strategicInsights = generateStrategicInsights(clientProfile, practiceAreaNeeds, formData);
  
  // Template-specific content generation
  let contextualEducation = '';
  let prioritizedApproach = '';
  let strategicAdvice = '';
  let nextSteps = '';
  let topicArea = '';

  // Educational templates
  if (templateType.includes('education')) {
    if (clientProfile === 'startup' && practiceAreaNeeds.includes('business')) {
      contextualEducation = 'Venture-backed startups require legal frameworks that satisfy investor due diligence while preserving founder flexibility and enabling rapid scaling through strategic partnerships and market expansion.';
      topicArea = 'Startup Legal Architecture';
    } else if (clientProfile === 'athlete' && practiceAreaNeeds.includes('wealth')) {
      contextualEducation = 'Professional athletes benefit from compressed-timeline wealth strategies that maximize earning potential while building post-career financial security through diversified investment and business development.';
      topicArea = 'Athletic Wealth Management';
    } else if (clientProfile === 'creator' && practiceAreaNeeds.includes('brand')) {
      contextualEducation = 'Content creators building sustainable businesses need multi-platform IP strategies that protect creative assets while optimizing monetization across diverse revenue streams and partnership opportunities.';
      topicArea = 'Creator Business Strategy';
    } else {
      contextualEducation = strategicInsights[0] || 'Strategic legal planning requires understanding how legal frameworks can serve as business assets rather than compliance burdens, creating competitive advantages through sophisticated risk management and opportunity optimization.';
      topicArea = getPracticeAreaName(formData.submissionType || '') || 'Strategic Legal Planning';
    }
  }

  // Consultation reminders
  if (templateType.includes('consultation')) {
    if (clientProfile === 'startup') {
      nextSteps = 'Our startup-focused consultation will address investment readiness, IP strategy, team scaling legal frameworks, and potential exit planning to ensure your legal architecture supports aggressive growth objectives.';
    } else if (clientProfile === 'athlete') {
      nextSteps = 'Our athletic career consultation will focus on asset protection during peak earnings, brand monetization strategies, and post-career business transition planning to maximize both current and long-term financial outcomes.';
    } else if (clientProfile === 'creator') {
      nextSteps = 'Our creator business consultation will examine multi-platform IP protection, brand partnership optimization, audience monetization strategies, and business scaling frameworks that preserve creative control.';
    } else {
      nextSteps = 'Our strategic consultation will provide comprehensive analysis of your legal landscape, identification of optimization opportunities, and development of integrated approaches that serve your specific objectives.';
    }
  }

  // Re-engagement emails
  if (templateType.includes('engagement')) {
    if (clientProfile === 'startup') {
      strategicAdvice = 'Market timing and legal readiness often align in ways that create significant competitive advantages. Startups that establish sophisticated legal frameworks early can move faster when opportunities arise.';
    } else if (clientProfile === 'athlete') {
      strategicAdvice = 'Athletic careers have compressed timelines that make strategic legal planning particularly valuable. The intersection of peak earnings and strategic planning can create generational wealth outcomes.';
    } else {
      strategicAdvice = 'Strategic legal planning becomes increasingly valuable as business complexity grows. Early framework development often provides exponentially greater benefits than reactive legal responses.';
    }
  }

  // Newsletter content
  if (templateType.includes('newsletter')) {
    if (clientProfile === 'high_performing_family') {
      prioritizedApproach = 'High-performing families benefit from integrated approaches that coordinate business succession, wealth transfer, and family governance to preserve and enhance multi-generational objectives.';
    } else if (clientProfile === 'startup') {
      prioritizedApproach = 'High-growth companies require legal strategies that anticipate scaling challenges, investor requirements, and market expansion while preserving founder vision and control.';
    } else {
      prioritizedApproach = 'Strategic legal approaches focus on creating frameworks that serve as business assets, providing competitive advantages through sophisticated risk management and opportunity optimization.';
    }
  }

  return {
    strategicOpening: strategicOpening,
    strategicInsight: strategicInsights[0] || 'Strategic legal counsel creates frameworks that serve as competitive advantages rather than compliance burdens, enabling sophisticated risk management and strategic opportunity optimization.',
    contextualEducation: contextualEducation,
    prioritizedApproach: prioritizedApproach,
    strategicAdvice: strategicAdvice,
    nextSteps: nextSteps,
    topicArea: topicArea
  };
}

export const legalEmailTemplates = {
  // Strategic VIP Welcome - Dynamically Generated
  vip_welcome: `
    <h1 style="color: #000000 !important;">{{firstName}}, Let's Build Something That Lasts</h1>
    
    <p style="color: #000000 !important;">{{strategicOpening}}</p>
    
    <div style="background-color: #f0f9ff !important; border: 2px solid #3b82f6 !important; border-radius: 8px !important; padding: 20px !important; margin: 20px 0 !important;">
      <h3 style="color: #1d4ed8 !important; font-size: 18px !important; font-weight: bold !important; margin: 0 0 10px !important;">Strategic Legal Framework</h3>
      <p style="color: #1e40af !important; margin: 0 !important;">{{strategicInsight}}</p>
    </div>
    
    <p style="color: #000000 !important;"><strong style="color: #ff4d00 !important;">Our strategic consultation will address:</strong></p>
    <ul style="color: #000000 !important;">
      <li style="color: #000000 !important;"><strong style="color: #ff4d00 !important;">Comprehensive Assessment</strong> - Understanding your unique position and strategic objectives</li>
      <li style="color: #000000 !important;"><strong style="color: #ff4d00 !important;">Integrated Legal Strategy</strong> - Coordinating business, brand, and wealth protection priorities</li>
      <li style="color: #000000 !important;"><strong style="color: #ff4d00 !important;">Implementation Framework</strong> - Developing actionable approaches tailored to your situation</li>
    </ul>
    
    <p style="color: #000000 !important;"><strong>Here's what we'll accomplish in your consultation:</strong> We'll identify your biggest legal risks, create a strategic protection plan, and give you a clear roadmap for implementation.</p>
    
    <a href="{{ctaUrl}}" class="cta-button" style="background-color: #2563eb !important; color: #ffffff !important; padding: 16px 32px !important; text-decoration: none !important; border-radius: 8px !important; font-weight: bold !important; display: inline-block !important; margin: 20px 0 !important; text-align: center !important; min-width: 200px !important;">
      {{ctaText}}
    </a>
    
    <p style="color: #000000 !important;">Ready to get started? Book your consultation now and we'll have a strategic plan in place within 30 days.</p>
    
    <p style="color: #000000 !important;">Best regards,<br>
    <strong style="color: #ff4d00 !important;">Drew Jacobs, Esq.</strong><br>
    Founder & Managing Attorney<br>
    Jacobs Counsel LLC</p>
  `,
  
  // Strategic Premium Welcome - Dynamically Generated
  premium_welcome: `
    <h1 style="color: #1f2937 !important; font-size: 28px !important; font-weight: bold !important; margin: 20px 0 !important;">{{firstName}}, Time to Level Up Your Legal Game</h1>
    
    <p>{{strategicOpening}}</p>
    
    <div style="background-color: #f0f9ff !important; border: 2px solid #3b82f6 !important; border-radius: 8px !important; padding: 20px !important; margin: 20px 0 !important;">
      <h3 style="color: #1d4ed8 !important; font-size: 18px !important; font-weight: bold !important; margin: 0 0 10px !important;">Strategic Legal Counsel</h3>
      <p>{{strategicInsight}}</p>
    </div>
    
    <p>Over the next few days, you'll receive targeted insights about your specific legal landscape that can help inform your strategic decision-making process. This educational content is designed to help you think strategically about opportunities and challenges ahead.</p>
    
    <a href="{{ctaUrl}}" class="cta-button" style="background-color: #2563eb !important; color: #ffffff !important; padding: 16px 32px !important; text-decoration: none !important; border-radius: 8px !important; font-weight: bold !important; display: inline-block !important; margin: 20px 0 !important; text-align: center !important; min-width: 200px !important;">
      {{ctaText}}
    </a>
    
    <p><strong>Next step:</strong> Schedule your consultation and we'll create a custom legal strategy that protects your interests and accelerates your goals.</p>
    
    <p>Best regards,<br>
    <strong>Drew Jacobs, Esq.</strong><br>
    Jacobs Counsel LLC</p>
  `,
  
  // VIP Strategy Email - Focus on Process, Not Outcomes
  vip_strategy: `
    <h1 style="color: #1f2937 !important; font-size: 28px !important; font-weight: bold !important; margin: 20px 0 !important;">Preparing for Your Strategic Legal Consultation</h1>
    
    <p>{{firstName}}, thank you for scheduling your consultation with our firm. We're looking forward to learning more about your situation and how we might be able to assist you.</p>
    
    <div style="background-color: #f0f9ff !important; border: 2px solid #3b82f6 !important; border-radius: 8px !important; padding: 20px !important; margin: 20px 0 !important;">
      <h3 style="color: #1d4ed8 !important; font-size: 18px !important; font-weight: bold !important; margin: 0 0 10px !important;">About Our Consultation Process</h3>
      <p>Our consultations are designed to be informational and educational. We'll discuss your situation, explore potential legal considerations, and help you understand your options.</p>
    </div>
    
    <p><strong>To make the most of our time together, please consider:</strong></p>
    <ul>
      <li>Your primary legal concerns or objectives</li>
      <li>Any specific questions you'd like to discuss</li>
      <li>Your timeline for addressing these matters</li>
      <li>Any relevant documents or background information</li>
    </ul>
    
    <p>Please remember: Until we establish a formal attorney-client relationship through a signed engagement agreement, our discussions are for informational purposes only.</p>
    
    <a href="https://calendly.com/jacobscounsel/priority-consultation" class="cta-button" style="background-color: #2563eb !important; color: #ffffff !important; padding: 16px 32px !important; text-decoration: none !important; border-radius: 8px !important; font-weight: bold !important; display: inline-block !important; margin: 20px 0 !important; text-align: center !important; min-width: 200px !important;">
      View Your Scheduled Consultation →
    </a>
    
    <p>We appreciate your interest in our services.</p>
    
    <p><strong>Drew Jacobs, Esq.</strong><br>
    Jacobs Counsel LLC</p>
  `,
  
  // Premium Welcome Email - Educational Focus
  premium_welcome: `
    <h1 style="color: #1f2937 !important; font-size: 28px !important; font-weight: bold !important; margin: 20px 0 !important;">{{firstName}}, Smart Move Getting Your Legal House in Order</h1>
    
    <p>Your {{practiceArea}} inquiry tells me you're thinking ahead. That's exactly the kind of forward-planning that separates successful people from everyone else who waits until there's a crisis.</p>
    
    <div style="background-color: #f0f9ff !important; border: 2px solid #3b82f6 !important; border-radius: 8px !important; padding: 20px !important; margin: 20px 0 !important;">
      <h3 style="color: #1d4ed8 !important; font-size: 18px !important; font-weight: bold !important; margin: 0 0 10px !important;">Strategic Legal Counsel</h3>
      <p>We approach {{practiceArea}} with the same methodical strategy we bring to all complex legal matters. Our goal is to help you understand not just what's possible, but what's strategically advantageous for your specific situation.</p>
    </div>
    
    <p>Over the next few days, you'll receive targeted insights about {{practiceArea}} that can help inform your decision-making process. This educational content is designed to help you think strategically about your legal landscape.</p>
    
    <a href="https://calendly.com/jacobscounsel/priority-consultation" class="cta-button" style="background-color: #2563eb !important; color: #ffffff !important; padding: 16px 32px !important; text-decoration: none !important; border-radius: 8px !important; font-weight: bold !important; display: inline-block !important; margin: 20px 0 !important; text-align: center !important; min-width: 200px !important;">
      Schedule Your Strategic Consultation
    </a>
    
    <p><strong>Ready to move fast?</strong> Book your consultation and we'll have your {{practiceArea}} strategy mapped out and ready to execute.</p>
    
    <p>Best regards,<br>
    <strong>Drew Jacobs, Esq.</strong><br>
    Jacobs Counsel LLC</p>
  `,

  // Standard Welcome Email
  standard_welcome: `
    <h1 style="color: #1f2937 !important; font-size: 28px !important; font-weight: bold !important; margin: 20px 0 !important;">{{firstName}}, Let's Get Your Legal Foundation Right</h1>
    
    <p>Great timing on your {{practiceArea}} inquiry. Most people wait too long to get their legal structure in place, then scramble when they need it most.</p>
    
    <p>We specialize in {{practiceArea}} for people who are building something important - whether that's a business, protecting wealth, or creating a legacy. The legal work should support your goals, not slow them down.</p>
    
    <div style="background-color: #f0f9ff !important; border: 2px solid #3b82f6 !important; border-radius: 8px !important; padding: 20px !important; margin: 20px 0 !important;">
      <h3 style="color: #1d4ed8 !important; font-size: 18px !important; font-weight: bold !important; margin: 0 0 10px !important;">Strategic Legal Consultation</h3>
      <p><strong>Here's the deal:</strong> We'll analyze your {{practiceArea}} situation, identify the gaps that could cost you later, and build a plan that actually works for how you operate.</p>
    </div>
    
    <p>During a consultation, we can:</p>
    <ul>
      <li>Discuss your legal needs and objectives</li>
      <li>Explain our services and approach</li>
      <li>Provide information about our fee structure</li>
      <li>Determine if we're a good fit for your needs</li>
    </ul>
    
    <a href="https://calendly.com/jacobscounsel/priority-consultation" class="cta-button" style="background-color: #2563eb !important; color: #ffffff !important; padding: 16px 32px !important; text-decoration: none !important; border-radius: 8px !important; font-weight: bold !important; display: inline-block !important; margin: 20px 0 !important; text-align: center !important; min-width: 200px !important;">
      Schedule Your Consultation →
    </a>
    
    <p>Thank you for considering Jacobs Counsel for your legal needs.</p>
    
    <p>Sincerely,<br>
    <strong>Drew Jacobs, Esq.</strong><br>
    Jacobs Counsel LLC</p>
  `,

  // ATHLETE-SPECIFIC EMAIL SEQUENCES
  athlete_email_2: `
    <h1 style="color: #1f2937 !important; font-size: 28px !important; font-weight: bold !important; margin: 20px 0 !important;">Protecting Athletic Career Value</h1>
    
    <p>{{firstName}}, your athletic career creates unique wealth that needs specialized protection strategies.</p>
    
    <div style="background-color: #f0f9ff !important; border: 2px solid #3b82f6 !important; border-radius: 8px !important; padding: 20px !important; margin: 20px 0 !important;">
      <h3 style="color: #1d4ed8 !important; font-size: 18px !important; font-weight: bold !important; margin: 0 0 10px !important;">Career Earnings vs. Lifetime Wealth</h3>
      <p>Athletic careers generate concentrated wealth in compressed timeframes. Smart athletes build legal structures that protect current earnings while creating post-career financial security.</p>
    </div>
    
    <p><strong>Key considerations for professional athletes:</strong></p>
    <ul>
      <li>Asset protection during peak earning years</li>
      <li>Contract optimization and brand partnerships</li>
      <li>Tax-efficient wealth preservation strategies</li>
      <li>Post-career business and investment structure</li>
    </ul>
    
    <p>Every month without proper legal structure is earnings at risk. Champions protect their legacy both on and off the field.</p>
    
    <a href="{{ctaUrl}}" class="cta-button" style="background-color: #2563eb !important; color: #ffffff !important; padding: 16px 32px !important; text-decoration: none !important; border-radius: 8px !important; font-weight: bold !important; display: inline-block !important; margin: 20px 0 !important; text-align: center !important; min-width: 200px !important;">
      {{ctaText}}
    </a>
    
    <p>Best regards,<br>
    <strong>Drew Jacobs, Esq.</strong><br>
    Jacobs Counsel LLC</p>
  `,

  athlete_email_3: `
    <h1 style="color: #1f2937 !important; font-size: 28px !important; font-weight: bold !important; margin: 20px 0 !important;">Building Your Athletic Legacy</h1>
    
    <p>{{firstName}}, the decisions you make today about wealth structure determine your financial future long after your playing days end.</p>
    
    <div style="background-color: #f0f9ff !important; border: 2px solid #3b82f6 !important; border-radius: 8px !important; padding: 20px !important; margin: 20px 0 !important;">
      <h3 style="color: #1d4ed8 !important; font-size: 18px !important; font-weight: bold !important; margin: 0 0 10px !important;">Beyond the Game</h3>
      <p>Athletic success on the field requires the same strategic thinking for wealth protection off the field. Business ventures, endorsements, and investments all need proper legal foundations.</p>
    </div>
    
    <p><strong>Strategic wealth building for athletes includes:</strong></p>
    <ul>
      <li>Business entity selection for endorsements and ventures</li>
      <li>Estate planning that grows with your career</li>
      <li>Family protection and generational wealth planning</li>
      <li>Exit strategy planning for post-career transitions</li>
    </ul>
    
    <p>Your athletic discipline applies to wealth building - consistent, strategic action creates lasting results.</p>
    
    <a href="{{ctaUrl}}" class="cta-button" style="background-color: #2563eb !important; color: #ffffff !important; padding: 16px 32px !important; text-decoration: none !important; border-radius: 8px !important; font-weight: bold !important; display: inline-block !important; margin: 20px 0 !important; text-align: center !important; min-width: 200px !important;">
      {{ctaText}}
    </a>
    
    <p>Best regards,<br>
    <strong>Drew Jacobs, Esq.</strong><br>
    Jacobs Counsel LLC</p>
  `,

  // CREATOR-SPECIFIC EMAIL SEQUENCES  
  creator_email_2: `
    <h1 style="color: #1f2937 !important; font-size: 28px !important; font-weight: bold !important; margin: 20px 0 !important;">Your Content Has Real Business Value</h1>
    
    <p>{{firstName}}, every piece of content you create is intellectual property. Every brand partnership is a business transaction. Time to protect them like the valuable assets they are.</p>
    
    <div style="background-color: #f0f9ff !important; border: 2px solid #3b82f6 !important; border-radius: 8px !important; padding: 20px !important; margin: 20px 0 !important;">
      <h3 style="color: #1d4ed8 !important; font-size: 18px !important; font-weight: bold !important; margin: 0 0 10px !important;">Creator Economy Reality</h3>
      <p>Successful creators aren't just making content - they're building media companies. Your audience, content library, and brand partnerships represent significant business value that needs legal protection.</p>
    </div>
    
    <p><strong>Smart creators protect:</strong></p>
    <ul>
      <li>Content ownership and licensing rights</li>
      <li>Brand partnership terms and revenue optimization</li>
      <li>Audience data and platform independence</li>
      <li>Business structure for scaling and investment</li>
    </ul>
    
    <p>Platform changes happen overnight. Smart creators build businesses that survive algorithm updates and platform shifts.</p>
    
    <a href="{{ctaUrl}}" class="cta-button" style="background-color: #2563eb !important; color: #ffffff !important; padding: 16px 32px !important; text-decoration: none !important; border-radius: 8px !important; font-weight: bold !important; display: inline-block !important; margin: 20px 0 !important; text-align: center !important; min-width: 200px !important;">
      {{ctaText}}
    </a>
    
    <p>Best regards,<br>
    <strong>Drew Jacobs, Esq.</strong><br>
    Jacobs Counsel LLC</p>
  `,

  creator_email_3: `
    <h1 style="color: #1f2937 !important; font-size: 28px !important; font-weight: bold !important; margin: 20px 0 !important;">Scale Your Creator Business Strategically</h1>
    
    <p>{{firstName}}, growing a creator business means moving from content creator to business owner. That transition requires legal structure that supports scaling.</p>
    
    <div style="background-color: #f0f9ff !important; border: 2px solid #3b82f6 !important; border-radius: 8px !important; padding: 20px !important; margin: 20px 0 !important;">
      <h3 style="color: #1d4ed8 !important; font-size: 18px !important; font-weight: bold !important; margin: 0 0 10px !important;">Beyond Brand Deals</h3>
      <p>Creator businesses that scale successfully have strong legal foundations: protected IP, optimized business structures, and strategic partnership frameworks that preserve creative control while enabling growth.</p>
    </div>
    
    <p><strong>Scaling creators need:</strong></p>
    <ul>
      <li>Business entities that support team building and investment</li>
      <li>IP strategies for product development and licensing</li>
      <li>Revenue diversification and tax optimization</li>
      <li>Partnership agreements that maintain creative control</li>
    </ul>
    
    <p>The creators who build lasting businesses think beyond the next viral post - they build legal architecture for long-term success.</p>
    
    <a href="{{ctaUrl}}" class="cta-button" style="background-color: #2563eb !important; color: #ffffff !important; padding: 16px 32px !important; text-decoration: none !important; border-radius: 8px !important; font-weight: bold !important; display: inline-block !important; margin: 20px 0 !important; text-align: center !important; min-width: 200px !important;">
      {{ctaText}}
    </a>
    
    <p>Best regards,<br>
    <strong>Drew Jacobs, Esq.</strong><br>
    Jacobs Counsel LLC</p>
  `,

  // STARTUP-SPECIFIC EMAIL SEQUENCES
  startup_email_2: `
    <h1 style="color: #1f2937 !important; font-size: 28px !important; font-weight: bold !important; margin: 20px 0 !important;">Legal Foundation = Investment Readiness</h1>
    
    <p>{{firstName}}, investors don't just evaluate your product and market - they audit your legal structure. Clean legal foundations accelerate funding and reduce dilution.</p>
    
    <div style="background-color: #f0f9ff !important; border: 2px solid #3b82f6 !important; border-radius: 8px !important; padding: 20px !important; margin: 20px 0 !important;">
      <h3 style="color: #1d4ed8 !important; font-size: 18px !important; font-weight: bold !important; margin: 0 0 10px !important;">Investor Due Diligence</h3>
      <p>Startups with proper legal structures move faster through due diligence, negotiate from stronger positions, and avoid costly legal cleanup that delays funding or reduces valuations.</p>
    </div>
    
    <p><strong>Investment-ready startups have:</strong></p>
    <ul>
      <li>Clean cap tables with proper equity allocation</li>
      <li>Protected intellectual property portfolios</li>
      <li>Compliant employment and contractor agreements</li>
      <li>Board governance structures that support scaling</li>
    </ul>
    
    <p>Every legal issue discovered during due diligence becomes leverage for investors. Smart founders eliminate that leverage early.</p>
    
    <a href="{{ctaUrl}}" class="cta-button" style="background-color: #2563eb !important; color: #ffffff !important; padding: 16px 32px !important; text-decoration: none !important; border-radius: 8px !important; font-weight: bold !important; display: inline-block !important; margin: 20px 0 !important; text-align: center !important; min-width: 200px !important;">
      {{ctaText}}
    </a>
    
    <p>Best regards,<br>
    <strong>Drew Jacobs, Esq.</strong><br>
    Jacobs Counsel LLC</p>
  `,

  startup_email_3: `
    <h1 style="color: #1f2937 !important; font-size: 28px !important; font-weight: bold !important; margin: 20px 0 !important;">From Startup to Scalable Company</h1>
    
    <p>{{firstName}}, transitioning from startup to growth-stage company requires legal infrastructure that supports rapid scaling without creating operational bottlenecks.</p>
    
    <div style="background-color: #f0f9ff !important; border: 2px solid #3b82f6 !important; border-radius: 8px !important; padding: 20px !important; margin: 20px 0 !important;">
      <h3 style="color: #1d4ed8 !important; font-size: 18px !important; font-weight: bold !important; margin: 0 0 10px !important;">Growth Stage Legal Strategy</h3>
      <p>Companies that scale successfully build legal systems that grow with them - from hiring frameworks that support rapid team building to IP strategies that protect innovation while enabling partnerships.</p>
    </div>
    
    <p><strong>Scaling companies need:</strong></p>
    <ul>
      <li>Employment systems for rapid hiring and equity compensation</li>
      <li>Partnership frameworks for strategic alliances</li>
      <li>Compliance systems that scale with revenue and geography</li>
      <li>Exit readiness for M&A or public offerings</li>
    </ul>
    
    <p>The legal decisions you make at startup stage echo through every funding round, partnership, and exit opportunity.</p>
    
    <a href="{{ctaUrl}}" class="cta-button" style="background-color: #2563eb !important; color: #ffffff !important; padding: 16px 32px !important; text-decoration: none !important; border-radius: 8px !important; font-weight: bold !important; display: inline-block !important; margin: 20px 0 !important; text-align: center !important; min-width: 200px !important;">
      {{ctaText}}
    </a>
    
    <p>Best regards,<br>
    <strong>Drew Jacobs, Esq.</strong><br>
    Jacobs Counsel LLC</p>
  `,

  // FAMILY-SPECIFIC EMAIL SEQUENCES
  family_email_2: `
    <h1 style="color: #1f2937 !important; font-size: 28px !important; font-weight: bold !important; margin: 20px 0 !important;">Generational Wealth Architecture</h1>
    
    <p>{{firstName}}, building wealth that lasts across generations requires more than estate planning - it needs comprehensive legal architecture that coordinates family, business, and tax objectives.</p>
    
    <div style="background-color: #f0f9ff !important; border: 2px solid #3b82f6 !important; border-radius: 8px !important; padding: 20px !important; margin: 20px 0 !important;">
      <h3 style="color: #1d4ed8 !important; font-size: 18px !important; font-weight: bold !important; margin: 0 0 10px !important;">Multi-Generational Planning</h3>
      <p>High-performing families preserve and grow wealth through integrated strategies that address current needs while building frameworks for family legacy and governance.</p>
    </div>
    
    <p><strong>Comprehensive family wealth planning includes:</strong></p>
    <ul>
      <li>Estate planning that minimizes taxes across generations</li>
      <li>Family governance structures for decision-making</li>
      <li>Business succession planning for family enterprises</li>
      <li>Trust strategies for wealth preservation and growth</li>
    </ul>
    
    <p>Generational wealth requires generational thinking - legal structures designed to serve not just your objectives, but your family's long-term success.</p>
    
    <a href="{{ctaUrl}}" class="cta-button" style="background-color: #2563eb !important; color: #ffffff !important; padding: 16px 32px !important; text-decoration: none !important; border-radius: 8px !important; font-weight: bold !important; display: inline-block !important; margin: 20px 0 !important; text-align: center !important; min-width: 200px !important;">
      {{ctaText}}
    </a>
    
    <p>Best regards,<br>
    <strong>Drew Jacobs, Esq.</strong><br>
    Jacobs Counsel LLC</p>
  `,

  family_email_3: `
    <h1 style="color: #1f2937 !important; font-size: 28px !important; font-weight: bold !important; margin: 20px 0 !important;">Family Legacy Strategy</h1>
    
    <p>{{firstName}}, protecting and transferring significant wealth requires coordination between estate planning, business strategy, and family governance to preserve both financial and family legacy.</p>
    
    <div style="background-color: #f0f9ff !important; border: 2px solid #3b82f6 !important; border-radius: 8px !important; padding: 20px !important; margin: 20px 0 !important;">
      <h3 style="color: #1d4ed8 !important; font-size: 18px !important; font-weight: bold !important; margin: 0 0 10px !important;">Family Office Strategies</h3>
      <p>Sophisticated family wealth management integrates legal, financial, and governance strategies to preserve wealth while preparing the next generation for responsible stewardship.</p>
    </div>
    
    <p><strong>Legacy planning encompasses:</strong></p>
    <ul>
      <li>Trust structures that protect assets while enabling growth</li>
      <li>Tax strategies that minimize transfer costs</li>
      <li>Family governance for decision-making and conflict resolution</li>
      <li>Philanthropic strategies that serve family values</li>
    </ul>
    
    <p>The wealthiest families think in decades, not years. Legal structures should match that timeframe and vision.</p>
    
    <a href="{{ctaUrl}}" class="cta-button" style="background-color: #2563eb !important; color: #ffffff !important; padding: 16px 32px !important; text-decoration: none !important; border-radius: 8px !important; font-weight: bold !important; display: inline-block !important; margin: 20px 0 !important; text-align: center !important; min-width: 200px !important;">
      {{ctaText}}
    </a>
    
    <p>Best regards,<br>
    <strong>Drew Jacobs, Esq.</strong><br>
    Jacobs Counsel LLC</p>
  `,

  // Estate Planning Educational Email
  estate_planning_education: `
    <h1 style="color: #1f2937 !important; font-size: 28px !important; font-weight: bold !important; margin: 20px 0 !important;">Strategic Estate Planning: Beyond Basic Documents</h1>
    
    <p>{{firstName}}, your inquiry about estate planning suggests you understand that thoughtful planning today prevents complications tomorrow. Let's explore what sophisticated estate planning actually encompasses.</p>
    
    <div style="background-color: #f0f9ff !important; border: 2px solid #3b82f6 !important; border-radius: 8px !important; padding: 20px !important; margin: 20px 0 !important;">
      <h3 style="color: #1d4ed8 !important; font-size: 18px !important; font-weight: bold !important; margin: 0 0 10px !important;">🏠 What Is Estate Planning?</h3>
      <p>Estate planning involves creating legal documents and strategies to manage your assets during your lifetime and ensure they're distributed according to your wishes after your death.</p>
    </div>
    
    <p><strong>Common estate planning documents include:</strong></p>
    <ul>
      <li><strong>Wills</strong> - Specify how assets should be distributed</li>
      <li>🏦 <strong>Trusts</strong> - Provide for asset management and distribution</li>
      <li><strong>Health Care Directives</strong> - Address medical decision-making</li>
      <li><strong>Power of Attorney</strong> - Designate someone to handle financial matters</li>
    </ul>
    
    <p><strong>Important:</strong> Estate planning needs vary significantly based on individual circumstances, family structure, asset types, and state laws. This information is general in nature and should not be considered legal advice for your specific situation.</p>
    
    <a href="https://calendly.com/jacobscounsel/wealth-protection-consultation" class="cta-button">
      Discuss Your Estate Planning Needs →
    </a>
    
    <p>Best regards,<br>
    <strong>Drew Jacobs, Esq.</strong><br>
    Jacobs Counsel LLC</p>
  `,

  // Business Formation Educational Email
  business_formation_education: `
    <h1 style="color: #1f2937 !important; font-size: 28px !important; font-weight: bold !important; margin: 20px 0 !important;">Strategic Business Formation: Choosing Your Entity Structure</h1>
    
    <p>{{firstName}}, your business formation inquiry suggests you understand that entity selection is a strategic decision with long-term implications. Let's explore the key considerations for making this choice thoughtfully.</p>
    
    <div style="background-color: #f0f9ff !important; border: 2px solid #3b82f6 !important; border-radius: 8px !important; padding: 20px !important; margin: 20px 0 !important;">
      <h3 style="color: #1d4ed8 !important; font-size: 18px !important; font-weight: bold !important; margin: 0 0 10px !important;">Strategic Entity Selection</h3>
      <p>Your choice of business structure creates the legal framework for all future operations. The decision affects not only current tax obligations and liability exposure, but also future flexibility for growth, investment, and succession planning.</p>
    </div>
    
    <p><strong>General factors to consider include:</strong></p>
    <ul>
      <li><strong>Tax Implications</strong> - Different structures have different tax treatments</li>
      <li><strong>Liability Protection</strong> - Some structures provide personal asset protection</li>
      <li><strong>Capital Structure Flexibility</strong> - Different entities offer varying approaches to investment and ownership</li>
      <li><strong>Administrative Requirements</strong> - Compliance and reporting obligations vary</li>
    </ul>
    
    <p><strong>Important:</strong> Business formation decisions should be made based on your specific circumstances, business goals, and applicable state and federal laws. This information is educational only and not legal advice.</p>
    
    <a href="https://calendly.com/jacobscounsel/business-protection-consultation" class="cta-button">
      Discuss Your Business Formation Needs →
    </a>
    
    <p>Best regards,<br>
    <strong>Drew Jacobs, Esq.</strong><br>
    Jacobs Counsel LLC</p>
  `,

  // Brand Protection Educational Email  
  brand_protection_education: `
    <h1 style="color: #1f2937 !important; font-size: 28px !important; font-weight: bold !important; margin: 20px 0 !important;">Strategic Brand Protection: Securing Your Intellectual Assets</h1>
    
    <p>{{firstName}}, your interest in brand protection demonstrates strategic thinking about one of your business's most valuable assets. Effective intellectual property strategy goes beyond simple trademark registration.</p>
    
    <div style="background-color: #f0f9ff !important; border: 2px solid #3b82f6 !important; border-radius: 8px !important; padding: 20px !important; margin: 20px 0 !important;">
      <h3 style="color: #1d4ed8 !important; font-size: 18px !important; font-weight: bold !important; margin: 0 0 10px !important;">Comprehensive IP Strategy</h3>
      <p>Strategic brand protection creates a comprehensive framework for securing, maintaining, and enforcing your intellectual property rights. This involves not only registration but also ongoing monitoring and strategic enforcement decisions.</p>
    </div>
    
    <p><strong>Common brand protection strategies include:</strong></p>
    <ul>
      <li><strong>Trademark Registration</strong> - Protects names, logos, and slogans</li>
      <li><strong>Copyright Protection</strong> - Covers original creative works</li>
      <li><strong>Domain Name Registration</strong> - Secures relevant web addresses</li>
      <li><strong>Trade Secret Protection</strong> - Safeguards confidential business information</li>
    </ul>
    
    <p><strong>Important:</strong> Intellectual property law is complex and varies by jurisdiction. The appropriate protection strategy depends on your specific business, industry, and goals. This information is general in nature and not legal advice.</p>
    
    <a href="https://calendly.com/jacobscounsel/brand-protection-consultation" class="cta-button">
      Discuss Your Brand Protection Needs →
    </a>
    
    <p>Best regards,<br>
    <strong>Drew Jacobs, Esq.</strong><br>
    Jacobs Counsel LLC</p>
  `,

  // Legal Strategy Builder Educational Series
  legal_strategy_builder_welcome: `
    <h1 style="color: #1f2937 !important; font-size: 28px !important; font-weight: bold !important; margin: 20px 0 !important;">Your Strategic Legal Assessment Results</h1>
    
    <p>{{firstName}}, thank you for completing the Legal Strategy Builder assessment. Your responses demonstrate thoughtful consideration of your legal landscape - exactly the approach we value in strategic legal planning.</p>
    
    <div style="background-color: #f0f9ff !important; border: 2px solid #3b82f6 !important; border-radius: 8px !important; padding: 20px !important; margin: 20px 0 !important;">
      <h3 style="color: #1d4ed8 !important; font-size: 18px !important; font-weight: bold !important; margin: 0 0 10px !important;">Assessment-Based Legal Guidance</h3>
      <p>Based on your assessment responses, we can see you're thinking strategically about complex legal matters. This positions you well for comprehensive legal strategy development that addresses both immediate needs and long-term objectives.</p>
    </div>
    
    <p>Over the next few days, you'll receive targeted insights that build on your assessment responses. This educational content is designed to help you think strategically about the legal considerations most relevant to your situation.</p>
    
    <a href="https://calendly.com/jacobscounsel/priority-consultation" class="cta-button" style="background-color: #2563eb !important; color: #ffffff !important; padding: 16px 32px !important; text-decoration: none !important; border-radius: 8px !important; font-weight: bold !important; display: inline-block !important; margin: 20px 0 !important; text-align: center !important; min-width: 200px !important;">
      Schedule Your Strategic Consultation
    </a>
    
    <p><strong>Bottom line:</strong> You need legal that moves as fast as your business. Let's get it done right.</p>
    
    <p>Best regards,<br>
    <strong>Drew Jacobs, Esq.</strong><br>
    Jacobs Counsel LLC</p>
  `,

  legal_strategy_builder_followup: `
    <h1 style="color: #1f2937 !important; font-size: 28px !important; font-weight: bold !important; margin: 20px 0 !important;">Strategic Legal Implementation: Next Steps</h1>
    
    <p>{{firstName}}, having completed our Legal Strategy Builder, you now have valuable insights into your legal landscape. The next step is translating these insights into actionable legal strategy.</p>
    
    <div style="background-color: #f0f9ff !important; border: 2px solid #3b82f6 !important; border-radius: 8px !important; padding: 20px !important; margin: 20px 0 !important;">
      <h3 style="color: #1d4ed8 !important; font-size: 18px !important; font-weight: bold !important; margin: 0 0 10px !important;">From Assessment to Action</h3>
      <p>Strategic legal counsel involves more than identifying issues - it requires developing comprehensive approaches that address root causes while positioning you for future success. This methodical approach distinguishes sophisticated legal strategy from reactive legal services.</p>
    </div>
    
    <p><strong>Key considerations for strategic legal implementation:</strong></p>
    <ul>
      <li><strong>Priority Identification</strong> - Addressing the most critical legal needs first</li>
      <li><strong>Risk Mitigation</strong> - Implementing protective measures before issues arise</li>
      <li><strong>Growth Planning</strong> - Ensuring legal structures support your objectives</li>
      <li><strong>Compliance Strategy</strong> - Maintaining regulatory alignment as you progress</li>
    </ul>
    
    <p>This comprehensive approach ensures your legal strategy serves as a foundation for success rather than a reactive measure.</p>
    
    <a href="https://calendly.com/jacobscounsel/priority-consultation" class="cta-button" style="background-color: #2563eb !important; color: #ffffff !important; padding: 16px 32px !important; text-decoration: none !important; border-radius: 8px !important; font-weight: bold !important; display: inline-block !important; margin: 20px 0 !important; text-align: center !important; min-width: 200px !important;">
      Book Your Strategy Session
    </a>
    
    <p>Best regards,<br>
    <strong>Drew Jacobs, Esq.</strong><br>
    Jacobs Counsel LLC</p>
  `,

  // Newsletter Educational Content
  newsletter_welcome: `
    <h1 style="color: #1f2937 !important; font-size: 28px !important; font-weight: bold !important; margin: 20px 0 !important;">Welcome to Strategic Legal Insights</h1>
    
    <p>{{firstName}}, thank you for subscribing to receive strategic legal insights from Jacobs Counsel. You'll now receive thoughtful analysis on legal developments that affect strategic business and personal planning.</p>
    
    <div style="background-color: #f0f9ff !important; border: 2px solid #3b82f6 !important; border-radius: 8px !important; padding: 20px !important; margin: 20px 0 !important;">
      <h3 style="color: #1d4ed8 !important; font-size: 18px !important; font-weight: bold !important; margin: 0 0 10px !important;">Strategic Legal Intelligence</h3>
      <p>Our newsletter focuses on providing actionable insights rather than generic legal updates. Each edition examines how legal developments create strategic opportunities or require adaptive planning.</p>
    </div>
    
    <p>You can expect coverage of:</p>
    <ul>
      <li><strong>Regulatory Changes</strong> - How new laws affect strategic planning</li>
      <li><strong>Case Law Developments</strong> - Practical implications for business strategy</li>
      <li><strong>Planning Opportunities</strong> - Proactive measures for legal optimization</li>
      <li><strong>Risk Management</strong> - Emerging threats and protective strategies</li>
    </ul>
    
    <p>This content is designed for individuals and businesses who approach legal matters strategically rather than reactively.</p>
    
    <a href="https://calendly.com/jacobscounsel/strategic-consultation" class="cta-button">
      Schedule a Strategic Consultation
    </a>
    
    <p>Best regards,<br>
    <strong>Drew Jacobs, Esq.</strong><br>
    Jacobs Counsel LLC</p>
  `,

  // Outside Counsel Educational Series
  outside_counsel_welcome: `
    <h1 style="color: #1f2937 !important; font-size: 28px !important; font-weight: bold !important; margin: 20px 0 !important;">Strategic Outside Counsel Engagement</h1>
    
    <p>{{firstName}}, your inquiry about outside counsel services indicates you understand the value of sophisticated legal support for complex business matters. Strategic outside counsel relationships provide more than legal services - they provide strategic partnership.</p>
    
    <div style="background-color: #f0f9ff !important; border: 2px solid #3b82f6 !important; border-radius: 8px !important; padding: 20px !important; margin: 20px 0 !important;">
      <h3 style="color: #1d4ed8 !important; font-size: 18px !important; font-weight: bold !important; margin: 0 0 10px !important;">Beyond Traditional Legal Services</h3>
      <p>Effective outside counsel serves as an extension of your strategic team, providing not only legal expertise but also business-minded counsel that supports your operational and growth objectives.</p>
    </div>
    
    <p><strong>Strategic outside counsel typically addresses:</strong></p>
    <ul>
      <li><strong>Complex Transaction Support</strong> - Sophisticated deal structure and execution</li>
      <li><strong>Regulatory Navigation</strong> - Compliance strategy for complex regulatory environments</li>
      <li><strong>Risk Assessment</strong> - Comprehensive evaluation of legal and business risks</li>
      <li><strong>Strategic Planning</strong> - Legal strategy aligned with business objectives</li>
    </ul>
    
    <p>This approach ensures legal counsel supports rather than constrains your strategic initiatives.</p>
    
    <a href="https://calendly.com/jacobscounsel/outside-counsel-consultation" class="cta-button">
      Discuss Your Outside Counsel Needs
    </a>
    
    <p>Best regards,<br>
    <strong>Drew Jacobs, Esq.</strong><br>
    Jacobs Counsel LLC</p>
  `,

  // Resource Guide Download Series
  resource_guide_welcome: `
    <h1 style="color: #1f2937 !important; font-size: 28px !important; font-weight: bold !important; margin: 20px 0 !important;">Your Strategic Legal Resource Guide</h1>
    
    <p>{{firstName}}, thank you for downloading our strategic legal resource guide. This comprehensive guide represents our approach to providing actionable legal intelligence rather than generic legal information.</p>
    
    <div style="background-color: #f0f9ff !important; border: 2px solid #3b82f6 !important; border-radius: 8px !important; padding: 20px !important; margin: 20px 0 !important;">
      <h3 style="color: #1d4ed8 !important; font-size: 18px !important; font-weight: bold !important; margin: 0 0 10px !important;">Strategic Resource Implementation</h3>
      <p>The most valuable legal resources provide frameworks for strategic thinking rather than simple checklists. Our guides focus on helping you understand the strategic implications of legal decisions.</p>
    </div>
    
    <p>To maximize the value of your resource guide:</p>
    <ul>
      <li><strong>Strategic Context</strong> - Consider how each element relates to your broader objectives</li>
      <li><strong>Implementation Planning</strong> - Develop systematic approaches to recommended strategies</li>
      <li><strong>Professional Review</strong> - Consult with counsel before implementing complex strategies</li>
      <li><strong>Ongoing Updates</strong> - Legal landscapes evolve, requiring adaptive approaches</li>
    </ul>
    
    <p>This methodical approach ensures you extract maximum strategic value from legal resources.</p>
    
    <a href="https://calendly.com/jacobscounsel/strategic-consultation" class="cta-button">
      Schedule Implementation Discussion
    </a>
    
    <p>Best regards,<br>
    <strong>Drew Jacobs, Esq.</strong><br>
    Jacobs Counsel LLC</p>
  `,

  // Business Guide Download
  business_guide_welcome: `
    <h1 style="color: #1f2937 !important; font-size: 28px !important; font-weight: bold !important; margin: 20px 0 !important;">Strategic Business Legal Planning</h1>
    
    <p>{{firstName}}, your download of our business legal guide demonstrates strategic thinking about the legal foundations that support business success. Sophisticated business planning requires comprehensive legal strategy.</p>
    
    <div style="background-color: #f0f9ff !important; border: 2px solid #3b82f6 !important; border-radius: 8px !important; padding: 20px !important; margin: 20px 0 !important;">
      <h3 style="color: #1d4ed8 !important; font-size: 18px !important; font-weight: bold !important; margin: 0 0 10px !important;">Comprehensive Business Legal Strategy</h3>
      <p>Effective business legal planning addresses not only immediate formation needs but also growth strategy, risk management, and operational optimization. This integrated approach distinguishes strategic business counsel from transactional legal services.</p>
    </div>
    
    <p>Key areas covered in strategic business legal planning:</p>
    <ul>
      <li><strong>Entity Structure Optimization</strong> - Choosing structures that support growth and flexibility</li>
      <li><strong>Operational Legal Framework</strong> - Contracts, policies, and procedures that protect and enable</li>
      <li><strong>Growth Strategy Support</strong> - Legal structures that facilitate rather than complicate expansion</li>
      <li><strong>Risk Management Systems</strong> - Comprehensive approaches to business risk mitigation</li>
    </ul>
    
    <a href="https://calendly.com/jacobscounsel/business-protection-consultation" class="cta-button">
      Discuss Your Business Legal Strategy
    </a>
    
    <p>Best regards,<br>
    <strong>Drew Jacobs, Esq.</strong><br>
    Jacobs Counsel LLC</p>
  `,

  // Brand Guide Download
  brand_guide_welcome: `
    <h1 style="color: #1f2937 !important; font-size: 28px !important; font-weight: bold !important; margin: 20px 0 !important;">Strategic Brand Protection Implementation</h1>
    
    <p>{{firstName}}, downloading our brand protection guide indicates you understand that intellectual property strategy requires more than basic trademark registration. Comprehensive brand protection involves strategic legal planning.</p>
    
    <div style="background-color: #f0f9ff !important; border: 2px solid #3b82f6 !important; border-radius: 8px !important; padding: 20px !important; margin: 20px 0 !important;">
      <h3 style="color: #1d4ed8 !important; font-size: 18px !important; font-weight: bold !important; margin: 0 0 10px !important;">Comprehensive IP Strategy</h3>
      <p>Strategic brand protection creates systematic approaches to securing, maintaining, and enforcing intellectual property rights. This comprehensive approach ensures your brand assets receive appropriate protection while supporting business objectives.</p>
    </div>
    
    <p>Strategic brand protection typically encompasses:</p>
    <ul>
      <li><strong>Portfolio Development</strong> - Systematic approach to IP asset creation and registration</li>
      <li><strong>Strategic Registration</strong> - Geographic and categorical protection aligned with business strategy</li>
      <li><strong>Monitoring Systems</strong> - Proactive identification of potential infringement</li>
      <li><strong>Enforcement Strategy</strong> - Measured responses to IP violations that protect without overreach</li>
    </ul>
    
    <a href="https://calendly.com/jacobscounsel/brand-protection-consultation" class="cta-button">
      Schedule Brand Strategy Discussion
    </a>
    
    <p>Best regards,<br>
    <strong>Drew Jacobs, Esq.</strong><br>
    Jacobs Counsel LLC</p>
  `,

  // Estate Guide Download
  estate_guide_welcome: `
    <h1 style="color: #1f2937 !important; font-size: 28px !important; font-weight: bold !important; margin: 20px 0 !important;">Strategic Estate Planning Implementation</h1>
    
    <p>{{firstName}}, your download of our estate planning guide demonstrates understanding that sophisticated estate planning involves more than basic document preparation. Strategic estate planning requires comprehensive legal architecture.</p>
    
    <div style="background-color: #f0f9ff !important; border: 2px solid #3b82f6 !important; border-radius: 8px !important; padding: 20px !important; margin: 20px 0 !important;">
      <h3 style="color: #1d4ed8 !important; font-size: 18px !important; font-weight: bold !important; margin: 0 0 10px !important;">Comprehensive Estate Strategy</h3>
      <p>Strategic estate planning integrates asset protection, tax optimization, succession planning, and family governance into cohesive legal architecture. This systematic approach ensures your estate plan serves your complete strategic objectives.</p>
    </div>
    
    <p>Sophisticated estate planning addresses:</p>
    <ul>
      <li><strong>Asset Protection Architecture</strong> - Legal structures that preserve wealth while maintaining flexibility</li>
      <li><strong>Tax Strategy Integration</strong> - Coordinated approaches to estate, gift, and income tax optimization</li>
      <li><strong>Succession Planning</strong> - Systematic transfer strategies for business and personal assets</li>
      <li><strong>Family Governance</strong> - Structures that support family harmony and objective achievement</li>
    </ul>
    
    <a href="https://calendly.com/jacobscounsel/wealth-protection-consultation" class="cta-button">
      Schedule Estate Strategy Consultation
    </a>
    
    <p>Best regards,<br>
    <strong>Drew Jacobs, Esq.</strong><br>
    Jacobs Counsel LLC</p>
  `,

  // MISSING CORE TEMPLATES FOR CUSTOMER EXPERIENCE

  // General Consultation Reminder (used in 12 pathways)
  consultation_reminder: `
    <h1 style="color: #1f2937 !important; font-size: 28px !important; font-weight: bold !important; margin: 20px 0 !important;">Schedule Your Strategic Consultation</h1>
    
    <p>{{firstName}}, you've taken the first step toward strategic legal planning by engaging with our educational content. The next step is discussing how these insights apply to your specific situation.</p>
    
    <div style="background-color: #f0f9ff !important; border: 2px solid #3b82f6 !important; border-radius: 8px !important; padding: 20px !important; margin: 20px 0 !important;">
      <h3 style="color: #1d4ed8 !important; font-size: 18px !important; font-weight: bold !important; margin: 0 0 10px !important;">Strategic Legal Consultation</h3>
      <p><strong>What to expect:</strong> We'll cut through the legal jargon, identify what actually matters for your situation, and give you a clear action plan you can implement immediately.</p>
    </div>
    
    <p><strong>During your consultation, we'll discuss:</strong></p>
    <ul>
      <li><strong>Your Current Legal Landscape</strong> - Understanding your existing position and potential exposures</li>
      <li><strong>Strategic Opportunities</strong> - Identifying legal strategies that support your goals</li>
      <li><strong>Implementation Planning</strong> - Developing actionable approaches to legal optimization</li>
      <li><strong>Professional Partnership</strong> - Exploring how our services align with your needs</li>
    </ul>
    
    <p>This consultation provides clarity on complex legal matters without obligation.</p>
    
    <a href="https://calendly.com/jacobscounsel/priority-consultation" class="cta-button" style="background-color: #2563eb !important; color: #ffffff !important; padding: 16px 32px !important; text-decoration: none !important; border-radius: 8px !important; font-weight: bold !important; display: inline-block !important; margin: 20px 0 !important; text-align: center !important; min-width: 200px !important;">
      Schedule Your Strategic Consultation
    </a>
    
    <p><strong>Let's build something that lasts.</strong> Your legal foundation should be as ambitious as your goals.</p>
    
    <p>Best regards,<br>
    <strong>Drew Jacobs, Esq.</strong><br>
    Jacobs Counsel LLC</p>
  `,

  // General Legal Education (used in 6 pathways)  
  legal_education_general: `
    <h1 style="color: #1f2937 !important; font-size: 28px !important; font-weight: bold !important; margin: 20px 0 !important;">Strategic Legal Planning Fundamentals</h1>
    
    <p>{{firstName}}, effective legal strategy requires understanding the foundational principles that govern sophisticated legal planning. These fundamentals apply across all areas of legal strategy.</p>
    
    <div style="background-color: #f0f9ff !important; border: 2px solid #3b82f6 !important; border-radius: 8px !important; padding: 20px !important; margin: 20px 0 !important;">
      <h3 style="color: #1d4ed8 !important; font-size: 18px !important; font-weight: bold !important; margin: 0 0 10px !important;">The Strategic Legal Approach</h3>
      <p>Strategic legal planning involves more than addressing immediate issues. It requires systematic evaluation of current position, identification of potential risks and opportunities, and implementation of comprehensive solutions.</p>
    </div>
    
    <p><strong>Core principles of strategic legal planning:</strong></p>
    <ul>
      <li><strong>Proactive Risk Management</strong> - Addressing potential issues before they become problems</li>
      <li><strong>Systematic Documentation</strong> - Creating legal frameworks that support your objectives</li>
      <li><strong>Compliance Integration</strong> - Ensuring all strategies align with applicable regulations</li>
      <li><strong>Adaptive Planning</strong> - Building flexibility for changing circumstances and goals</li>
    </ul>
    
    <p>This systematic approach distinguishes strategic legal counsel from reactive legal services.</p>
    
    <p><strong>Important:</strong> Legal strategy should always be developed based on your specific circumstances, objectives, and applicable laws. This information is educational and not legal advice.</p>
    
    <a href="https://calendly.com/jacobscounsel/strategic-consultation" class="cta-button">
      Discuss Your Strategic Legal Needs
    </a>
    
    <p>Best regards,<br>
    <strong>Drew Jacobs, Esq.</strong><br>
    Jacobs Counsel LLC</p>
  `,

  // Legal Resources Template
  legal_resources: `
    <h1 style="color: #1f2937 !important; font-size: 28px !important; font-weight: bold !important; margin: 20px 0 !important;">Strategic Legal Resources for Implementation</h1>
    
    <p>{{firstName}}, sophisticated legal strategy requires access to high-quality resources that provide actionable guidance rather than generic information.</p>
    
    <div style="background-color: #f0f9ff !important; border: 2px solid #3b82f6 !important; border-radius: 8px !important; padding: 20px !important; margin: 20px 0 !important;">
      <h3 style="color: #1d4ed8 !important; font-size: 18px !important; font-weight: bold !important; margin: 0 0 10px !important;">Comprehensive Legal Resource Library</h3>
      <p>Our resource library focuses on providing strategic frameworks and implementation guidance for complex legal matters. These resources are designed to support thoughtful decision-making in sophisticated legal contexts.</p>
    </div>
    
    <p><strong>Available strategic resources include:</strong></p>
    <ul>
      <li><strong>Planning Frameworks</strong> - Systematic approaches to complex legal strategy</li>
      <li><strong>Implementation Guides</strong> - Step-by-step guidance for legal strategy execution</li>
      <li><strong>Compliance Checklists</strong> - Comprehensive regulatory alignment tools</li>
      <li><strong>Case Studies</strong> - Real-world examples of strategic legal solutions</li>
    </ul>
    
    <p>These resources complement professional legal counsel and provide additional context for strategic legal planning.</p>
    
    <a href="https://calendly.com/jacobscounsel/strategic-consultation" class="cta-button">
      Access Strategic Resources
    </a>
    
    <p>Best regards,<br>
    <strong>Drew Jacobs, Esq.</strong><br>
    Jacobs Counsel LLC</p>
  `,

  // Estate-Specific Templates
  estate_intake_confirmation: `
    <h1 style="color: #1f2937 !important; font-size: 28px !important; font-weight: bold !important; margin: 20px 0 !important;">Estate Planning Inquiry Confirmation</h1>
    
    <p>{{firstName}}, thank you for your estate planning inquiry. Your submission demonstrates strategic thinking about wealth preservation and family legacy planning.</p>
    
    <div style="background-color: #f0f9ff !important; border: 2px solid #3b82f6 !important; border-radius: 8px !important; padding: 20px !important; margin: 20px 0 !important;">
      <h3 style="color: #1d4ed8 !important; font-size: 18px !important; font-weight: bold !important; margin: 0 0 10px !important;">Your Estate Planning Journey</h3>
      <p>Sophisticated estate planning involves comprehensive analysis of your current position, strategic objectives, and optimal structures for achieving your wealth preservation and transfer goals.</p>
    </div>
    
    <p>Based on your inquiry, our estate planning approach will examine:</p>
    <ul>
      <li><strong>Current Asset Structure</strong> - Analysis of existing holdings and ownership structures</li>
      <li><strong>Tax Optimization Strategies</strong> - Minimizing estate, gift, and generation-skipping transfer taxes</li>
      <li><strong>Asset Protection Planning</strong> - Protecting wealth from potential creditors and risks</li>
      <li><strong>Succession Planning</strong> - Ensuring smooth transition of assets and responsibilities</li>
    </ul>
    
    <a href="https://calendly.com/jacobscounsel/wealth-protection-consultation" class="cta-button">
      Schedule Your Estate Planning Consultation
    </a>
    
    <p>Best regards,<br>
    <strong>Drew Jacobs, Esq.</strong><br>
    Jacobs Counsel LLC</p>
  `,

  estate_consultation_reminder: `
    <h1 style="color: #1f2937 !important; font-size: 28px !important; font-weight: bold !important; margin: 20px 0 !important;">Schedule Your Estate Planning Strategy Session</h1>
    
    <p>{{firstName}}, when you're managing serious wealth, generic estate planning doesn't cut it. We'll build a plan that actually protects what you've built and sets up the next generation for success.</p>
    
    <div style="background-color: #f0f9ff !important; border: 2px solid #3b82f6 !important; border-radius: 8px !important; padding: 20px !important; margin: 20px 0 !important;">
      <h3 style="color: #1d4ed8 !important; font-size: 18px !important; font-weight: bold !important; margin: 0 0 10px !important;">Estate Planning Consultation Process</h3>
      <p>During your consultation, we'll examine your current estate structure, identify optimization opportunities, and discuss strategic approaches to wealth preservation and transfer.</p>
    </div>
    
    <p>Your estate planning consultation will address:</p>
    <ul>
      <li><strong>Current Estate Analysis</strong> - Comprehensive review of assets and current planning</li>
      <li><strong>Tax Strategy Development</strong> - Identifying opportunities for tax optimization</li>
      <li><strong>Protection Strategies</strong> - Asset protection and risk mitigation approaches</li>
      <li><strong>Legacy Planning</strong> - Ensuring your estate plan reflects your values and objectives</li>
    </ul>
    
    <a href="https://calendly.com/jacobscounsel/wealth-protection-consultation" class="cta-button">
      Schedule Your Estate Strategy Session
    </a>
    
    <p>Best regards,<br>
    <strong>Drew Jacobs, Esq.</strong><br>
    Jacobs Counsel LLC</p>
  `,

  // Business-Specific Templates
  business_intake_confirmation: `
    <h1 style="color: #1f2937 !important; font-size: 28px !important; font-weight: bold !important; margin: 20px 0 !important;">Business Formation Inquiry Confirmation</h1>
    
    <p>{{firstName}}, thank you for your business formation inquiry. Your approach demonstrates understanding that entity selection and business legal strategy are foundational to long-term success.</p>
    
    <div style="background-color: #f0f9ff !important; border: 2px solid #3b82f6 !important; border-radius: 8px !important; padding: 20px !important; margin: 20px 0 !important;">
      <h3 style="color: #1d4ed8 !important; font-size: 18px !important; font-weight: bold !important; margin: 0 0 10px !important;">Strategic Business Formation</h3>
      <p>Effective business formation involves comprehensive analysis of your business objectives, growth strategy, and optimal legal structures for supporting your goals while managing risk and tax exposure.</p>
    </div>
    
    <p>Our business formation process examines:</p>
    <ul>
      <li><strong>Entity Structure Analysis</strong> - Selecting optimal corporate structure for your objectives</li>
      <li><strong>Growth Strategy Alignment</strong> - Ensuring legal structure supports expansion plans</li>
      <li><strong>Risk Management Framework</strong> - Implementing comprehensive liability protection</li>
      <li><strong>Operational Legal Architecture</strong> - Creating contracts and policies that protect and enable</li>
    </ul>
    
    <a href="https://calendly.com/jacobscounsel/business-protection-consultation" class="cta-button">
      Schedule Your Business Strategy Consultation
    </a>
    
    <p>Best regards,<br>
    <strong>Drew Jacobs, Esq.</strong><br>
    Jacobs Counsel LLC</p>
  `,

  business_consultation_reminder: `
    <h1 style="color: #1f2937 !important; font-size: 28px !important; font-weight: bold !important; margin: 20px 0 !important;">Schedule Your Business Legal Strategy Session</h1>
    
    <p>{{firstName}}, strategic business legal planning requires understanding how legal structures can support rather than constrain your business objectives. Our consultation process provides clarity on complex business legal matters.</p>
    
    <div style="background-color: #f0f9ff !important; border: 2px solid #3b82f6 !important; border-radius: 8px !important; padding: 20px !important; margin: 20px 0 !important;">
      <h3 style="color: #1d4ed8 !important; font-size: 18px !important; font-weight: bold !important; margin: 0 0 10px !important;">Business Legal Strategy Consultation</h3>
      <p>During your consultation, we'll examine your business goals, analyze optimal legal structures, and discuss comprehensive approaches to business legal strategy and risk management.</p>
    </div>
    
    <p>Your business consultation will address:</p>
    <ul>
      <li><strong>Business Structure Optimization</strong> - Selecting entities that support your growth strategy</li>
      <li><strong>Operational Legal Framework</strong> - Implementing contracts, policies, and procedures</li>
      <li><strong>Risk Management Strategy</strong> - Comprehensive approaches to business liability protection</li>
      <li><strong>Growth Planning</strong> - Legal structures that facilitate rather than complicate expansion</li>
    </ul>
    
    <a href="https://calendly.com/jacobscounsel/business-protection-consultation" class="cta-button">
      Schedule Your Business Strategy Session
    </a>
    
    <p>Best regards,<br>
    <strong>Drew Jacobs, Esq.</strong><br>
    Jacobs Counsel LLC</p>
  `,

  // Brand Protection Templates
  brand_intake_confirmation: `
    <h1 style="color: #1f2937 !important; font-size: 28px !important; font-weight: bold !important; margin: 20px 0 !important;">Brand Protection Inquiry Confirmation</h1>
    
    <p>{{firstName}}, thank you for your brand protection inquiry. Your approach demonstrates understanding that intellectual property strategy requires more than basic trademark registration.</p>
    
    <div style="background-color: #f0f9ff !important; border: 2px solid #3b82f6 !important; border-radius: 8px !important; padding: 20px !important; margin: 20px 0 !important;">
      <h3 style="color: #1d4ed8 !important; font-size: 18px !important; font-weight: bold !important; margin: 0 0 10px !important;">Comprehensive Brand Protection Strategy</h3>
      <p>Strategic brand protection involves systematic approaches to securing, maintaining, and enforcing intellectual property rights while supporting business growth and market positioning objectives.</p>
    </div>
    
    <p>Our brand protection approach examines:</p>
    <ul>
      <li><strong>IP Portfolio Development</strong> - Systematic approach to intellectual property asset creation</li>
      <li><strong>Strategic Registration</strong> - Geographic and categorical protection aligned with business strategy</li>
      <li><strong>Monitoring and Enforcement</strong> - Proactive identification and strategic response to potential infringement</li>
      <li><strong>Brand Architecture</strong> - Legal frameworks that support brand development and expansion</li>
    </ul>
    
    <a href="https://calendly.com/jacobscounsel/brand-protection-consultation" class="cta-button">
      Schedule Your Brand Strategy Consultation
    </a>
    
    <p>Best regards,<br>
    <strong>Drew Jacobs, Esq.</strong><br>
    Jacobs Counsel LLC</p>
  `,

  brand_consultation_reminder: `
    <h1 style="color: #1f2937 !important; font-size: 28px !important; font-weight: bold !important; margin: 20px 0 !important;">Schedule Your Brand Protection Strategy Session</h1>
    
    <p>{{firstName}}, strategic brand protection requires comprehensive analysis of your intellectual property landscape and systematic approaches to protection and enforcement. Our consultation provides clarity on complex IP matters.</p>
    
    <div style="background-color: #f0f9ff !important; border: 2px solid #3b82f6 !important; border-radius: 8px !important; padding: 20px !important; margin: 20px 0 !important;">
      <h3 style="color: #1d4ed8 !important; font-size: 18px !important; font-weight: bold !important; margin: 0 0 10px !important;">Brand Protection Consultation Process</h3>
      <p>During your consultation, we'll examine your current IP position, identify protection opportunities, and discuss strategic approaches to brand protection and enforcement.</p>
    </div>
    
    <p>Your brand protection consultation will address:</p>
    <ul>
      <li><strong>IP Portfolio Analysis</strong> - Comprehensive review of existing and potential intellectual property assets</li>
      <li><strong>Protection Strategy Development</strong> - Systematic approaches to securing intellectual property rights</li>
      <li><strong>Enforcement Planning</strong> - Strategic approaches to protecting and defending your brand</li>
      <li><strong>Brand Architecture</strong> - Legal structures that support brand development and expansion</li>
    </ul>
    
    <a href="https://calendly.com/jacobscounsel/brand-protection-consultation" class="cta-button">
      Schedule Your Brand Strategy Session
    </a>
    
    <p>Best regards,<br>
    <strong>Drew Jacobs, Esq.</strong><br>
    Jacobs Counsel LLC</p>
  `,

  // POST-CONSULTATION CUSTOMER EXPERIENCE ENHANCEMENT

  // Consultation Preparation (sent after booking)
  consultation_preparation: `
    <h1 style="color: #1f2937 !important; font-size: 28px !important; font-weight: bold !important; margin: 20px 0 !important;">Preparing for Your Strategic Legal Consultation</h1>
    
    <p>{{firstName}}, thank you for scheduling your consultation with Jacobs Counsel. To maximize the value of our time together, please consider the following preparation suggestions.</p>
    
    <div style="background-color: #f0f9ff !important; border: 2px solid #3b82f6 !important; border-radius: 8px !important; padding: 20px !important; margin: 20px 0 !important;">
      <h3 style="color: #1d4ed8 !important; font-size: 18px !important; font-weight: bold !important; margin: 0 0 10px !important;">Consultation Preparation Guidelines</h3>
      <p><strong>No time wasters:</strong> We'll focus on the legal moves that actually matter for your business and skip the generic advice you can Google.</p>
    </div>
    
    <p><strong>To prepare for our consultation, please consider:</strong></p>
    <ul>
      <li><strong>Your Primary Objectives</strong> - What specific legal outcomes do you hope to achieve?</li>
      <li><strong>Current Legal Position</strong> - What existing legal structures or documents do you have in place?</li>
      <li><strong>Key Concerns</strong> - What legal risks or exposures are you most concerned about?</li>
      <li><strong>Timeline Considerations</strong> - What is your preferred timeline for addressing these matters?</li>
      <li><strong>Questions</strong> - What specific questions would you like our consultation to address?</li>
    </ul>
    
    <p>This preparation allows us to focus our consultation on strategic guidance most relevant to your situation.</p>
    
    <p><strong>Important:</strong> Our consultation is for informational purposes. No attorney-client relationship is created until a formal engagement agreement is executed.</p>
    
    <p><strong>Let's make this happen.</strong> Your business momentum shouldn't slow down for legal - it should accelerate because of it.</p>
    
    <p>Best regards,<br>
    <strong>Drew Jacobs, Esq.</strong><br>
    Jacobs Counsel LLC</p>
  `,

  // Post-Consultation Thank You
  post_consultation_thank_you: `
    <h1 style="color: #1f2937 !important; font-size: 28px !important; font-weight: bold !important; margin: 20px 0 !important;">Thank You for Your Consultation</h1>
    
    <p>{{firstName}}, great connecting with you about your legal needs. Now let's turn those plans into action and get your legal foundation locked down.</p>
    
    <div style="background-color: #f0f9ff !important; border: 2px solid #3b82f6 !important; border-radius: 8px !important; padding: 20px !important; margin: 20px 0 !important;">
      <h3 style="color: #1d4ed8 !important; font-size: 18px !important; font-weight: bold !important; margin: 0 0 10px !important;">Next Steps</h3>
      <p>Following our consultation, you may be considering how to implement the strategic legal approaches we discussed. This is an important decision that deserves thoughtful consideration.</p>
    </div>
    
    <p><strong>If you decide to move forward, our engagement process typically involves:</strong></p>
    <ul>
      <li><strong>Strategic Planning Phase</strong> - Comprehensive analysis of your legal landscape and objectives</li>
      <li><strong>Solution Development</strong> - Creating tailored legal strategies for your specific situation</li>
      <li><strong>Implementation Support</strong> - Professional guidance throughout the execution process</li>
      <li><strong>Ongoing Partnership</strong> - Continued strategic counsel as your needs evolve</li>
    </ul>
    
    <p>There is no pressure to make immediate decisions. Strategic legal planning should be approached thoughtfully and at your own pace.</p>
    
    <p>If you have any questions about our discussion or would like to explore engagement, please don't hesitate to reach out.</p>
    
    <p>Best regards,<br>
    <strong>Drew Jacobs, Esq.</strong><br>
    Jacobs Counsel LLC</p>
  `,

  // Follow-up for Non-Engaged Leads
  strategic_follow_up: `
    <h1 style="color: #1f2937 !important; font-size: 28px !important; font-weight: bold !important; margin: 20px 0 !important;">Strategic Legal Planning: Your Next Steps</h1>
    
    <p>{{firstName}}, I wanted to follow up on our recent discussion about your legal strategy needs. Strategic legal planning often requires time for thoughtful consideration.</p>
    
    <div style="background-color: #f0f9ff !important; border: 2px solid #3b82f6 !important; border-radius: 8px !important; padding: 20px !important; margin: 20px 0 !important;">
      <h3 style="color: #1d4ed8 !important; font-size: 18px !important; font-weight: bold !important; margin: 0 0 10px !important;">The Value of Strategic Timing</h3>
      <p>The most effective legal strategies are implemented proactively, before issues become urgent. This approach allows for comprehensive planning and optimal implementation of sophisticated legal solutions.</p>
    </div>
    
    <p><strong>Consider the benefits of proactive legal planning:</strong></p>
    <ul>
      <li><strong>Risk Mitigation</strong> - Addressing potential issues before they become problems</li>
      <li><strong>Strategic Optimization</strong> - Implementing solutions when you have maximum flexibility</li>
      <li><strong>Cost Efficiency</strong> - Proactive planning often costs less than reactive responses</li>
      <li><strong>Peace of Mind</strong> - Knowing your legal affairs are properly structured</li>
    </ul>
    
    <p>If you're ready to explore strategic legal implementation, or if you have questions about your legal planning options, I'm here to help.</p>
    
    <a href="https://calendly.com/jacobscounsel/strategic-consultation" class="cta-button">
      Schedule a Follow-Up Discussion
    </a>
    
    <p>Best regards,<br>
    <strong>Drew Jacobs, Esq.</strong><br>
    Jacobs Counsel LLC</p>
  `,

  // Lead Re-engagement for Cold Leads
  lead_reengagement: `
    <h1 style="color: #1f2937 !important; font-size: 28px !important; font-weight: bold !important; margin: 20px 0 !important;">Strategic Legal Updates and Opportunities</h1>
    
    <p>{{firstName}}, I wanted to reconnect and share some strategic insights that may be relevant to your legal planning needs.</p>
    
    <div style="background-color: #f0f9ff !important; border: 2px solid #3b82f6 !important; border-radius: 8px !important; padding: 20px !important; margin: 20px 0 !important;">
      <h3 style="color: #1d4ed8 !important; font-size: 18px !important; font-weight: bold !important; margin: 0 0 10px !important;">Recent Legal Developments</h3>
      <p>The legal landscape continues to evolve, creating both new opportunities and potential challenges for strategic legal planning. Staying informed about these developments helps ensure your legal strategy remains current and effective.</p>
    </div>
    
    <p><strong>Recent developments in strategic legal planning:</strong></p>
    <ul>
      <li><strong>Regulatory Changes</strong> - New laws affecting business and estate planning strategies</li>
      <li><strong>Planning Opportunities</strong> - Emerging strategies for legal optimization</li>
      <li><strong>Risk Management</strong> - New approaches to protecting assets and managing liability</li>
      <li><strong>Strategic Implementation</strong> - Improved methods for executing complex legal strategies</li>
    </ul>
    
    <p>These developments may create new opportunities for optimizing your legal position. If you're interested in discussing how these changes might affect your situation, I'd be happy to reconnect.</p>
    
    <a href="https://calendly.com/jacobscounsel/strategic-consultation" class="cta-button">
      Schedule a Strategic Update Discussion
    </a>
    
    <p>Best regards,<br>
    <strong>Drew Jacobs, Esq.</strong><br>
    Jacobs Counsel LLC</p>
  `
};

// Enhanced email wrapper with proper legal disclaimers
export function generateLegallyCompliantEmail(templateType, firstName = 'Valued Client', additionalData = {}) {
  const content = legalEmailTemplates[templateType] || legalEmailTemplates.standard_welcome;
  
  // Strategic personalization for ALL templates
  const strategicTemplates = [
    'vip_welcome', 'premium_welcome', 'standard_welcome', 'vip_strategy',
    'estate_planning_education', 'business_formation_education', 'brand_protection_education',
    'legal_strategy_builder_welcome', 'legal_strategy_builder_followup',
    'newsletter_welcome', 'resource_guide_confirmation', 'guide_download_education',
    'newsletter_educational', 'newsletter_followup', 'newsletter_strategy', 'newsletter_announcement',
    'consultation_reminder', 'consultation_preparation', 'consultation_followup',
    'intake_confirmation_general', 'intake_confirmation_estate', 'intake_confirmation_business',
    'intake_confirmation_brand', 'intake_processing', 'intake_complete',
    'post_consultation_thankyou', 'post_consultation_proposal', 'post_consultation_followup_general',
    'post_consultation_decision_support', 're_engagement_soft', 're_engagement_value', 're_engagement_final'
  ];
  
  if (strategicTemplates.includes(templateType)) {
    const clientProfile = identifyClientProfile(additionalData.formData || additionalData);
    const practiceAreaNeeds = analyzePracticeAreaNeeds(additionalData.formData || additionalData);
    const sophistication = assessClientSophistication(additionalData.formData || additionalData);
    
    const strategicOpening = generateStrategicOpening(clientProfile, practiceAreaNeeds, additionalData.formData || additionalData);
    const strategicInsights = generateStrategicInsights(clientProfile, practiceAreaNeeds, additionalData.formData || additionalData);
    const tailoredCTA = generateTailoredCTA(clientProfile, additionalData.formData || additionalData);
    
    // Generate strategic content based on template type and client profile
    const contextualContent = generateContextualContent(templateType, clientProfile, practiceAreaNeeds, additionalData.formData || additionalData);
    
    let personalizedContent = content
      .replace(/\{\{firstName\}\}/g, firstName)
      .replace(/\{\{strategicOpening\}\}/g, contextualContent.strategicOpening)
      .replace(/\{\{strategicInsight\}\}/g, contextualContent.strategicInsight)
      .replace(/\{\{contextualEducation\}\}/g, contextualContent.contextualEducation)
      .replace(/\{\{prioritizedApproach\}\}/g, contextualContent.prioritizedApproach)
      .replace(/\{\{strategicAdvice\}\}/g, contextualContent.strategicAdvice)
      .replace(/\{\{nextSteps\}\}/g, contextualContent.nextSteps)
      .replace(/\{\{ctaText\}\}/g, tailoredCTA.text)
      .replace(/\{\{ctaUrl\}\}/g, tailoredCTA.url)
      .replace(/\{\{submissionType\}\}/g, additionalData.submissionType || 'legal matters')
      .replace(/\{\{practiceArea\}\}/g, getPracticeAreaName(additionalData.submissionType) || 'legal strategy')
      .replace(/\{\{topicArea\}\}/g, contextualContent.topicArea || getPracticeAreaName(additionalData.submissionType) || 'legal strategy');
      
    return buildEmailHTML(personalizedContent);
  }
  
  // Standard template processing for non-strategic templates
  let personalizedContent = content
    .replace(/\{\{firstName\}\}/g, firstName)
    .replace(/\{\{submissionType\}\}/g, additionalData.submissionType || 'legal matters')
    .replace(/\{\{practiceArea\}\}/g, getPracticeAreaName(additionalData.submissionType) || 'legal strategy');
    
  return buildEmailHTML(personalizedContent);
}

// Build HTML email with consistent styling
function buildEmailHTML(personalizedContent) {
  
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Jacobs Counsel</title>
  <style>
    body, table, td, p, a, li, blockquote { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { -ms-interpolation-mode: bicubic; border: 0; outline: none; text-decoration: none; }
    
    body {
      margin: 0 !important;
      padding: 0 !important;
      background-color: #ffffff;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      line-height: 1.6;
      color: #000000 !important;
    }
    
    * {
      color: #000000 !important;
    }
    
    .content * {
      color: #000000 !important;
    }
    
    /* Ensure all text is black */
    div, p, h1, h2, h3, h4, h5, h6, li, strong, em, span, td {
      color: #000000 !important;
    }
    
    .email-container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
      border: 1px solid #e5e7eb;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }
    
    .header {
      background: #ffffff;
      padding: 30px;
      text-align: center;
      border-bottom: 2px solid #ff4d00;
    }
    
    .logo {
      color: #ff4d00 !important;
      font-size: 28px;
      font-weight: 700;
      letter-spacing: -0.5px;
      margin-bottom: 8px;
    }
    
    .tagline {
      color: #000000 !important;
      font-size: 16px;
      font-weight: 400;
      margin: 0;
    }
    
    .content {
      background-color: #ffffff;
      padding: 30px;
    }
    
    .content h1 {
      color: #000000 !important;
      font-size: 22px;
      font-weight: 700;
      margin: 0 0 20px 0;
      line-height: 1.3;
    }
    
    .content h2 {
      color: #ff4d00 !important;
      font-size: 18px;
      font-weight: 600;
      margin: 25px 0 15px 0;
    }
    
    .content h3 {
      color: #ff4d00 !important;
      font-size: 16px;
      font-weight: 600;
      margin: 20px 0 10px 0;
    }
    
    .content p {
      margin: 0 0 16px 0;
      font-size: 16px;
      line-height: 1.6;
      color: #000000 !important;
    }
    
    .content ul, .content ol, .content li {
      color: #000000 !important;
    }
    
    .content strong {
      color: #ff4d00 !important;
    }
    
    .content em {
      color: #000000 !important;
    }
    
    .highlight-box {
      background: #f8fafc;
      border-left: 4px solid #ff4d00;
      padding: 20px;
      margin: 20px 0;
      border-radius: 4px;
    }
    
    .highlight-box h3 {
      margin-top: 0;
      color: #ff4d00 !important;
    }
    
    .highlight-box p {
      color: #000000 !important;
    }
    
    .cta-button {
      display: inline-block;
      background: linear-gradient(135deg, #ff4d00 0%, #e63900 100%);
      color: #ffffff !important;
      text-decoration: none !important;
      padding: 16px 32px;
      border-radius: 8px;
      font-weight: 600;
      font-size: 16px;
      margin: 20px 0;
      text-align: center;
      box-shadow: 0 4px 15px rgba(255, 77, 0, 0.3);
    }
    
    .footer {
      background-color: #ffffff;
      border-top: 2px solid #ff4d00;
      color: #000000 !important;
      padding: 20px;
      text-align: center;
      font-size: 14px;
    }
    
    .footer p, .footer *, .footer strong, .footer div {
      color: #000000 !important;
    }
    
    .cta-button, .cta-button * {
      color: #ffffff !important;
    }
    
    .disclaimer {
      background-color: #fef3f2;
      border: 2px solid #fca5a5;
      border-radius: 8px;
      padding: 20px;
      margin-top: 30px;
      font-size: 13px;
      line-height: 1.5;
      color: #7f1d1d;
    }
    
    .disclaimer h4 {
      color: #dc2626;
      margin: 0 0 12px;
      font-size: 14px;
      font-weight: 700;
    }
    
    @media only screen and (max-width: 600px) {
      .email-container { width: 100% !important; }
      .header, .content, .footer { padding: 25px 20px !important; }
      .logo { font-size: 24px !important; }
      .content h1 { font-size: 22px !important; }
      .cta-button { display: block !important; width: 100% !important; }
    }
  </style>
</head>
<body>
  <div class="email-container">
    <div class="header">
      <div class="logo">JACOBS COUNSEL</div>
      <div class="tagline">Strategic Legal Counsel</div>
    </div>
    
    <div class="content">
      ${personalizedContent}
      
      <div class="disclaimer">
        <h4>IMPORTANT LEGAL NOTICE</h4>
        <p><strong>This communication is for informational purposes only and does not constitute legal advice.</strong> The information provided is general in nature and may not apply to your specific situation. No attorney-client relationship is created by this communication unless a written engagement agreement is executed. For legal advice regarding your specific situation, please consult with a qualified attorney.</p>
      </div>
    </div>
    
    <div class="footer">
      <strong>JACOBS COUNSEL LLC</strong><br>
      Strategic Legal Counsel<br><br>
      
      <div style="margin-top: 20px; font-size: 12px; opacity: 0.8;">
        <p>This communication may contain confidential information intended only for the recipient. If you have received this in error, please notify the sender and delete all copies.</p>
        
        <p>© ${new Date().getFullYear()} Jacobs Counsel LLC. All rights reserved.</p>
      </div>
    </div>
  </div>
</body>
</html>`;
}

export default {
  legalEmailTemplates,
  generateLegallyCompliantEmail
};