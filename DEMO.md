# How to See the Enhanced Backend in Action

## Step 1: Install New Dependencies (Safe)
```bash
cd /Users/drewjacobs/jcllc-backend
npm install better-sqlite3 winston helmet dotenv
```

## Step 2: Test the Enhanced Version (Keeps Original Safe)
```bash
# Your original backend (keep this running if needed)
node index.js

# Test enhanced version in new terminal
node index-improved.js
```

## Step 3: See It Working

### A) Submit a Test Lead
Visit your Squarespace forms and submit a test lead, OR use curl:

```bash
# Test estate planning form
curl -X POST http://localhost:3000/estate-intake \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "grossEstate": "2500000",
    "packagePreference": "trust-based",
    "ownBusiness": "Yes",
    "phone": "555-123-4567"
  }'

# Test business formation  
curl -X POST http://localhost:3000/business-formation-intake \
  -H "Content-Type: application/json" \
  -d '{
    "email": "startup@example.com",
    "founderName": "Jane Smith",
    "businessName": "Tech Startup LLC",
    "investmentPlan": "vc",
    "projectedRevenue": "5m-25m",
    "selectedPackage": "gold"
  }'
```

### B) View Analytics Dashboard
```bash
# Command line view
npm run analytics

# Web API view  
curl http://localhost:3000/api/analytics/dashboard | jq

# Follow-up recommendations
curl http://localhost:3000/api/analytics/followup-recommendations | jq
```

### C) Browser Testing
Open browser to `http://localhost:3000/api/analytics/dashboard`

## Step 4: See Database Content
```bash
# View the SQLite database
sqlite3 data/leads.db "SELECT email, lead_score, submission_type, created_at FROM leads;"

# Count leads by type
sqlite3 data/leads.db "SELECT submission_type, COUNT(*) FROM leads GROUP BY submission_type;"
```

## What You'll See

### 1. Enhanced Lead Scoring
Submit forms and see higher scores for:
- Estate plans > $5M
- VC-backed startups  
- Business emails vs Gmail
- Urgent timelines

### 2. Analytics Dashboard Response
```json
{
  "ok": true,
  "data": {
    "overview": {
      "total_leads": 15,
      "high_value_leads": 8,
      "avg_lead_score": 67.2,
      "leads_last_7_days": 12
    },
    "topSources": [
      {"submission_type": "estate-intake", "count": 8},
      {"submission_type": "business-formation", "count": 4}
    ],
    "followupNeeded": [
      {
        "email": "highvalue@client.com",
        "lead_score": 85,
        "hoursSinceSubmission": 2,
        "urgencyScore": 129
      }
    ]
  }
}
```

### 3. Follow-up Intelligence
```json
{
  "ok": true,
  "data": {
    "highPriorityFollowups": [...],
    "recommendations": [
      {
        "lead": {"email": "urgent@client.com", "lead_score": 88},
        "action": "Call immediately - strike while hot!",
        "urgency": "immediate",
        "reason": "Score 88/100, 1h since submission"
      }
    ]
  }
}
```

## Step 5: Compare Original vs Enhanced

### Original Health Check:
```bash
curl http://localhost:3000/health
```

### Enhanced Health Check:
```bash
curl http://localhost:3000/health
# Shows database stats, lead counts, etc.
```

## Real-World Testing

### Simulate Your Squarespace Forms
Test the exact same form submissions your Squarespace site sends:

```bash
# Estate planning form (matches your Squarespace)
curl -X POST http://localhost:3000/estate-intake \
  -H "Content-Type: application/json" \
  -d '{
    "submissionType": "wealth-protection",
    "email": "client@lawfirm.com", 
    "firstName": "Michael",
    "grossEstate": "8500000",
    "packagePreference": "comprehensive-trust",
    "ownBusiness": "Yes",
    "urgency": "Immediate - tax deadline"
  }'
```

This will score ~95/100 and trigger high-priority alerts.

## Check Integration Status
```bash
curl http://localhost:3000/health
```

Shows you which services are connected:
- ✅ Mailchimp configured  
- ✅ Email configured
- ✅ Database active
- ⚠️ OpenAI not configured (optional)

## Safe Testing Strategy

1. **Keep original running** on port 3000
2. **Test enhanced version** on port 3001 (add `PORT=3001` env var)  
3. **Compare responses** side by side
4. **Switch when confident**

The enhanced version processes the exact same form submissions but adds database tracking and analytics on top.