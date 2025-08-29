// src/routes/analytics.js - Analytics dashboard for lead insights
import express from 'express';
import { leadDb } from '../models/database.js';
import { log } from '../utils/logger.js';

const router = express.Router();

// Dashboard endpoint - gives you powerful lead insights
router.get('/dashboard', async (req, res) => {
  try {
    const stats = leadDb.getDashboardStats();
    const followups = leadDb.getLeadsNeedingFollowup();
    const funnel = leadDb.getConversionFunnel();
    
    res.json({
      ok: true,
      data: {
        ...stats,
        followupNeeded: followups,
        conversionFunnel: funnel,
        generatedAt: new Date().toISOString()
      }
    });
  } catch (error) {
    log.error('Dashboard analytics failed', { error: error.message });
    res.status(500).json({ ok: false, error: 'Failed to load analytics' });
  }
});

// Lead intelligence - shows what's working for conversions
router.get('/lead-intelligence', async (req, res) => {
  try {
    const { period = '30' } = req.query;
    
    // What sources convert best?
    const conversionsBySource = leadDb.db.prepare(`
      SELECT 
        l.submission_type,
        COUNT(*) as total_leads,
        AVG(l.lead_score) as avg_score,
        COUNT(CASE WHEN i.interaction_type = 'calendly_booked' THEN 1 END) as bookings,
        ROUND(COUNT(CASE WHEN i.interaction_type = 'calendly_booked' THEN 1 END) * 100.0 / COUNT(*), 1) as booking_rate
      FROM leads l
      LEFT JOIN lead_interactions i ON l.id = i.lead_id
      WHERE l.created_at >= date('now', '-' || ? || ' days')
      GROUP BY l.submission_type
      ORDER BY booking_rate DESC
    `).all(period);

    // What score ranges convert best?
    const conversionsByScore = leadDb.db.prepare(`
      SELECT 
        CASE 
          WHEN l.lead_score >= 70 THEN 'High (70+)'
          WHEN l.lead_score >= 50 THEN 'Medium (50-69)'
          ELSE 'Standard (<50)'
        END as score_range,
        COUNT(*) as total_leads,
        COUNT(CASE WHEN i.interaction_type = 'calendly_booked' THEN 1 END) as bookings,
        ROUND(COUNT(CASE WHEN i.interaction_type = 'calendly_booked' THEN 1 END) * 100.0 / COUNT(*), 1) as booking_rate
      FROM leads l
      LEFT JOIN lead_interactions i ON l.id = i.lead_id
      WHERE l.created_at >= date('now', '-' || ? || ' days')
      GROUP BY score_range
      ORDER BY booking_rate DESC
    `).all(period);

    // Best follow-up timing
    const followupTiming = leadDb.db.prepare(`
      SELECT 
        CASE 
          WHEN julianday(i.created_at) - julianday(l.created_at) <= 1 THEN '< 24 hours'
          WHEN julianday(i.created_at) - julianday(l.created_at) <= 3 THEN '1-3 days' 
          WHEN julianday(i.created_at) - julianday(l.created_at) <= 7 THEN '3-7 days'
          ELSE '> 7 days'
        END as followup_timing,
        COUNT(*) as bookings
      FROM leads l
      JOIN lead_interactions i ON l.id = i.lead_id
      WHERE i.interaction_type = 'calendly_booked'
        AND l.created_at >= date('now', '-' || ? || ' days')
      GROUP BY followup_timing
      ORDER BY bookings DESC
    `).all(period);

    res.json({
      ok: true,
      data: {
        conversionsBySource,
        conversionsByScore, 
        followupTiming,
        insights: generateInsights(conversionsBySource, conversionsByScore),
        period: `${period} days`
      }
    });
  } catch (error) {
    log.error('Lead intelligence failed', { error: error.message });
    res.status(500).json({ ok: false, error: 'Failed to generate intelligence' });
  }
});

// Follow-up recommendations - actionable insights
router.get('/followup-recommendations', async (req, res) => {
  try {
    const highValueNeeds = leadDb.getLeadsNeedingFollowup();
    
    // Prioritize by recency and score
    const prioritized = highValueNeeds
      .map(lead => ({
        ...lead,
        hoursSinceSubmission: Math.floor((Date.now() - new Date(lead.created_at).getTime()) / (1000 * 60 * 60)),
        urgencyScore: lead.lead_score + (48 - Math.min(48, Math.floor((Date.now() - new Date(lead.created_at).getTime()) / (1000 * 60 * 60))))
      }))
      .sort((a, b) => b.urgencyScore - a.urgencyScore)
      .slice(0, 10);

    res.json({
      ok: true,
      data: {
        highPriorityFollowups: prioritized,
        recommendations: generateFollowupRecommendations(prioritized),
        summary: {
          totalNeedingFollowup: highValueNeeds.length,
          averageScore: Math.round(highValueNeeds.reduce((sum, l) => sum + l.lead_score, 0) / highValueNeeds.length) || 0
        }
      }
    });
  } catch (error) {
    log.error('Followup recommendations failed', { error: error.message });
    res.status(500).json({ ok: false, error: 'Failed to generate recommendations' });
  }
});

// Helper functions
function generateInsights(bySource, byScore) {
  const insights = [];
  
  // Best converting source
  const topSource = bySource[0];
  if (topSource && topSource.booking_rate > 0) {
    insights.push(`${topSource.submission_type} leads convert at ${topSource.booking_rate}% - your best source!`);
  }
  
  // Score insight
  const highScoreConversion = byScore.find(s => s.score_range.includes('High'));
  if (highScoreConversion && highScoreConversion.booking_rate > 20) {
    insights.push(`High-score leads convert ${highScoreConversion.booking_rate}% of the time - prioritize immediate follow-up`);
  }
  
  return insights;
}

function generateFollowupRecommendations(leads) {
  return leads.map(lead => {
    let action = 'Send personal email';
    let urgency = 'standard';
    
    if (lead.hoursSinceSubmission < 2) {
      action = 'Call immediately - strike while hot!';
      urgency = 'immediate';
    } else if (lead.hoursSinceSubmission < 24) {
      action = 'Send personal email today';
      urgency = 'high';
    } else if (lead.hoursSinceSubmission < 48) {
      action = 'Personal email + calendar link';
      urgency = 'medium';
    }
    
    return {
      lead,
      action,
      urgency,
      reason: `Score ${lead.lead_score}/100, ${lead.hoursSinceSubmission}h since submission`
    };
  });
}

export default router;