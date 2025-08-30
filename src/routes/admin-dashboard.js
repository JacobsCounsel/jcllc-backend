// Comprehensive Admin Dashboard for Email Automation System
import express from 'express';
import db from "../models/database-production.js";
import { log } from '../utils/logger.js';

const router = express.Router();

// Main Dashboard Route
router.get('/', async (req, res) => {
  try {
    // Get comprehensive stats
    const stats = await getDashboardStats();
    const recentActivity = await getRecentActivity();
    const automationStatus = await getAutomationStatus();
    const clientProfiles = await getClientProfileBreakdown();
    
    const dashboardHTML = generateDashboardHTML({
      stats,
      recentActivity,
      automationStatus,
      clientProfiles
    });
    
    res.setHeader('Content-Type', 'text/html');
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.send(dashboardHTML);
    
  } catch (error) {
    log.error('Dashboard error:', error);
    res.status(500).send('<h1>Dashboard Error</h1><p>Failed to load dashboard.</p>');
  }
});

// API endpoint for live data updates
router.get('/api/live-stats', async (req, res) => {
  try {
    const stats = await getDashboardStats();
    const recentActivity = await getRecentActivity(10); // Last 10 activities
    res.json({ stats, recentActivity, timestamp: new Date().toISOString() });
  } catch (error) {
    log.error('Live stats error:', error);
    res.status(500).json({ error: 'Failed to fetch live stats' });
  }
});

// Client Journey Visualization
router.get('/api/client-journeys', async (req, res) => {
  try {
    const journeys = await getClientJourneys();
    res.json(journeys);
  } catch (error) {
    log.error('Client journeys error:', error);
    res.status(500).json({ error: 'Failed to fetch client journeys' });
  }
});

// Email Performance Analytics
router.get('/api/email-performance', async (req, res) => {
  try {
    const performance = await getEmailPerformance();
    res.json(performance);
  } catch (error) {
    log.error('Email performance error:', error);
    res.status(500).json({ error: 'Failed to fetch email performance' });
  }
});

// Helper Functions

async function getDashboardStats() {
  const totalLeads = db.prepare('SELECT COUNT(*) as count FROM leads').get().count;
  const activeAutomations = db.prepare('SELECT COUNT(*) as count FROM email_automations WHERE status = ?').get('active').count;
  const pendingEmails = db.prepare('SELECT COUNT(*) as count FROM scheduled_emails WHERE status = ?').get('pending').count;
  const sentEmails = db.prepare('SELECT COUNT(*) as count FROM scheduled_emails WHERE status = ?').get('sent').count;
  // Try consultation_bookings table first, fallback to estimating from paused automations
  let consultationsBooked = 0;
  try {
    consultationsBooked = db.prepare('SELECT COUNT(*) as count FROM consultation_bookings').get().count;
  } catch (error) {
    // Fallback: count paused automations due to consultations
    try {
      consultationsBooked = db.prepare(`SELECT COUNT(*) as count FROM email_automations WHERE paused_reason LIKE '%consultation%'`).get().count;
    } catch (e) {
      consultationsBooked = 0;
    }
  }
  
  // Growth metrics (last 30 days vs previous 30 days)
  const last30Days = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const last60Days = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString();
  
  const recentLeads = db.prepare('SELECT COUNT(*) as count FROM leads WHERE created_at > ?').get(last30Days).count;
  const previousLeads = db.prepare('SELECT COUNT(*) as count FROM leads WHERE created_at BETWEEN ? AND ?').get(last60Days, last30Days).count;
  
  const leadGrowth = previousLeads > 0 ? ((recentLeads - previousLeads) / previousLeads * 100).toFixed(1) : 0;
  
  // Average lead score
  const avgLeadScore = db.prepare('SELECT AVG(lead_score) as avg FROM leads WHERE lead_score > 0').get().avg || 0;
  
  // Client profile breakdown
  const athleteLeads = db.prepare(`SELECT COUNT(*) as count FROM leads WHERE form_data LIKE '%athlete%' OR form_data LIKE '%sports%'`).get().count;
  const creatorLeads = db.prepare(`SELECT COUNT(*) as count FROM leads WHERE form_data LIKE '%creator%' OR form_data LIKE '%content%'`).get().count;
  const startupLeads = db.prepare(`SELECT COUNT(*) as count FROM leads WHERE form_data LIKE '%startup%' OR form_data LIKE '%venture%'`).get().count;
  
  return {
    totalLeads,
    activeAutomations,
    pendingEmails,
    sentEmails,
    consultationsBooked,
    leadGrowth: parseFloat(leadGrowth),
    avgLeadScore: Math.round(avgLeadScore),
    clientProfiles: {
      athlete: athleteLeads,
      creator: creatorLeads,
      startup: startupLeads,
      other: totalLeads - athleteLeads - creatorLeads - startupLeads
    }
  };
}

async function getRecentActivity(limit = 20) {
  const activities = db.prepare(`
    SELECT 
      'lead' as type,
      first_name || ' ' || last_name as name,
      email,
      submission_type,
      lead_score,
      created_at
    FROM leads 
    WHERE created_at > datetime('now', '-7 days')
    
    UNION ALL
    
    SELECT
      'email' as type,
      first_name || ' ' || last_name as name,
      email,
      template_type as submission_type,
      NULL as lead_score,
      sent_at as created_at
    FROM scheduled_emails
    WHERE sent_at > datetime('now', '-7 days')
    AND status = 'sent'
    
    ORDER BY created_at DESC
    LIMIT ?
  `).all(limit);
  
  return activities.map(activity => ({
    ...activity,
    timeAgo: getTimeAgo(new Date(activity.created_at))
  }));
}

async function getAutomationStatus() {
  const automations = db.prepare(`
    SELECT 
      id as automation_id,
      email,
      status,
      pathway_name,
      created_at,
      paused_reason
    FROM email_automations 
    ORDER BY created_at DESC
    LIMIT 50
  `).all();
  
  return automations.map(automation => ({
    ...automation,
    nextEmailIn: automation.next_email_at ? getTimeUntil(new Date(automation.next_email_at)) : null
  }));
}

async function getClientProfileBreakdown() {
  const profiles = db.prepare(`
    SELECT 
      submission_type,
      COUNT(*) as count,
      AVG(lead_score) as avg_score,
      COUNT(CASE WHEN lead_score >= 70 THEN 1 END) as high_value_count
    FROM leads 
    GROUP BY submission_type
    ORDER BY count DESC
  `).all();
  
  return profiles;
}

async function getClientJourneys() {
  const journeys = db.prepare(`
    SELECT 
      ea.id as automation_id,
      ea.email,
      ea.status,
      ea.pathway_name,
      ea.created_at,
      l.first_name,
      l.last_name,
      l.submission_type,
      l.lead_score,
      COUNT(se.id) as emails_sent,
      MAX(se.sent_at) as last_email_sent
    FROM email_automations ea
    LEFT JOIN leads l ON ea.email = l.email
    LEFT JOIN scheduled_emails se ON ea.email = se.email AND se.status = 'sent'
    GROUP BY ea.id
    ORDER BY ea.created_at DESC
    LIMIT 100
  `).all();
  
  return journeys.map(journey => ({
    ...journey,
    progress: calculateJourneyProgress(1, journey.submission_type), // Default to step 1
    lastActivity: journey.last_email_sent ? getTimeAgo(new Date(journey.last_email_sent)) : 'No emails sent'
  }));
}

async function getEmailPerformance() {
  const performance = db.prepare(`
    SELECT 
      template_type,
      COUNT(*) as sent_count,
      COUNT(CASE WHEN status = 'sent' THEN 1 END) as delivered_count,
      AVG(CASE WHEN sent_at IS NOT NULL THEN 1 ELSE 0 END) as delivery_rate
    FROM scheduled_emails 
    WHERE created_at > datetime('now', '-30 days')
    GROUP BY template_type
    ORDER BY sent_count DESC
  `).all();
  
  return performance;
}

// Utility Functions
function getTimeAgo(date) {
  const now = new Date();
  const diff = now - date;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  
  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (minutes > 0) return `${minutes}m ago`;
  return 'Just now';
}

function getTimeUntil(date) {
  const now = new Date();
  const diff = date - now;
  if (diff <= 0) return 'Now';
  
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  
  if (days > 0) return `${days}d`;
  if (hours > 0) return `${hours}h`;
  return `${minutes}m`;
}

function calculateJourneyProgress(currentStep, submissionType) {
  const stepMaps = {
    'estate-intake': 6,
    'business-formation': 5,
    'brand-protection': 5,
    'outside-counsel': 4,
    'newsletter': 3,
    default: 4
  };
  
  const totalSteps = stepMaps[submissionType] || stepMaps.default;
  return Math.round((currentStep / totalSteps) * 100);
}

function generateDashboardHTML({ stats, recentActivity, automationStatus, clientProfiles }) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Jacobs Counsel - Email Automation Dashboard</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
      color: #333;
    }
    
    .dashboard-container {
      max-width: 1400px;
      margin: 0 auto;
      padding: 20px;
    }
    
    .header {
      background: rgba(255, 255, 255, 0.95);
      backdrop-filter: blur(10px);
      border-radius: 16px;
      padding: 30px;
      margin-bottom: 30px;
      text-align: center;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
    }
    
    .header h1 {
      font-size: 2.5em;
      font-weight: 700;
      color: #1f2937;
      margin-bottom: 10px;
    }
    
    .header .subtitle {
      color: #6b7280;
      font-size: 1.1em;
    }
    
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 20px;
      margin-bottom: 30px;
    }
    
    .stat-card {
      background: rgba(255, 255, 255, 0.95);
      backdrop-filter: blur(10px);
      border-radius: 16px;
      padding: 25px;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
      border: 1px solid rgba(255, 255, 255, 0.2);
      transition: transform 0.2s ease;
    }
    
    .stat-card:hover {
      transform: translateY(-2px);
    }
    
    .stat-number {
      font-size: 2.5em;
      font-weight: bold;
      margin-bottom: 5px;
      background: linear-gradient(45deg, #ff4d00, #e63900);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    
    .stat-label {
      color: #6b7280;
      font-weight: 500;
      font-size: 0.9em;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
    
    .growth-indicator {
      display: flex;
      align-items: center;
      margin-top: 10px;
      font-size: 0.85em;
      font-weight: 600;
    }
    
    .growth-positive { color: #10b981; }
    .growth-negative { color: #ef4444; }
    
    .dashboard-grid {
      display: grid;
      grid-template-columns: 1fr 400px;
      gap: 30px;
      margin-bottom: 30px;
    }
    
    .main-panel {
      background: rgba(255, 255, 255, 0.95);
      backdrop-filter: blur(10px);
      border-radius: 16px;
      padding: 30px;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
    }
    
    .side-panel {
      background: rgba(255, 255, 255, 0.95);
      backdrop-filter: blur(10px);
      border-radius: 16px;
      padding: 30px;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
      height: fit-content;
    }
    
    .panel-title {
      font-size: 1.4em;
      font-weight: 600;
      margin-bottom: 20px;
      color: #1f2937;
    }
    
    .activity-item {
      padding: 15px 0;
      border-bottom: 1px solid #f3f4f6;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    
    .activity-item:last-child {
      border-bottom: none;
    }
    
    .activity-info h4 {
      font-size: 0.9em;
      font-weight: 600;
      color: #1f2937;
      margin-bottom: 4px;
    }
    
    .activity-info p {
      font-size: 0.8em;
      color: #6b7280;
    }
    
    .activity-time {
      font-size: 0.8em;
      color: #9ca3af;
    }
    
    .client-profiles {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 15px;
      margin-top: 20px;
    }
    
    .profile-card {
      background: linear-gradient(45deg, #f8fafc, #e2e8f0);
      padding: 20px;
      border-radius: 12px;
      text-align: center;
    }
    
    .profile-count {
      font-size: 1.8em;
      font-weight: bold;
      color: #1f2937;
    }
    
    .profile-label {
      font-size: 0.85em;
      color: #6b7280;
      text-transform: capitalize;
    }
    
    .automation-list {
      max-height: 400px;
      overflow-y: auto;
    }
    
    .automation-item {
      padding: 12px 0;
      border-bottom: 1px solid #f3f4f6;
    }
    
    .automation-email {
      font-weight: 600;
      font-size: 0.9em;
      color: #1f2937;
    }
    
    .automation-status {
      display: inline-block;
      padding: 4px 8px;
      border-radius: 6px;
      font-size: 0.75em;
      font-weight: 600;
      text-transform: uppercase;
      margin-top: 5px;
    }
    
    .status-active {
      background: #dcfce7;
      color: #166534;
    }
    
    .status-paused {
      background: #fef3c7;
      color: #92400e;
    }
    
    .status-completed {
      background: #dbeafe;
      color: #1e40af;
    }
    
    .refresh-btn {
      position: fixed;
      bottom: 30px;
      right: 30px;
      background: linear-gradient(45deg, #ff4d00, #e63900);
      color: white;
      border: none;
      width: 60px;
      height: 60px;
      border-radius: 50%;
      font-size: 1.5em;
      cursor: pointer;
      box-shadow: 0 8px 25px rgba(255, 77, 0, 0.3);
      transition: transform 0.2s ease;
    }
    
    .refresh-btn:hover {
      transform: scale(1.1);
    }
    
    @media (max-width: 768px) {
      .dashboard-grid {
        grid-template-columns: 1fr;
      }
      
      .stats-grid {
        grid-template-columns: 1fr;
      }
      
      .client-profiles {
        grid-template-columns: 1fr;
      }
    }
  </style>
</head>
<body>
  <div class="dashboard-container">
    <div class="header">
      <h1>⚖️ Jacobs Counsel</h1>
      <p class="subtitle">Strategic Email Automation Dashboard</p>
    </div>
    
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-number">${stats.totalLeads}</div>
        <div class="stat-label">Total Leads</div>
        <div class="growth-indicator ${stats.leadGrowth >= 0 ? 'growth-positive' : 'growth-negative'}">
          ${stats.leadGrowth >= 0 ? '↗' : '↘'} ${Math.abs(stats.leadGrowth)}% this month
        </div>
      </div>
      
      <div class="stat-card">
        <div class="stat-number">${stats.activeAutomations}</div>
        <div class="stat-label">Active Automations</div>
        <div class="growth-indicator">
          📧 ${stats.pendingEmails} emails pending
        </div>
      </div>
      
      <div class="stat-card">
        <div class="stat-number">${stats.sentEmails}</div>
        <div class="stat-label">Emails Sent</div>
        <div class="growth-indicator">
          🎯 Strategic email system active
        </div>
      </div>
      
      <div class="stat-card">
        <div class="stat-number">${stats.consultationsBooked}</div>
        <div class="stat-label">Consultations Booked</div>
        <div class="growth-indicator">
          ⭐ Avg lead score: ${stats.avgLeadScore}
        </div>
      </div>
    </div>
    
    <div class="dashboard-grid">
      <div class="main-panel">
        <h2 class="panel-title">📊 Client Journey Automation Status</h2>
        <div class="automation-list">
          ${automationStatus.map(automation => `
            <div class="automation-item">
              <div class="automation-email">${automation.email}</div>
              <div class="automation-status status-${automation.status}">
                ${automation.status} - Step ${automation.current_step}
              </div>
              ${automation.nextEmailIn ? `<div style="font-size: 0.8em; color: #6b7280; margin-top: 5px;">Next: ${automation.nextEmailIn}</div>` : ''}
            </div>
          `).join('')}
        </div>
      </div>
      
      <div class="side-panel">
        <h2 class="panel-title">🕐 Recent Activity</h2>
        <div class="activity-list">
          ${recentActivity.slice(0, 10).map(activity => `
            <div class="activity-item">
              <div class="activity-info">
                <h4>${activity.name || 'Unknown'}</h4>
                <p>${activity.type === 'lead' ? '📝 New lead' : '📧 Email sent'} - ${activity.submission_type}</p>
              </div>
              <div class="activity-time">${activity.timeAgo}</div>
            </div>
          `).join('')}
        </div>
        
        <h3 class="panel-title" style="margin-top: 30px;">🎯 Client Profiles</h3>
        <div class="client-profiles">
          <div class="profile-card">
            <div class="profile-count">${stats.clientProfiles.athlete}</div>
            <div class="profile-label">Athletes</div>
          </div>
          <div class="profile-card">
            <div class="profile-count">${stats.clientProfiles.creator}</div>
            <div class="profile-label">Creators</div>
          </div>
          <div class="profile-card">
            <div class="profile-count">${stats.clientProfiles.startup}</div>
            <div class="profile-label">Startups</div>
          </div>
          <div class="profile-card">
            <div class="profile-count">${stats.clientProfiles.other}</div>
            <div class="profile-label">Other</div>
          </div>
        </div>
      </div>
    </div>
  </div>
  
  <button class="refresh-btn" onclick="window.location.reload()" title="Refresh Dashboard">
    🔄
  </button>
  
  <script>
    // Auto-refresh every 30 seconds
    setInterval(() => {
      window.location.reload();
    }, 30000);
    
    // Add smooth transitions
    document.addEventListener('DOMContentLoaded', () => {
      const cards = document.querySelectorAll('.stat-card, .main-panel, .side-panel');
      cards.forEach((card, index) => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(20px)';
        
        setTimeout(() => {
          card.style.transition = 'all 0.5s ease';
          card.style.opacity = '1';
          card.style.transform = 'translateY(0)';
        }, index * 100);
      });
    });
  </script>
</body>
</html>`;
}

export default router;