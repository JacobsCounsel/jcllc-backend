# Email Automation System - Process Flow Diagrams

## 🎯 SYSTEM OVERVIEW

```mermaid
graph TD
    A[Website Form Submission] --> B[Lead Scoring Engine]
    B --> C[Custom Email Automation]
    C --> D[Email Scheduling]
    D --> E[Cron Processor]
    E --> F[Email Delivery]
    
    G[Calendly Booking] --> H[Consultation Handler]
    H --> I[Pause Email Sequences]
    I --> J[Send Confirmation]
    
    K[Calendly Cancellation] --> L[Resume Email Sequences]
    
    M[Admin Dashboard] --> N[Real-time Monitoring]
    N --> O[Manual Controls]
```

---

## 📋 FORM SUBMISSION TO EMAIL AUTOMATION FLOW

```mermaid
sequenceDiagram
    participant User as Website Visitor
    participant Form as Intake Form
    participant Backend as Backend System
    participant Scoring as Lead Scoring
    participant Email as Email Automation
    participant DB as Database
    participant Scheduler as Email Scheduler

    User->>Form: Fills out estate planning form
    Form->>Backend: POST /estate-intake
    Backend->>Scoring: Calculate lead score
    Scoring-->>Backend: Score: 95/100 (VIP)
    
    Backend->>DB: Insert lead record
    DB-->>Backend: Lead ID: 20
    
    Backend->>Email: Process custom automation
    Email->>Email: Determine pathway (VIP)
    Email->>DB: Create automation record
    
    loop For each email in sequence
        Email->>Scheduler: Schedule email with delay
        Scheduler->>DB: Insert scheduled_email
    end
    
    Email-->>Backend: 4 emails scheduled
    Backend-->>Form: {"ok": true, "leadScore": 95}
```

---

## ⚖️ CONSULTATION BOOKING FLOW

```mermaid
flowchart TD
    A[User Books Consultation on Calendly] --> B[Calendly Webhook Triggered]
    B --> C[Parse Event Type]
    
    C --> D{Event Type?}
    D -->|invitee.created| E[Extract Consultation Details]
    D -->|invitee.canceled| F[Handle Cancellation]
    
    E --> G[Determine Consultation Type]
    G --> H{Consultation Type}
    H -->|Estate Planning| I[Estate Consultation]
    H -->|Business Formation| J[Business Consultation] 
    H -->|Brand Protection| K[Brand Consultation]
    H -->|General| L[General Consultation]
    
    I --> M[Pause Active Email Sequences]
    J --> M
    K --> M
    L --> M
    
    M --> N[Record Consultation Booking]
    N --> O[Schedule Post-Consultation Follow-up]
    O --> P[Send Consultation Confirmation]
    P --> Q[Update Lead Record]
    
    F --> R[Resume Paused Email Sequences]
    R --> S[Reschedule Pending Emails]
    S --> T[Update Cancellation Status]
```

---

## 📧 EMAIL PROCESSING & DELIVERY FLOW

```mermaid
flowchart LR
    A[Cron Job - Every Minute] --> B[Query Scheduled Emails]
    B --> C{Emails Due?}
    C -->|No| D[Wait 1 Minute]
    C -->|Yes| E[Process Email Queue]
    
    E --> F[For Each Email]
    F --> G[Generate Legal Template]
    G --> H[Personalize Content]
    H --> I[Apply Legal Disclaimers]
    
    I --> J{Email Provider Available?}
    J -->|SendGrid| K[Send via SendGrid]
    J -->|Resend| L[Send via Resend]
    J -->|SMTP| M[Send via SMTP]
    J -->|None| N[Log Error - No Provider]
    
    K --> O[Update Status: Sent]
    L --> O
    M --> O
    N --> P[Update Status: Failed]
    
    O --> Q[Log Success]
    P --> R[Log Error]
    Q --> S[Continue to Next Email]
    R --> S
    S --> D
```

---

## 🎛️ ADMIN DASHBOARD DATA FLOW

```mermaid
graph TB
    A[Dashboard Load] --> B[Fetch Journey Overview]
    A --> C[Fetch Active Contacts]
    A --> D[Fetch Scheduled Emails]
    A --> E[Fetch Analytics Data]
    
    B --> F[Database Query: email_automations]
    C --> G[Database Query: contacts + leads]
    D --> H[Database Query: scheduled_emails]
    E --> I[Database Query: engagement + bookings]
    
    F --> J[Process Journey Stats]
    G --> K[Process Contact Data]
    H --> L[Process Email Queue]
    I --> M[Calculate Metrics]
    
    J --> N[Update UI: Journey Cards]
    K --> O[Update UI: Contact List]
    L --> P[Update UI: Email Queue]
    M --> Q[Update UI: Analytics]
    
    N --> R[Real-time Dashboard]
    O --> R
    P --> R
    Q --> R
    
    R --> S[Auto-refresh Every 30s]
    S --> A
```

---

## 🔄 PATHWAY ASSIGNMENT LOGIC

```mermaid
flowchart TD
    A[New Lead Submitted] --> B[Calculate Lead Score]
    B --> C{Score >= 70?}
    C -->|Yes| D[VIP Pathway]
    C -->|No| E{Score >= 50?}
    E -->|Yes| F[Premium Pathway]
    E -->|No| G[Standard Pathway]
    
    H[Check Submission Type] --> I{Service Specific?}
    I -->|Estate Planning| J[Estate Education Series]
    I -->|Business Formation| K[Business Education Series]
    I -->|Brand Protection| L[Brand Education Series]
    I -->|General| M[Use Score-based Pathway]
    
    M --> C
    
    D --> N[VIP Legal Strategy Journey]
    F --> O[Premium Legal Education Journey]
    G --> P[General Legal Education Series]
    J --> Q[Estate Planning Educational Series]
    K --> R[Business Formation Educational Series]
    L --> S[Brand Protection Educational Series]
    
    N --> T[Schedule 4 VIP Emails]
    O --> U[Schedule 4 Premium Emails]
    P --> V[Schedule 3 Standard Emails]
    Q --> W[Schedule 3 Estate Emails]
    R --> X[Schedule 3 Business Emails]
    S --> Y[Schedule 3 Brand Emails]
```

---

## 🛡️ LEGAL COMPLIANCE FLOW

```mermaid
flowchart TD
    A[Email Template Request] --> B[Load Legal Template]
    B --> C[Check Template Type]
    
    C --> D{Template Exists?}
    D -->|No| E[Use Standard Welcome]
    D -->|Yes| F[Load Specific Template]
    
    E --> G[Apply Legal Disclaimers]
    F --> G
    
    G --> H[Add Attorney-Client Notice]
    H --> I[Add Informational Purpose Notice]
    I --> J[Add Professional Disclaimers]
    
    J --> K[Personalize with Client Name]
    K --> L[Apply Brand Styling]
    L --> M[Generate Final HTML]
    
    M --> N{Contains Legal Advice?}
    N -->|Yes| O[REJECT - Compliance Error]
    N -->|No| P[APPROVE - Send Email]
    
    O --> Q[Log Compliance Issue]
    P --> R[Queue for Delivery]
```

---

## 📊 DATABASE SCHEMA RELATIONSHIPS

```mermaid
erDiagram
    leads {
        id INTEGER PK
        email TEXT
        first_name TEXT
        last_name TEXT
        lead_score INTEGER
        submission_type TEXT
        created_at DATETIME
    }
    
    email_automations {
        id INTEGER PK
        email TEXT FK
        pathway_name TEXT
        trigger_type TEXT
        status TEXT
        paused_reason TEXT
        consultation_booked TEXT
        created_at DATETIME
    }
    
    scheduled_emails {
        id INTEGER PK
        automation_id INTEGER FK
        email TEXT
        subject TEXT
        template_type TEXT
        send_at DATETIME
        status TEXT
        sent_at DATETIME
    }
    
    consultation_bookings {
        id INTEGER PK
        email TEXT
        booking_type TEXT
        booking_status TEXT
        booking_data TEXT
        created_at DATETIME
    }
    
    email_engagement {
        id INTEGER PK
        scheduled_email_id INTEGER FK
        email TEXT
        engagement_type TEXT
        engagement_data TEXT
        created_at DATETIME
    }
    
    leads ||--o{ email_automations : "triggers"
    email_automations ||--o{ scheduled_emails : "contains"
    scheduled_emails ||--o{ email_engagement : "tracks"
    leads ||--o{ consultation_bookings : "books"
```

---

## 🚀 EMAIL TEMPLATE SYSTEM ARCHITECTURE

```mermaid
flowchart TB
    A[Email Trigger] --> B[Template Selection Engine]
    B --> C{Template Type}
    
    C -->|VIP Welcome| D[VIP Welcome Template]
    C -->|Estate Education| E[Estate Planning Template]
    C -->|Business Education| F[Business Formation Template]
    C -->|Brand Education| G[Brand Protection Template]
    C -->|Consultation Reminder| H[Consultation Template]
    
    D --> I[Load Legal Content]
    E --> I
    F --> I
    G --> I
    H --> I
    
    I --> J[Apply Personalization]
    J --> K[Insert Client Name]
    K --> L[Apply Company Branding]
    
    L --> M[Legal Compliance Check]
    M --> N{Compliant?}
    N -->|No| O[Use Fallback Template]
    N -->|Yes| P[Generate HTML]
    
    O --> P
    P --> Q[Add Legal Disclaimers]
    Q --> R[Apply Responsive CSS]
    R --> S[Final Email HTML]
    
    S --> T[Queue for Delivery]
```

---

## 🔧 ADMIN DASHBOARD CONTROLS FLOW

```mermaid
flowchart LR
    A[Admin Dashboard] --> B{User Action}
    
    B -->|Pause Contact| C[Pause Email Sequence]
    B -->|Resume Contact| D[Resume Email Sequence]
    B -->|Preview Email| E[Generate Email Preview]
    B -->|Send Email Now| F[Immediate Email Send]
    B -->|View Analytics| G[Load Performance Data]
    
    C --> H[Update automation status = 'paused']
    C --> I[Update pending emails = 'paused']
    
    D --> J[Update automation status = 'active']
    D --> K[Reschedule paused emails]
    
    E --> L[Generate HTML template]
    E --> M[Return preview in new tab]
    
    F --> N[Update send_at = now()]
    F --> O[Trigger immediate processing]
    
    G --> P[Query engagement metrics]
    G --> Q[Calculate conversion rates]
    
    H --> R[Log admin action]
    J --> R
    N --> R
    
    R --> S[Update dashboard display]
    L --> T[Open preview window]
    P --> U[Display analytics charts]
```

---

## ✅ SYSTEM STATUS & HEALTH MONITORING

```mermaid
flowchart TD
    A[System Health Monitor] --> B[Check Email Queue]
    A --> C[Check Database Status]
    A --> D[Check Email Provider Status]
    A --> E[Check Cron Job Status]
    
    B --> F{Queue Healthy?}
    F -->|Yes| G[✅ Queue Normal]
    F -->|No| H[⚠️ Queue Backlog]
    
    C --> I{Database Responsive?}
    I -->|Yes| J[✅ Database OK]
    I -->|No| K[❌ Database Error]
    
    D --> L{Provider Available?}
    L -->|Yes| M[✅ Email Provider OK]
    L -->|No| N[❌ Provider Down]
    
    E --> O{Cron Running?}
    O -->|Yes| P[✅ Processing Active]
    O -->|No| Q[❌ Processing Stopped]
    
    H --> R[Alert Admin]
    K --> R
    N --> R
    Q --> R
    
    G --> S[System Status: Healthy]
    J --> S
    M --> S
    P --> S
    
    R --> T[System Status: Issues Detected]
```

---

## 🎯 TESTING & VALIDATION FLOW

```mermaid
flowchart LR
    A[Test Execution] --> B[Form Submission Test]
    A --> C[Email Template Test]
    A --> D[Consultation Flow Test]
    A --> E[Dashboard UI Test]
    
    B --> F[Submit Test Form]
    F --> G[Verify Lead Creation]
    G --> H[Verify Automation Trigger]
    H --> I[Verify Email Scheduling]
    
    C --> J[Generate Template]
    J --> K[Check Legal Compliance]
    K --> L[Verify Personalization]
    L --> M[Validate HTML Structure]
    
    D --> N[Test Booking Webhook]
    N --> O[Verify Sequence Pause]
    O --> P[Test Cancellation Webhook]
    P --> Q[Verify Sequence Resume]
    
    E --> R[Load Dashboard]
    R --> S[Test API Endpoints]
    S --> T[Verify Real-time Updates]
    T --> U[Test Admin Controls]
    
    I --> V[✅ Form Integration Working]
    M --> W[✅ Templates Compliant]
    Q --> X[✅ Consultation Flow Working]
    U --> Y[✅ Dashboard Functional]
    
    V --> Z[System Ready for Production]
    W --> Z
    X --> Z
    Y --> Z
```

---

## 🏆 PRODUCTION DEPLOYMENT ARCHITECTURE

```mermaid
flowchart TB
    A[Production Server] --> B[Node.js Backend]
    B --> C[Express.js API Server]
    
    C --> D[Email Automation Routes]
    C --> E[Form Processing Routes]
    C --> F[Analytics Routes]
    C --> G[Webhook Routes]
    
    H[SQLite Database] --> I[Lead Data]
    H --> J[Email Automation Data]
    H --> K[Analytics Data]
    
    L[Email Providers] --> M[SendGrid API]
    L --> N[Resend API]
    L --> O[SMTP Fallback]
    
    P[External Services] --> Q[Calendly Webhooks]
    P --> R[Squarespace Forms]
    
    B --> H
    D --> L
    G --> Q
    E --> R
    
    S[Admin Dashboard] --> C
    T[Real-time Monitoring] --> B
    U[Cron Job Processor] --> B
    
    V[SSL Certificate] --> A
    W[Domain Name] --> A
    X[Environment Variables] --> B
```

This comprehensive visualization shows every aspect of your email automation system working together seamlessly!