-- Enhanced Email Automation System Schema
-- Complete nurture sequences with exit triggers and management

-- Core subscribers table
CREATE TABLE IF NOT EXISTS subscribers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    first_name TEXT,
    last_name TEXT,
    lead_score INTEGER DEFAULT 0,
    client_profile TEXT, -- athlete, creator, startup, family, business_owner
    submission_type TEXT,
    status TEXT DEFAULT 'active', -- active, paused, completed, unsubscribed
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Automation sequences definition
CREATE TABLE IF NOT EXISTS automation_sequences (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    trigger_type TEXT, -- form_submission, tag_added, score_reached, manual
    client_profile TEXT, -- athlete, creator, startup, family, all
    min_lead_score INTEGER DEFAULT 0,
    max_lead_score INTEGER DEFAULT 100,
    is_active BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Email templates in sequences
CREATE TABLE IF NOT EXISTS sequence_emails (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sequence_id INTEGER REFERENCES automation_sequences(id),
    template_key TEXT NOT NULL,
    email_order INTEGER NOT NULL,
    delay_hours INTEGER DEFAULT 0, -- Hours to wait after previous email
    subject_line TEXT,
    is_active BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Active automations (subscriber in a sequence)
CREATE TABLE IF NOT EXISTS active_automations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    subscriber_id INTEGER REFERENCES subscribers(id),
    sequence_id INTEGER REFERENCES automation_sequences(id),
    current_email_index INTEGER DEFAULT 0,
    status TEXT DEFAULT 'active', -- active, paused, completed, exited
    started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_email_sent_at DATETIME,
    next_email_at DATETIME,
    paused_at DATETIME,
    completed_at DATETIME,
    exit_reason TEXT -- consultation_booked, manual_exit, link_clicked, email_replied, unsubscribed
);

-- Email send history
CREATE TABLE IF NOT EXISTS email_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    automation_id INTEGER REFERENCES active_automations(id),
    subscriber_id INTEGER REFERENCES subscribers(id),
    template_key TEXT,
    subject_line TEXT,
    status TEXT DEFAULT 'pending', -- pending, sent, failed, opened, clicked
    sent_at DATETIME,
    opened_at DATETIME,
    clicked_at DATETIME,
    error_message TEXT
);

-- Exit triggers configuration
CREATE TABLE IF NOT EXISTS exit_triggers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sequence_id INTEGER REFERENCES automation_sequences(id),
    trigger_type TEXT NOT NULL, -- consultation_booked, link_clicked, tag_added, email_replied, form_submitted
    trigger_value TEXT, -- specific link, tag name, form name, etc.
    action TEXT DEFAULT 'pause', -- pause, complete, move_to_sequence
    target_sequence_id INTEGER, -- if action is move_to_sequence
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Automation events log
CREATE TABLE IF NOT EXISTS automation_events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    automation_id INTEGER REFERENCES active_automations(id),
    subscriber_id INTEGER REFERENCES subscribers(id),
    event_type TEXT NOT NULL, -- sequence_started, email_sent, sequence_paused, sequence_completed, trigger_fired
    event_data TEXT, -- JSON data about the event
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Tags for segmentation
CREATE TABLE IF NOT EXISTS subscriber_tags (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    subscriber_id INTEGER REFERENCES subscribers(id),
    tag_name TEXT NOT NULL,
    added_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(subscriber_id, tag_name)
);

-- Consultation bookings (for exit triggers)
CREATE TABLE IF NOT EXISTS consultation_bookings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    subscriber_email TEXT,
    booking_date DATETIME,
    consultation_type TEXT,
    calendly_event_id TEXT UNIQUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_active_automations_status ON active_automations(status);
CREATE INDEX IF NOT EXISTS idx_active_automations_next_email ON active_automations(next_email_at);
CREATE INDEX IF NOT EXISTS idx_subscribers_email ON subscribers(email);
CREATE INDEX IF NOT EXISTS idx_email_history_automation ON email_history(automation_id);
CREATE INDEX IF NOT EXISTS idx_automation_events_subscriber ON automation_events(subscriber_id);