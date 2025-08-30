# 🚀 Jacobs Counsel Email Automation - User Guide

## 📋 Quick Start Checklist

### Daily Operations (5 minutes/day)
1. **Check Dashboard:** Visit `http://localhost:3000/api/analytics/dashboard`
2. **Review New Leads:** Look for red "New" badges
3. **Monitor Email Status:** Check "Active Automations" section
4. **Take Action:** Click action buttons for high-priority leads

### Weekly Operations (15 minutes/week)
1. **Export Lead Data:** Use CSV export for client records
2. **Review Performance:** Check conversion rates and engagement
3. **Clean Up:** Archive or update old leads as needed

---

## 🎯 Main Dashboard - Your Command Center

**URL:** `http://localhost:3000/api/analytics/dashboard`

### What You'll See:
- **Lead Summary Cards:** Total leads, new this week, average score
- **Lead List:** All prospects with scores and status
- **Quick Actions:** Email, call, book consultation buttons
- **Search & Filter:** Find specific leads instantly

### Key Features:
- **🔴 Red "New" Badge:** Fresh leads that need attention
- **📊 Lead Score:** Higher = better prospect (aim for 70+)
- **⚡ Action Buttons:** One-click email, call, or booking
- **📤 Export:** Download all data as CSV

---

## 📧 Email Automation Dashboard

**URL:** `http://localhost:3000/api/email-automations/dashboard`

### What You'll See:
- **Active Sequences:** Who's getting what emails when
- **Pathway Overview:** Visual map of all 26 email sequences
- **Email Status:** Sent, pending, paused automations

### Key Actions:
- **Pause Sequence:** Stop emails for specific leads
- **Resume Sequence:** Restart paused automations  
- **Manual Send:** Trigger specific emails immediately

---

## 🎖️ Understanding Email Pathways

### **VIP Sequences (4 emails each):**
- **Athletes:** Triggered by profession = athlete
- **Creators:** Triggered by social following > 100k
- **Startups:** Triggered by business stage = startup
- **Family Wealth:** Triggered by estate > $10M
- **General VIP:** Triggered by lead score 90+

### **Premium Sequences (4 emails):**
- **Mid-Tier Leads:** Score 70-89

### **Standard Sequences (3 emails):**
- **General Leads:** Score below 70

### **Intake-Specific (3 emails each):**
- Estate Planning, Business Formation, Brand Protection
- Newsletter, Outside Counsel, Resource Downloads

---

## 🚨 What to Watch For

### High-Priority Actions:
1. **Lead Score 90+** → Personal outreach within 24 hours
2. **New Athletes/Creators** → Review immediately  
3. **Consultation Bookings** → Automatic preparation emails sent
4. **Paused Sequences** → Investigate why automation stopped

### Daily Monitoring:
- **Email Delivery Issues:** Check for failed sends
- **High-Value Leads:** Score 80+ deserve quick follow-up
- **Sequence Completions:** Leads finishing pathways need manual outreach

---

## 🔧 Common Tasks

### Add New Lead Manually:
1. Visit dashboard
2. Use "Add Lead" button (if available) or wait for form submissions
3. System auto-assigns pathway based on data

### Send Test Email:
1. Go to email dashboard
2. Find your own email in leads
3. Click "Send Email" for any sequence

### Export Lead Data:
1. Dashboard → "Export CSV" button
2. Opens spreadsheet with all lead information
3. Use for CRM import or client records

### Pause All Emails for Lead:
1. Find lead in dashboard
2. Click lead name to expand details
3. Use "Pause Sequence" button

---

## 🆘 Quick Troubleshooting

### Email Not Sending:
1. Check `.env` file has correct Microsoft Graph credentials
2. Restart server: `npm start`
3. Test with your own email first

### Dashboard Not Loading:
1. Ensure server running on port 3000
2. Check browser console for errors
3. Try `http://localhost:3000/api/analytics/dashboard`

### Lead Not Getting Emails:
1. Check if sequence is paused
2. Verify email address is valid
3. Look for pathway assignment in dashboard

### Server Won't Start:
1. Kill existing process: Kill any process on port 3000
2. Run `npm start`
3. Should show "Server running on port 3000"

---

## 📊 Key Metrics to Track

### Daily:
- **New Leads:** How many came in today?
- **High Scores:** Any 80+ leads need attention?
- **Failed Emails:** Any delivery issues?

### Weekly:
- **Conversion Rate:** Leads → consultations
- **Pathway Performance:** Which sequences work best?
- **Lead Sources:** Where are best prospects coming from?

### Monthly:
- **Total Pipeline Value:** Estimate based on lead scores
- **Sequence Optimization:** A/B test different approaches
- **System Health:** Overall automation performance

---

## 🎯 Best Practices

### For Maximum Results:
1. **Act Fast on VIP Leads:** 90+ scores deserve same-day outreach
2. **Personalize High-Value Contacts:** Athletes and creators appreciate recognition
3. **Monitor Consultation Bookings:** Preparation emails auto-send
4. **Export Regular Backups:** Download CSV weekly for records

### Professional Standards:
- **Response Time:** VIP leads within 4 hours, others within 24 hours
- **Email Quality:** All templates legally compliant and professional
- **Follow-Up:** System handles nurturing, you handle closing
- **Data Security:** Keep lead information confidential

---

## 🏆 Success Indicators

### You're Winning When:
- ✅ **80%+ leads** have scores above 50
- ✅ **Daily dashboard checks** become routine
- ✅ **Quick action** on high-priority leads
- ✅ **Regular exports** for client records
- ✅ **Consultation bookings** increase monthly

### Red Flags:
- ❌ **Many failed email sends** - Check email configuration
- ❌ **Low lead scores across board** - Review form quality
- ❌ **Sequences not completing** - Investigate automation logic
- ❌ **No new leads for days** - Check form connectivity

---

## 📞 When You Need Help

### Server Issues:
1. Restart with `npm start`
2. Check port 3000 availability
3. Verify `.env` configuration

### Email Problems:
1. Test with your own email first
2. Check Microsoft Graph credentials
3. Verify recipient email format

### Dashboard Issues:
1. Clear browser cache
2. Check JavaScript console errors
3. Restart server if needed

---

## 🎖️ Advanced Tips

### Power User Features:
- **Bulk Actions:** Select multiple leads for group operations
- **Custom Searches:** Use filters to find specific prospect types
- **Sequence Timing:** Understand 2-hour, 24-hour, 7-day delays
- **Webhook Integration:** Calendly bookings auto-trigger preparation emails

### Optimization Strategies:
- **A/B Test Subject Lines:** Monitor open rates by pathway
- **Lead Score Tuning:** Adjust criteria based on conversion data
- **Timing Optimization:** Track when prospects engage most
- **Pathway Refinement:** Pause underperforming sequences

---

**🏆 Bottom Line:** You now have a world-class legal intake and automation system. Check the dashboard daily, act fast on high-scoring leads, and let the system do the nurturing while you focus on closing consultations.

**Questions?** Everything is automated - you just need to watch the dashboard and respond to hot leads.