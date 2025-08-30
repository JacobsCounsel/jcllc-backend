// src/services/followUpScheduler.js - Smart follow-up reminder system
import { leadDb } from "../models/database-production.js";
import { log } from '../utils/logger.js';
import { getCalendlyLink } from './leadScoring.js';

export function scheduleSmartFollowUps(leadId, leadScore, submissionType, formData) {
  try {
    const followUps = [];
    
    // Smart scheduling based on lead score and urgency
    if (leadScore.score >= 90) {
      // Ultra high-value: Immediate + same day + next day
      followUps.push({
        type: 'immediate',
        delay: 2, // 2 hours
        message: `🚨 ULTRA HIGH VALUE (${leadScore.score}/100) - Call within 2 hours for best conversion`
      });
      
      followUps.push({
        type: 'same_day',
        delay: 8, // 8 hours
        message: `🔥 Second attempt - High-value lead still needs contact`
      });
      
      followUps.push({
        type: 'next_day', 
        delay: 24, // 24 hours
        message: `📞 Final urgent attempt - Don't let this ${leadScore.score}/100 lead go cold`
      });
      
    } else if (leadScore.score >= 70) {
      // High-value: Same day + next day
      followUps.push({
        type: 'same_day',
        delay: 4, // 4 hours
        message: `🎯 HIGH VALUE (${leadScore.score}/100) - Call today for best results`
      });
      
      followUps.push({
        type: 'next_day',
        delay: 24, // 24 hours
        message: `📈 Follow-up needed - High-scoring lead awaiting contact`
      });
      
    } else if (leadScore.score >= 50) {
      // Medium-value: Next day + three day
      followUps.push({
        type: 'next_day',
        delay: 20, // 20 hours
        message: `📋 Medium priority follow-up (${leadScore.score}/100) - Personal outreach recommended`
      });
      
      followUps.push({
        type: 'three_day',
        delay: 72, // 3 days
        message: `🔄 Second follow-up attempt - Don't lose this lead to competitors`
      });
      
    } else {
      // Standard leads: Three day follow-up only
      followUps.push({
        type: 'three_day',
        delay: 48, // 2 days
        message: `📧 Standard follow-up - Send personal email or add to nurture sequence`
      });
    }
    
    // Add urgency-based accelerated follow-ups
    if (formData.urgency?.toLowerCase().includes('immediate') || 
        formData.timeline?.toLowerCase().includes('immediate')) {
      // Move all follow-ups up by 50%
      followUps.forEach(f => f.delay = Math.floor(f.delay * 0.5));
      followUps[0].message = `⚡ URGENT CLIENT - ${followUps[0].message}`;
    }
    
    // Service-specific adjustments
    if (submissionType === 'estate-intake') {
      const estateValue = parseFloat(formData.grossEstate?.replace(/[,$]/g, '') || '0');
      if (estateValue > 10000000) {
        // Ultra high net worth - immediate follow-up
        followUps.unshift({
          type: 'immediate',
          delay: 1, // 1 hour
          message: `💰 $${(estateValue/1000000).toFixed(1)}M ESTATE - Call immediately, this is a massive opportunity`
        });
      }
    }
    
    if (submissionType === 'business-formation' && formData.investmentPlan === 'vc') {
      followUps.unshift({
        type: 'immediate',
        delay: 1, // 1 hour
        message: `🚀 VC-BACKED STARTUP - Time sensitive, funding timeline critical`
      });
    }
    
    // Schedule all follow-ups
    const now = new Date();
    followUps.forEach(followUp => {
      const scheduledFor = new Date(now.getTime() + (followUp.delay * 60 * 60 * 1000));
      
      leadDb.scheduleFollowUp(
        leadId,
        followUp.type,
        scheduledFor.toISOString(),
        followUp.message
      );
      
      log.info('Smart follow-up scheduled', {
        leadId,
        type: followUp.type,
        delay: followUp.delay,
        scheduledFor: scheduledFor.toISOString(),
        leadScore: leadScore.score
      });
    });
    
    // Log the scheduling interaction
    leadDb.logInteraction(leadId, 'follow_up_scheduled', {
      followUpCount: followUps.length,
      maxDelay: Math.max(...followUps.map(f => f.delay)),
      minDelay: Math.min(...followUps.map(f => f.delay))
    });
    
    return followUps.length;
    
  } catch (error) {
    log.error('Failed to schedule smart follow-ups', { 
      error: error.message, 
      leadId, 
      leadScore: leadScore.score 
    });
    return 0;
  }
}

// Get pending follow-ups for the dashboard
export function getPendingFollowUps() {
  try {
    const pending = leadDb.getPendingFollowUps();
    
    return pending.map(followUp => {
      const formData = JSON.parse(followUp.form_data || '{}');
      const calendlyLink = getCalendlyLink(followUp.submission_type, { score: followUp.lead_score });
      
      return {
        ...followUp,
        formData,
        calendlyLink,
        overdue: new Date(followUp.scheduled_for) < new Date(),
        hoursOverdue: Math.max(0, Math.floor((new Date() - new Date(followUp.scheduled_for)) / (1000 * 60 * 60)))
      };
    }).sort((a, b) => {
      // Sort by: overdue first, then by lead score, then by scheduled time
      if (a.overdue && !b.overdue) return -1;
      if (!a.overdue && b.overdue) return 1;
      if (a.lead_score !== b.lead_score) return b.lead_score - a.lead_score;
      return new Date(a.scheduled_for) - new Date(b.scheduled_for);
    });
    
  } catch (error) {
    log.error('Failed to get pending follow-ups', { error: error.message });
    return [];
  }
}

// Mark follow-up as completed
export function completeFollowUp(followUpId) {
  try {
    leadDb.markFollowUpSent(followUpId);
    log.info('Follow-up marked as completed', { followUpId });
    return true;
  } catch (error) {
    log.error('Failed to complete follow-up', { error: error.message, followUpId });
    return false;
  }
}