# 📧 Email Automation Pathway Hierarchy
## Complete Visual Guide to All 80+ Emails

---

## 🎯 **VIP SEQUENCES** (4 emails each, Premium clients)

### 🏆 **ATHLETE VIP SEQUENCE**
**Trigger:** `profession: 'athlete'` OR `industry: 'sports'` OR `careerType: 'professional_athlete'`
```
📧 Email 1: "Protecting Athletic Career Value" (Immediate)
📧 Email 2: "Building Your Athletic Legacy" (2 hours)
📧 Email 3: "Tax Strategy for Athletes" (24 hours)
📧 Email 4: "Consultation Invitation" (7 days)
```

### 🎨 **CREATOR VIP SEQUENCE** 
**Trigger:** `businessType: 'creator'` OR `socialFollowing > 100,000` OR `revenueStreams: 'brand_partnerships'`
```
📧 Email 1: "Your Content Has Real Business Value" (Immediate)
📧 Email 2: "Scale Your Creator Business Strategically" (2 hours) 
📧 Email 3: "IP Protection for Content Creators" (24 hours)
📧 Email 4: "Ready to Lock Down Your Brand?" (7 days)
```

### 🚀 **STARTUP VIP SEQUENCE**
**Trigger:** `businessStage: 'startup'` OR `fundingStage` exists OR `projectedRevenue: 'over25m'`
```
📧 Email 1: "Legal Foundation = Investment Readiness" (Immediate)
📧 Email 2: "From Startup to Scalable Company" (2 hours)
📧 Email 3: "Investor-Ready Legal Structure" (24 hours) 
📧 Email 4: "Time to Scale Smart" (7 days)
```

### 👨‍👩‍👧‍👦 **FAMILY WEALTH VIP SEQUENCE**
**Trigger:** `grossEstate > $10M` OR `familyOffice: true` OR `generationalWealth: true`
```
📧 Email 1: "Multi-Generational Wealth Planning" (Immediate)
📧 Email 2: "Family Legacy Architecture" (2 hours)
📧 Email 3: "Advanced Estate Strategies" (24 hours)
📧 Email 4: "Building Your Family's Future" (7 days)
```

### 💼 **GENERAL VIP SEQUENCE** 
**Trigger:** High lead score (90+) from any pathway
```
📧 Email 1: "Strategic Legal Framework" (Immediate)
📧 Email 2: "Integrated Legal Approach" (2 hours)
📧 Email 3: "Implementation Strategy" (24 hours)
📧 Email 4: "Ready to Execute?" (7 days)
```

---

## 🎖️ **PREMIUM NURTURE SEQUENCES** (4 emails each, High-value leads)

### 📈 **PREMIUM LEGAL EDUCATION JOURNEY**
**Trigger:** Lead score 70-89, any practice area
```
📧 Email 1: "Premium Legal Strategy Welcome" (Immediate)
📧 Email 2: "Strategic Legal Planning Guide" (2 hours)
📧 Email 3: "Advanced Legal Concepts" (24 hours)
📧 Email 4: "Implementation Consultation" (7 days)
```

---

## 📚 **STANDARD NURTURE SEQUENCES** (3 emails each, General leads)

### 🏛️ **GENERAL LEGAL EDUCATION SERIES**
**Trigger:** Lead score < 70, general inquiry
```
📧 Email 1: "Legal Foundation Welcome" (Immediate)
📧 Email 2: "Strategic Legal Planning Basics" (24 hours)
📧 Email 3: "Ready for Next Steps?" (7 days)
```

---

## 📥 **INTAKE-SPECIFIC SEQUENCES** (3 emails each, Form-based triggers)

### 🏠 **ESTATE PLANNING INTAKE**
**Trigger:** `/api/intake/estate` form submission
```
📧 Email 1: "Estate Planning Strategy Welcome" (Immediate)
📧 Email 2: "Wealth Protection Insights" (24 hours)
📧 Email 3: "Advanced Estate Planning" (7 days)
```

### 🏢 **BUSINESS FORMATION INTAKE**  
**Trigger:** `/api/intake/business` form submission
```
📧 Email 1: "Business Formation Welcome" (Immediate)
📧 Email 2: "Entity Structure Strategy" (24 hours)
📧 Email 3: "Business Growth Legal Framework" (7 days)
```

### 🛡️ **BRAND PROTECTION INTAKE**
**Trigger:** `/api/intake/brand-protection` form submission  
```
📧 Email 1: "Brand Protection Welcome" (Immediate)
📧 Email 2: "IP Strategy Essentials" (24 hours)
📧 Email 3: "Brand Defense Implementation" (7 days)
```

### 🎯 **LEGAL STRATEGY BUILDER INTAKE**
**Trigger:** `/api/intake/legal-strategy-builder` form submission
```
📧 Email 1: "Legal Strategy Assessment Results" (Immediate)
📧 Email 2: "Customized Legal Roadmap" (24 hours) 
📧 Email 3: "Implementation Consultation" (7 days)
```

### 📰 **NEWSLETTER SIGNUP**
**Trigger:** Newsletter subscription
```
📧 Email 1: "Welcome to Strategic Legal Insights" (Immediate)
📧 Email 2: "Legal Strategy Fundamentals" (24 hours)
📧 Email 3: "Advanced Legal Planning" (7 days)
```

### 🏛️ **OUTSIDE COUNSEL INQUIRY**
**Trigger:** Outside counsel form
```
📧 Email 1: "Outside Counsel Welcome" (Immediate)
📧 Email 2: "Strategic Legal Partnership" (24 hours)
📧 Email 3: "General Counsel Services" (7 days)
```

### 📖 **RESOURCE GUIDE DOWNLOADS**
**Trigger:** Guide download requests

#### **Business Legal Guide Download:**
```
📧 Email 1: "Your Business Legal Guide" (Immediate)
📧 Email 2: "Implementation Strategy" (24 hours)  
📧 Email 3: "Business Legal Consultation" (7 days)
```

#### **Brand Protection Guide Download:**
```
📧 Email 1: "Your Brand Protection Guide" (Immediate)
📧 Email 2: "Brand Strategy Implementation" (24 hours)
📧 Email 3: "Brand Protection Consultation" (7 days)
```

#### **Estate Planning Guide Download:**
```
📧 Email 1: "Your Estate Planning Guide" (Immediate)
📧 Email 2: "Estate Strategy Implementation" (24 hours)
📧 Email 3: "Estate Planning Consultation" (7 days)
```

#### **General Resource Guide:**
```
📧 Email 1: "Your Legal Resource Guide" (Immediate)
📧 Email 2: "Strategic Implementation" (24 hours)
📧 Email 3: "Legal Strategy Consultation" (7 days)
```

### ➕ **ADD SUBSCRIBER**
**Trigger:** General email list signup
```
📧 Email 1: "Welcome to Jacobs Counsel" (Immediate)
📧 Email 2: "Legal Strategy Insights" (24 hours)
📧 Email 3: "Ready for Strategic Consultation?" (7 days)
```

---

## 📅 **POST-CONSULTATION SEQUENCES** (3 emails each, After booking)

### 🏛️ **POST-CONSULTATION GENERAL**
**Trigger:** Calendly webhook `invitee.created` - General consultation
```
📧 Email 1: "Consultation Confirmation" (Immediate)
📧 Email 2: "Consultation Preparation Guide" (24 hours)
📧 Email 3: "Looking Forward to Our Meeting" (1 hour before)
```

### 🏠 **POST-CONSULTATION ESTATE**
**Trigger:** Estate planning consultation booked
```
📧 Email 1: "Estate Consultation Confirmed" (Immediate)
📧 Email 2: "Estate Planning Preparation" (24 hours)
📧 Email 3: "Your Estate Strategy Session" (1 hour before)
```

### 🏢 **POST-CONSULTATION BUSINESS** 
**Trigger:** Business consultation booked
```
📧 Email 1: "Business Strategy Consultation Confirmed" (Immediate)
📧 Email 2: "Business Legal Preparation Guide" (24 hours)
📧 Email 3: "Your Business Strategy Session" (1 hour before)
```

### 🛡️ **POST-CONSULTATION BRAND**
**Trigger:** Brand protection consultation booked
```
📧 Email 1: "Brand Protection Consultation Confirmed" (Immediate)
📧 Email 2: "Brand Strategy Preparation" (24 hours)  
📧 Email 3: "Your Brand Protection Session" (1 hour before)
```

### 🏛️ **POST-CONSULTATION COUNSEL**
**Trigger:** Outside counsel consultation booked
```
📧 Email 1: "Legal Counsel Consultation Confirmed" (Immediate)
📧 Email 2: "Strategic Partnership Preparation" (24 hours)
📧 Email 3: "Your Legal Strategy Session" (1 hour before)
```

### ⭐ **POST-CONSULTATION VIP**
**Trigger:** VIP consultation booked (high-value clients)
```
📧 Email 1: "VIP Consultation Confirmed" (Immediate)
📧 Email 2: "Executive Legal Strategy Preparation" (24 hours)
📧 Email 3: "Your Strategic Legal Session" (1 hour before)
```

---

## 🔄 **RE-ENGAGEMENT SEQUENCES** (2-3 emails each, Inactive leads)

### 📞 **30-DAY RE-ENGAGEMENT**
**Trigger:** No engagement for 30 days
```
📧 Email 1: "Still Building Something Great?" (Day 30)
📧 Email 2: "Legal Strategy Check-in" (Day 35)
📧 Email 3: "Final Legal Strategy Invitation" (Day 40)
```

### 📞 **90-DAY RE-ENGAGEMENT**
**Trigger:** No engagement for 90 days  
```
📧 Email 1: "Time for a Legal Strategy Update?" (Day 90)
📧 Email 2: "Final Strategic Legal Opportunity" (Day 95)
```

---

## 🎛️ **EMAIL AUTOMATION LOGIC**

### **📊 Lead Scoring Triggers:**
- **90+ Score** → VIP Sequence (appropriate to profile)
- **70-89 Score** → Premium Nurture Sequence
- **<70 Score** → Standard Nurture Sequence

### **👤 Profile Detection:**
- **Athletes:** `profession: 'athlete'` OR `careerType: 'professional_athlete'`
- **Creators:** `businessType: 'creator'` OR `socialFollowing > 100k`
- **Startups:** `businessStage: 'startup'` OR `fundingStage` exists
- **High-Net-Worth Families:** `grossEstate > $10M` OR `familyOffice: true`

### **⏰ Email Timing:**
- **Immediate:** Welcome/confirmation emails (0 delay)
- **2 Hours:** Follow-up for VIP sequences only
- **24 Hours:** Educational content and strategy emails
- **7 Days:** Consultation invitations and call-to-action
- **30+ Days:** Re-engagement sequences

### **🔄 Smart Automation Features:**
- **Calendly Integration:** Auto-pause sequences when consultation booked
- **Lead Scoring:** Dynamic pathway assignment based on form data
- **Profile Detection:** Audience-specific content and tone
- **Re-engagement:** Automatic follow-up for inactive leads

---

## 📈 **TOTAL EMAIL INVENTORY:**
- **VIP Sequences:** 5 pathways × 4 emails = **20 emails**
- **Premium Nurture:** 1 pathway × 4 emails = **4 emails**  
- **Standard Nurture:** 1 pathway × 3 emails = **3 emails**
- **Intake Sequences:** 9 pathways × 3 emails = **27 emails**
- **Post-Consultation:** 6 pathways × 3 emails = **18 emails**
- **Re-engagement:** 2 pathways × 2-3 emails = **5 emails**

### **🏆 GRAND TOTAL: 77 UNIQUE EMAILS**
### **📊 ACROSS 24 DIFFERENT PATHWAYS**

---

**All emails feature:**
- ✅ **Visible blue buttons** (no white-on-white)
- ✅ **Strong, action-oriented copy** for high-achievers
- ✅ **Legal compliance** with proper disclaimers
- ✅ **Personalized content** based on form data
- ✅ **Professional formatting** appropriate for law firms