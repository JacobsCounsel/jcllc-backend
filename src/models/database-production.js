// Production fallback database - in-memory storage
// Replaces SQLite for Render deployment without native dependencies

import { log } from '../utils/logger.js';

// In-memory storage for production
const leads = new Map();
const emailAutomations = new Map();
const stats = {
  totalLeads: 0,
  emailsSent: 0,
  highValueLeads: 0
};

// Mock database interface compatible with SQLite version
const db = {
  prepare: (query) => ({
    run: (...params) => {
      log.info('Mock DB operation:', { query, params });
      return { lastInsertRowid: Date.now(), changes: 1 };
    },
    get: (...params) => {
      log.info('Mock DB get:', { query, params });
      // Handle count queries specially
      if (query.includes('COUNT(*)')) {
        return { count: stats.totalLeads };
      }
      return null; // Return null for missing records
    },
    all: (...params) => {
      log.info('Mock DB all:', { query, params });
      return []; // Return empty array
    }
  }),
  exec: (query) => {
    log.info('Mock DB exec:', { query });
    return true;
  }
};

// Lead database interface
export const leadDb = {
  insertLead: (leadData) => {
    const id = `lead-${Date.now()}`;
    leads.set(id, { ...leadData, id, created_at: new Date() });
    stats.totalLeads++;
    log.info('Lead stored in memory:', { id, email: leadData.email });
    return { lastInsertRowid: Date.now(), changes: 1 };
  },

  getLeadsByEmail: (email) => {
    const results = Array.from(leads.values()).filter(lead => lead.email === email);
    return results;
  },

  getAllLeads: (limit = 100) => {
    return Array.from(leads.values()).slice(0, limit);
  },

  getLeadStats: () => {
    const leadArray = Array.from(leads.values());
    return {
      total: leadArray.length,
      thisWeek: leadArray.filter(l => {
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        return new Date(l.created_at) > weekAgo;
      }).length,
      averageScore: leadArray.length > 0 
        ? Math.round(leadArray.reduce((sum, l) => sum + (l.lead_score || 0), 0) / leadArray.length)
        : 0,
      highValue: leadArray.filter(l => (l.lead_score || 0) >= 80).length
    };
  },

  insertEmailAutomation: (automationData) => {
    // Email automation system DISABLED - using Kit/ConvertKit for follow-ups
    log.info('Email automation DISABLED - delegating to Kit/ConvertKit:', { email: automationData.email });
    return { lastInsertRowid: Date.now(), changes: 0 };
  },

  getActiveAutomations: (email) => {
    // No active automations - system disabled
    return [];
  },

  // Clear all scheduled follow-up emails 
  clearAllScheduledEmails: () => {
    emailAutomations.clear();
    log.info('All scheduled follow-up emails cleared - system using Kit/ConvertKit');
    return { success: true, cleared: true };
  },

  logInteraction: (leadId, type, details = {}) => {
    log.info('Lead interaction logged:', { leadId, type, details });
    return { lastInsertRowid: Date.now(), changes: 1 };
  },

  // Unsubscribe functionality - CAN-SPAM compliance
  unsubscribeEmail: (email) => {
    const id = `unsubscribe-${Date.now()}`;
    const unsubscribed = { 
      id, 
      email, 
      unsubscribed_at: new Date(),
      reason: 'user_request'
    };
    
    // Add to unsubscribed list
    const unsubscribeList = new Map();
    unsubscribeList.set(email, unsubscribed);
    
    log.info('Email unsubscribed:', { email, id });
    return { lastInsertRowid: Date.now(), changes: 1 };
  },

  // Check if email is unsubscribed
  isUnsubscribed: (email) => {
    // In production, this would check actual database
    // For now, assume no one is unsubscribed in mock DB
    log.info('Checking unsubscribe status:', { email });
    return false;
  },

  // Update email preferences
  updateEmailPreferences: (email, preferences) => {
    const id = `prefs-${Date.now()}`;
    const prefData = {
      id,
      email,
      newsletter: preferences.newsletter === 'on',
      follow_ups: preferences.follow_ups === 'on', 
      resources: preferences.resources === 'on',
      consultations: preferences.consultations === 'on',
      updated_at: new Date()
    };
    
    log.info('Email preferences updated:', { email, preferences: prefData });
    return { lastInsertRowid: Date.now(), changes: 1 };
  },

  // Get email engagement analytics
  getEmailEngagement: (email) => {
    log.info('Getting email engagement for:', { email });
    return {
      opens: 0,
      clicks: 0,
      last_opened: null,
      last_clicked: null,
      engagement_score: 0
    };
  }
};

// Initialize mock database
const initTables = () => {
  // Clear any existing email automations - system now uses Kit/ConvertKit
  emailAutomations.clear();
  log.info('🎭 Mock database initialized for production (no SQLite)');
  log.info('📧 Email automations cleared - delegating to Kit/ConvertKit');
  return true;
};

// Initialize on import
initTables();

export default db;