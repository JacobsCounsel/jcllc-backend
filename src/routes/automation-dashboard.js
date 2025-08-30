// Automation Management Dashboard
// Complete visibility and control over email automation sequences

import express from 'express';
import Database from 'better-sqlite3';
import automationEngine from '../services/automationEngine.js';

const router = express.Router();
const db = new Database('./legal_email_system.db');

// Main automation dashboard
router.get('/', (req, res) => {
  const stats = db.prepare(`
    SELECT 
      (SELECT COUNT(*) FROM subscribers) as total_subscribers,
      (SELECT COUNT(*) FROM active_automations WHERE status = 'active') as active_automations,
      (SELECT COUNT(*) FROM active_automations WHERE status = 'paused') as paused_automations,
      (SELECT COUNT(*) FROM email_history WHERE sent_at > datetime('now', '-24 hours')) as emails_24h,
      (SELECT COUNT(*) FROM consultation_bookings WHERE created_at > datetime('now', '-7 days')) as bookings_7d
  `).get();

  const recentActivity = db.prepare(`
    SELECT 
      ae.event_type,
      ae.created_at,
      s.email,
      s.first_name,
      seq.name as sequence_name
    FROM automation_events ae
    JOIN subscribers s ON ae.subscriber_id = s.id
    JOIN active_automations aa ON ae.automation_id = aa.id
    JOIN automation_sequences seq ON aa.sequence_id = seq.id
    ORDER BY ae.created_at DESC
    LIMIT 20
  `).all();

  const activeSubscribers = db.prepare(`
    SELECT 
      s.id,
      s.email,
      s.first_name,
      s.last_name,
      s.client_profile,
      s.lead_score,
      aa.status as automation_status,
      aa.current_email_index,
      aa.next_email_at,
      seq.name as sequence_name,
      aa.id as automation_id,
      (SELECT COUNT(*) FROM sequence_emails WHERE sequence_id = aa.sequence_id) as total_emails
    FROM subscribers s
    JOIN active_automations aa ON s.id = aa.subscriber_id
    JOIN automation_sequences seq ON aa.sequence_id = seq.id
    WHERE aa.status IN ('active', 'paused')
    ORDER BY aa.next_email_at ASC
  `).all();

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Email Automation Dashboard - Jacobs Counsel</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: linear-gradient(135deg, #1f2937 0%, #374151 100%);
      min-height: 100vh;
      padding: 20px;
      color: #1f2937;
    }
    
    .container {
      max-width: 1600px;
      margin: 0 auto;
    }
    
    .header {
      background: white;
      border-radius: 16px;
      padding: 30px;
      margin-bottom: 30px;
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
    }
    
    .header h1 {
      font-size: 2.5em;
      background: linear-gradient(135deg, #ff4d00, #e63900);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      margin-bottom: 10px;
    }
    
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 20px;
      margin-bottom: 30px;
    }
    
    .stat-card {
      background: white;
      border-radius: 12px;
      padding: 25px;
      box-shadow: 0 5px 20px rgba(0, 0, 0, 0.1);
      text-align: center;
      transition: transform 0.2s;
    }
    
    .stat-card:hover {
      transform: translateY(-2px);
    }
    
    .stat-value {
      font-size: 2.5em;
      font-weight: 700;
      background: linear-gradient(135deg, #ff4d00, #e63900);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    
    .stat-label {
      color: #6b7280;
      font-size: 0.9em;
      margin-top: 5px;
    }
    
    .main-grid {
      display: grid;
      grid-template-columns: 2fr 1fr;
      gap: 30px;
      margin-bottom: 30px;
    }
    
    .subscriber-table {
      background: white;
      border-radius: 16px;
      padding: 25px;
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
      overflow-x: auto;
    }
    
    .subscriber-table h2 {
      margin-bottom: 20px;
      color: #1f2937;
    }
    
    table {
      width: 100%;
      border-collapse: collapse;
    }
    
    th {
      background: linear-gradient(135deg, #1f2937 0%, #374151 100%);
      color: white;
      padding: 12px;
      text-align: left;
      font-weight: 600;
    }
    
    td {
      padding: 12px;
      border-bottom: 1px solid #e5e7eb;
    }
    
    tr:hover {
      background: #f9fafb;
    }
    
    .profile-badge {
      display: inline-block;
      padding: 4px 10px;
      border-radius: 12px;
      font-size: 0.85em;
      font-weight: 600;
      background: linear-gradient(135deg, #3b82f6, #2563eb);
      color: white;
    }
    
    .profile-badge.athlete { background: linear-gradient(135deg, #10b981, #059669); }
    .profile-badge.creator { background: linear-gradient(135deg, #8b5cf6, #7c3aed); }
    .profile-badge.startup { background: linear-gradient(135deg, #f59e0b, #d97706); }
    .profile-badge.family { background: linear-gradient(135deg, #ec4899, #db2777); }
    
    .status-badge {
      display: inline-block;
      padding: 4px 10px;
      border-radius: 12px;
      font-size: 0.85em;
      font-weight: 600;
    }
    
    .status-badge.active {
      background: #d1fae5;
      color: #065f46;
    }
    
    .status-badge.paused {
      background: #fed7aa;
      color: #92400e;
    }
    
    .progress-bar {
      width: 100%;
      height: 8px;
      background: #e5e7eb;
      border-radius: 4px;
      overflow: hidden;
    }
    
    .progress-fill {
      height: 100%;
      background: linear-gradient(90deg, #10b981, #059669);
      transition: width 0.3s;
    }
    
    .action-buttons {
      display: flex;
      gap: 8px;
    }
    
    .btn {
      padding: 6px 12px;
      border: none;
      border-radius: 6px;
      font-size: 0.85em;
      cursor: pointer;
      font-weight: 600;
      transition: all 0.2s;
    }
    
    .btn-pause {
      background: #fbbf24;
      color: #78350f;
    }
    
    .btn-resume {
      background: #34d399;
      color: #064e3b;
    }
    
    .btn-exit {
      background: #f87171;
      color: #7f1d1d;
    }
    
    .btn-view {
      background: #60a5fa;
      color: #1e3a8a;
    }
    
    .activity-feed {
      background: white;
      border-radius: 16px;
      padding: 25px;
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
    }
    
    .activity-feed h2 {
      margin-bottom: 20px;
      color: #1f2937;
    }
    
    .activity-item {
      padding: 15px;
      border-left: 3px solid #ff4d00;
      margin-bottom: 15px;
      background: #f9fafb;
      border-radius: 0 8px 8px 0;
    }
    
    .activity-time {
      color: #6b7280;
      font-size: 0.85em;
    }
    
    .activity-event {
      font-weight: 600;
      color: #1f2937;
      margin: 5px 0;
    }
    
    .activity-details {
      color: #4b5563;
      font-size: 0.9em;
    }
    
    .refresh-notice {
      text-align: center;
      color: #6b7280;
      margin-top: 20px;
      font-size: 0.9em;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>⚡ Email Automation Dashboard</h1>
      <p style="color: #6b7280;">Complete visibility and control over your email automation sequences</p>
    </div>
    
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-value">${stats.total_subscribers}</div>
        <div class="stat-label">Total Subscribers</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${stats.active_automations}</div>
        <div class="stat-label">Active Automations</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${stats.paused_automations}</div>
        <div class="stat-label">Paused Automations</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${stats.emails_24h}</div>
        <div class="stat-label">Emails (24h)</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${stats.bookings_7d}</div>
        <div class="stat-label">Bookings (7d)</div>
      </div>
    </div>
    
    <div class="main-grid">
      <div class="subscriber-table">
        <h2>🎯 Active Subscriber Journeys</h2>
        <table>
          <thead>
            <tr>
              <th>Subscriber</th>
              <th>Profile</th>
              <th>Score</th>
              <th>Sequence</th>
              <th>Progress</th>
              <th>Status</th>
              <th>Next Email</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            ${activeSubscribers.map(sub => {
              const progress = ((sub.current_email_index / sub.total_emails) * 100).toFixed(0);
              const profileClass = sub.client_profile?.replace('_', '-').toLowerCase() || 'default';
              const nextEmailTime = sub.next_email_at ? new Date(sub.next_email_at).toLocaleString() : 'N/A';
              
              return `
              <tr>
                <td>
                  <strong>${sub.first_name || ''} ${sub.last_name || ''}</strong><br>
                  <span style="color: #6b7280; font-size: 0.9em;">${sub.email}</span>
                </td>
                <td><span class="profile-badge ${profileClass}">${sub.client_profile?.replace('_', ' ')}</span></td>
                <td><strong>${sub.lead_score}</strong></td>
                <td>${sub.sequence_name}</td>
                <td>
                  <div class="progress-bar">
                    <div class="progress-fill" style="width: ${progress}%"></div>
                  </div>
                  <span style="font-size: 0.85em; color: #6b7280;">${sub.current_email_index}/${sub.total_emails}</span>
                </td>
                <td><span class="status-badge ${sub.automation_status}">${sub.automation_status}</span></td>
                <td style="font-size: 0.9em;">${nextEmailTime}</td>
                <td>
                  <div class="action-buttons">
                    ${sub.automation_status === 'active' ? 
                      `<button class="btn btn-pause" onclick="pauseAutomation(${sub.automation_id})">⏸</button>` :
                      `<button class="btn btn-resume" onclick="resumeAutomation(${sub.automation_id})">▶</button>`
                    }
                    <button class="btn btn-exit" onclick="exitAutomation(${sub.automation_id})">✕</button>
                    <button class="btn btn-view" onclick="viewJourney('${sub.email}')">👁</button>
                    <button class="btn btn-view" onclick="viewEmails('${sub.email}')">📧</button>
                  </div>
                </td>
              </tr>
              `;
            }).join('')}
          </tbody>
        </table>
        ${activeSubscribers.length === 0 ? '<p style="text-align: center; color: #6b7280; padding: 40px;">No active automations</p>' : ''}
      </div>
      
      <div class="activity-feed">
        <h2>📊 Recent Activity</h2>
        ${recentActivity.map(activity => {
          const time = new Date(activity.created_at).toLocaleString();
          const eventLabel = activity.event_type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
          
          return `
          <div class="activity-item">
            <div class="activity-time">${time}</div>
            <div class="activity-event">${eventLabel}</div>
            <div class="activity-details">
              ${activity.first_name || activity.email}<br>
              ${activity.sequence_name}
            </div>
          </div>
          `;
        }).join('')}
        ${recentActivity.length === 0 ? '<p style="text-align: center; color: #6b7280; padding: 40px;">No recent activity</p>' : ''}
      </div>
    </div>
    
    <div class="refresh-notice">
      Dashboard refreshes every 30 seconds • Last updated: ${new Date().toLocaleTimeString()}
    </div>
  </div>
  
  <script>
    // Auto-refresh every 30 seconds
    setTimeout(() => location.reload(), 30000);
    
    async function pauseAutomation(id) {
      await fetch(\`/automations/pause/\${id}\`, { method: 'POST' });
      location.reload();
    }
    
    async function resumeAutomation(id) {
      await fetch(\`/automations/resume/\${id}\`, { method: 'POST' });
      location.reload();
    }
    
    async function exitAutomation(id) {
      if (confirm('Exit this automation sequence?')) {
        await fetch(\`/automations/exit/\${id}\`, { method: 'POST' });
        location.reload();
      }
    }
    
    function viewJourney(email) {
      window.open(\`/automations/journey/\${encodeURIComponent(email)}\`, '_blank');
    }
    
    function viewEmails(email) {
      window.open(\`/automations/emails/\${encodeURIComponent(email)}\`, '_blank');
    }
  </script>
</body>
</html>
  `;
  
  res.send(html);
});

// Pause automation
router.post('/pause/:id', async (req, res) => {
  await automationEngine.pauseAutomation(req.params.id, 'Manual pause from dashboard');
  res.json({ success: true });
});

// Resume automation
router.post('/resume/:id', async (req, res) => {
  await automationEngine.resumeAutomation(req.params.id);
  res.json({ success: true });
});

// Exit automation
router.post('/exit/:id', async (req, res) => {
  await automationEngine.completeAutomation(req.params.id, 'Manual exit from dashboard');
  res.json({ success: true });
});

// View subscriber journey
router.get('/journey/:email', async (req, res) => {
  const journey = await automationEngine.getSubscriberJourney(req.params.email);
  
  if (!journey) {
    return res.status(404).send('Subscriber not found');
  }
  
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Subscriber Journey - ${journey.subscriber.email}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #f3f4f6;
      padding: 40px;
      color: #1f2937;
    }
    
    .container {
      max-width: 1200px;
      margin: 0 auto;
      background: white;
      border-radius: 16px;
      padding: 40px;
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
    }
    
    h1 {
      color: #1f2937;
      margin-bottom: 10px;
    }
    
    .subscriber-info {
      background: #f9fafb;
      padding: 20px;
      border-radius: 8px;
      margin-bottom: 30px;
    }
    
    .timeline {
      position: relative;
      padding-left: 40px;
    }
    
    .timeline::before {
      content: '';
      position: absolute;
      left: 10px;
      top: 0;
      bottom: 0;
      width: 2px;
      background: #e5e7eb;
    }
    
    .timeline-item {
      position: relative;
      margin-bottom: 30px;
    }
    
    .timeline-item::before {
      content: '';
      position: absolute;
      left: -34px;
      top: 5px;
      width: 12px;
      height: 12px;
      border-radius: 50%;
      background: #ff4d00;
      border: 2px solid white;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }
    
    .timeline-date {
      color: #6b7280;
      font-size: 0.9em;
      margin-bottom: 5px;
    }
    
    .timeline-content {
      background: #f9fafb;
      padding: 15px;
      border-radius: 8px;
      border-left: 3px solid #ff4d00;
    }
    
    .timeline-title {
      font-weight: 600;
      color: #1f2937;
      margin-bottom: 5px;
    }
    
    .timeline-details {
      color: #4b5563;
      font-size: 0.95em;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>📍 Subscriber Journey</h1>
    
    <div class="subscriber-info">
      <h2>${journey.subscriber.first_name} ${journey.subscriber.last_name}</h2>
      <p><strong>Email:</strong> ${journey.subscriber.email}</p>
      <p><strong>Profile:</strong> ${journey.subscriber.client_profile}</p>
      <p><strong>Lead Score:</strong> ${journey.subscriber.lead_score}</p>
      <p><strong>Status:</strong> ${journey.subscriber.status}</p>
      <p><strong>Joined:</strong> ${new Date(journey.subscriber.created_at).toLocaleString()}</p>
    </div>
    
    <h2>Journey Timeline</h2>
    <div class="timeline">
      ${journey.events.map(event => `
        <div class="timeline-item">
          <div class="timeline-date">${new Date(event.created_at).toLocaleString()}</div>
          <div class="timeline-content">
            <div class="timeline-title">${event.event_type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}</div>
            <div class="timeline-details">${event.event_data || ''}</div>
          </div>
        </div>
      `).join('')}
    </div>
    
    <h2>Email History</h2>
    <table style="width: 100%; border-collapse: collapse;">
      <thead>
        <tr style="background: #f3f4f6;">
          <th style="padding: 12px; text-align: left;">Template</th>
          <th style="padding: 12px; text-align: left;">Subject</th>
          <th style="padding: 12px; text-align: left;">Status</th>
          <th style="padding: 12px; text-align: left;">Sent At</th>
        </tr>
      </thead>
      <tbody>
        ${journey.emails.map(email => `
          <tr>
            <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">${email.template_key}</td>
            <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">${email.subject_line}</td>
            <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">
              <span style="padding: 4px 8px; border-radius: 4px; font-size: 0.85em; background: ${
                email.status === 'sent' ? '#d1fae5; color: #065f46' :
                email.status === 'opened' ? '#dbeafe; color: #1e3a8a' :
                email.status === 'clicked' ? '#e9d5ff; color: #581c87' :
                '#fee2e2; color: #7f1d1d'
              };">${email.status}</span>
            </td>
            <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">${email.sent_at ? new Date(email.sent_at).toLocaleString() : 'N/A'}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  </div>
</body>
</html>
  `;
  
  res.send(html);
});

// View subscriber emails with previews
router.get('/emails/:email', async (req, res) => {
  const subscriber = db.prepare('SELECT * FROM subscribers WHERE email = ?').get(req.params.email);
  
  if (!subscriber) {
    return res.status(404).send('Subscriber not found');
  }
  
  const emails = db.prepare(`
    SELECT eh.*, aa.sequence_id, seq.name as sequence_name
    FROM email_history eh
    JOIN active_automations aa ON eh.automation_id = aa.id
    JOIN automation_sequences seq ON aa.sequence_id = seq.id
    WHERE eh.subscriber_id = ?
    ORDER BY eh.sent_at DESC
  `).all(subscriber.id);
  
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Email History - ${subscriber.email}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #f3f4f6;
      padding: 40px;
      color: #1f2937;
    }
    
    .container {
      max-width: 1200px;
      margin: 0 auto;
      background: white;
      border-radius: 16px;
      padding: 40px;
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
    }
    
    h1 {
      color: #1f2937;
      margin-bottom: 10px;
    }
    
    .subscriber-info {
      background: #f9fafb;
      padding: 20px;
      border-radius: 8px;
      margin-bottom: 30px;
    }
    
    .email-grid {
      display: grid;
      gap: 30px;
    }
    
    .email-card {
      background: #f9fafb;
      border-radius: 12px;
      padding: 25px;
      border-left: 4px solid #ff4d00;
    }
    
    .email-header {
      display: flex;
      justify-content: between;
      align-items: start;
      margin-bottom: 15px;
    }
    
    .email-subject {
      font-size: 1.2em;
      font-weight: 600;
      color: #1f2937;
      margin-bottom: 5px;
    }
    
    .email-meta {
      color: #6b7280;
      font-size: 0.9em;
      margin-bottom: 15px;
    }
    
    .status-badge {
      display: inline-block;
      padding: 4px 10px;
      border-radius: 12px;
      font-size: 0.85em;
      font-weight: 600;
      margin-left: auto;
    }
    
    .status-badge.sent {
      background: #d1fae5;
      color: #065f46;
    }
    
    .status-badge.failed {
      background: #fee2e2;
      color: #7f1d1d;
    }
    
    .email-actions {
      margin-top: 15px;
      display: flex;
      gap: 10px;
    }
    
    .btn {
      padding: 8px 16px;
      border: none;
      border-radius: 6px;
      font-size: 0.9em;
      cursor: pointer;
      font-weight: 600;
      text-decoration: none;
      display: inline-block;
    }
    
    .btn-preview {
      background: #3b82f6;
      color: white;
    }
    
    .btn-preview:hover {
      background: #2563eb;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>📧 Email History</h1>
    
    <div class="subscriber-info">
      <h2>${subscriber.first_name} ${subscriber.last_name}</h2>
      <p><strong>Email:</strong> ${subscriber.email}</p>
      <p><strong>Profile:</strong> ${subscriber.client_profile}</p>
      <p><strong>Lead Score:</strong> ${subscriber.lead_score}</p>
    </div>
    
    <div class="email-grid">
      ${emails.map(email => {
        const sentTime = email.sent_at ? new Date(email.sent_at).toLocaleString() : 'Not sent';
        
        return `
        <div class="email-card">
          <div class="email-header">
            <div style="flex: 1;">
              <div class="email-subject">${email.subject_line}</div>
              <div class="email-meta">
                Template: ${email.template_key} • Sequence: ${email.sequence_name}<br>
                ${sentTime}
              </div>
            </div>
            <span class="status-badge ${email.status}">${email.status}</span>
          </div>
          
          <div class="email-actions">
            <a href="/api/email-automations/preview-template/${email.template_key}?firstName=${subscriber.first_name}&email=${subscriber.email}&clientProfile=${subscriber.client_profile}" 
               class="btn btn-preview" target="_blank">
              🔍 Preview Email
            </a>
          </div>
        </div>
        `;
      }).join('')}
      
      ${emails.length === 0 ? '<p style="text-align: center; color: #6b7280; padding: 40px;">No emails sent yet</p>' : ''}
    </div>
  </div>
</body>
</html>
  `;
  
  res.send(html);
});

export default router;