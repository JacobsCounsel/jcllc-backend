// src/models/database.js - Simple SQLite database for lead analytics
import Database from 'better-sqlite3';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { log } from '../utils/logger.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const dbPath = join(__dirname, '../../data/leads.db');

// Initialize database
const db = new Database(dbPath);

// Enable WAL mode for better performance
db.pragma('journal_mode = WAL');

// Create tables
const initTables = () => {
  // Main leads table
  db.exec(`
    CREATE TABLE IF NOT EXISTS leads (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      submission_id TEXT UNIQUE NOT NULL,
      email TEXT NOT NULL,
      first_name TEXT,
      last_name TEXT,
      phone TEXT,
      business_name TEXT,
      submission_type TEXT NOT NULL,
      lead_score INTEGER NOT NULL,
      priority TEXT NOT NULL,
      source TEXT,
      calendly_link TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      form_data TEXT -- JSON string of all form data
    )
  `);

  // Lead interactions table (track all touchpoints)
  db.exec(`
    CREATE TABLE IF NOT EXISTS lead_interactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      lead_id INTEGER NOT NULL,
      interaction_type TEXT NOT NULL, -- 'email_sent', 'calendly_booked', 'calendly_canceled', 'mailchimp_tagged', 'follow_up_scheduled'
      details TEXT, -- JSON string with specifics
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (lead_id) REFERENCES leads (id)
    )
  `);

  // Follow-up reminders table
  db.exec(`
    CREATE TABLE IF NOT EXISTS follow_up_reminders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      lead_id INTEGER NOT NULL,
      reminder_type TEXT NOT NULL, -- 'immediate', 'same_day', 'next_day', 'three_day'
      scheduled_for DATETIME NOT NULL,
      status TEXT DEFAULT 'pending', -- 'pending', 'sent', 'cancelled'
      message TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      sent_at DATETIME,
      FOREIGN KEY (lead_id) REFERENCES leads (id)
    )
  `);

  // Daily analytics summary
  db.exec(`
    CREATE TABLE IF NOT EXISTS daily_stats (
      date TEXT PRIMARY KEY,
      total_submissions INTEGER DEFAULT 0,
      high_value_leads INTEGER DEFAULT 0,
      calendly_bookings INTEGER DEFAULT 0,
      avg_lead_score REAL DEFAULT 0,
      top_source TEXT,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  log.info('Database tables initialized');
};

// Initialize on import
initTables();

// Lead operations
export const leadDb = {
  // Insert new lead
  insertLead: (leadData) => {
    const stmt = db.prepare(`
      INSERT INTO leads (
        submission_id, email, first_name, last_name, phone, business_name,
        submission_type, lead_score, priority, source, calendly_link, form_data
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    try {
      const result = stmt.run(
        leadData.submissionId,
        leadData.email,
        leadData.firstName || null,
        leadData.lastName || null,
        leadData.phone || null,
        leadData.businessName || null,
        leadData.submissionType,
        leadData.leadScore,
        leadData.priority,
        leadData.source || null,
        leadData.calendlyLink,
        JSON.stringify(leadData.formData)
      );
      
      log.info('Lead inserted', { id: result.lastInsertRowid, email: leadData.email });
      return result.lastInsertRowid;
    } catch (error) {
      log.error('Failed to insert lead', { error: error.message, email: leadData.email });
      throw error;
    }
  },

  // Track interaction
  logInteraction: (leadId, type, details = {}) => {
    const stmt = db.prepare(`
      INSERT INTO lead_interactions (lead_id, interaction_type, details)
      VALUES (?, ?, ?)
    `);
    
    try {
      stmt.run(leadId, type, JSON.stringify(details));
      log.debug('Interaction logged', { leadId, type });
    } catch (error) {
      log.error('Failed to log interaction', { error: error.message, leadId, type });
    }
  },

  // Get lead by email (for tracking existing leads)
  getLeadByEmail: (email) => {
    const stmt = db.prepare('SELECT * FROM leads WHERE email = ? ORDER BY created_at DESC LIMIT 1');
    return stmt.get(email);
  },

  // Analytics queries
  getDashboardStats: () => {
    const stats = db.prepare(`
      SELECT 
        COUNT(*) as total_leads,
        COUNT(CASE WHEN lead_score >= 70 THEN 1 END) as high_value_leads,
        ROUND(AVG(lead_score), 1) as avg_lead_score,
        COUNT(CASE WHEN created_at >= date('now', '-7 days') THEN 1 END) as leads_last_7_days,
        COUNT(CASE WHEN created_at >= date('now', '-30 days') THEN 1 END) as leads_last_30_days
      FROM leads
    `).get();

    const topSources = db.prepare(`
      SELECT submission_type, COUNT(*) as count 
      FROM leads 
      WHERE created_at >= date('now', '-30 days')
      GROUP BY submission_type 
      ORDER BY count DESC 
      LIMIT 5
    `).all();

    const recentHighValue = db.prepare(`
      SELECT email, first_name, business_name, lead_score, submission_type, created_at
      FROM leads 
      WHERE lead_score >= 70 
      ORDER BY created_at DESC 
      LIMIT 10
    `).all();

    const dailyTrends = db.prepare(`
      SELECT 
        date(created_at) as date,
        COUNT(*) as leads,
        COUNT(CASE WHEN lead_score >= 70 THEN 1 END) as high_value,
        ROUND(AVG(lead_score), 1) as avg_score
      FROM leads 
      WHERE created_at >= date('now', '-30 days')
      GROUP BY date(created_at)
      ORDER BY date
    `).all();

    return {
      overview: stats,
      topSources,
      recentHighValue,
      dailyTrends
    };
  },

  // Follow-up intelligence
  getLeadsNeedingFollowup: () => {
    // High-value leads without recent booking
    const stmt = db.prepare(`
      SELECT l.*, 
        COUNT(i.id) as interaction_count,
        MAX(i.created_at) as last_interaction
      FROM leads l
      LEFT JOIN lead_interactions i ON l.id = i.lead_id
      WHERE l.lead_score >= 70 
        AND l.created_at >= date('now', '-7 days')
        AND (i.interaction_type != 'calendly_booked' OR i.interaction_type IS NULL)
      GROUP BY l.id
      ORDER BY l.created_at DESC
    `);
    
    return stmt.all();
  },

  // Conversion funnel analysis
  getConversionFunnel: () => {
    const funnel = db.prepare(`
      SELECT 
        submission_type,
        COUNT(*) as total_leads,
        COUNT(CASE WHEN EXISTS(
          SELECT 1 FROM lead_interactions li 
          WHERE li.lead_id = leads.id AND li.interaction_type = 'calendly_booked'
        ) THEN 1 END) as booked_consultations,
        ROUND(
          COUNT(CASE WHEN EXISTS(
            SELECT 1 FROM lead_interactions li 
            WHERE li.lead_id = leads.id AND li.interaction_type = 'calendly_booked'
          ) THEN 1 END) * 100.0 / COUNT(*), 
          1
        ) as booking_rate
      FROM leads
      WHERE created_at >= date('now', '-90 days')
      GROUP BY submission_type
      ORDER BY total_leads DESC
    `).all();

    return funnel;
  },

  // Follow-up reminder functions
  scheduleFollowUp: (leadId, reminderType, scheduledFor, message) => {
    const stmt = db.prepare(`
      INSERT INTO follow_up_reminders (lead_id, reminder_type, scheduled_for, message)
      VALUES (?, ?, ?, ?)
    `);
    
    try {
      const result = stmt.run(leadId, reminderType, scheduledFor, message);
      log.info('Follow-up scheduled', { leadId, reminderType, scheduledFor });
      return result.lastInsertRowid;
    } catch (error) {
      log.error('Failed to schedule follow-up', { error: error.message, leadId });
      throw error;
    }
  },

  getPendingFollowUps: () => {
    const stmt = db.prepare(`
      SELECT 
        f.*,
        l.email,
        l.first_name,
        l.business_name,
        l.submission_type,
        l.lead_score,
        l.form_data
      FROM follow_up_reminders f
      JOIN leads l ON f.lead_id = l.id
      WHERE f.status = 'pending' 
        AND f.scheduled_for <= datetime('now')
      ORDER BY f.scheduled_for ASC
    `);
    
    return stmt.all();
  },

  markFollowUpSent: (followUpId) => {
    const stmt = db.prepare(`
      UPDATE follow_up_reminders 
      SET status = 'sent', sent_at = datetime('now')
      WHERE id = ?
    `);
    
    stmt.run(followUpId);
    log.info('Follow-up marked as sent', { followUpId });
  },

  getFollowUpStats: () => {
    const stats = db.prepare(`
      SELECT 
        COUNT(*) as total_scheduled,
        COUNT(CASE WHEN status = 'sent' THEN 1 END) as sent,
        COUNT(CASE WHEN status = 'pending' AND scheduled_for <= datetime('now') THEN 1 END) as overdue
      FROM follow_up_reminders
      WHERE created_at >= date('now', '-30 days')
    `).get();

    return stats;
  }
};

export default db;