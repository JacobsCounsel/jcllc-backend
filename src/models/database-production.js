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
    const id = `automation-${Date.now()}`;
    emailAutomations.set(id, { ...automationData, id, created_at: new Date() });
    stats.emailsSent++;
    log.info('Email automation stored:', { id, email: automationData.email });
    return { lastInsertRowid: Date.now(), changes: 1 };
  },

  getActiveAutomations: (email) => {
    return Array.from(emailAutomations.values()).filter(a => a.email === email && a.status === 'active');
  },

  logInteraction: (leadId, type, details = {}) => {
    log.info('Lead interaction logged:', { leadId, type, details });
    return { lastInsertRowid: Date.now(), changes: 1 };
  }
};

// Initialize mock database
const initTables = () => {
  log.info('🎭 Mock database initialized for production (no SQLite)');
  return true;
};

// Initialize on import
initTables();

export default db;