// index.js — Jacobs Counsel Estate Intake (Squarespace → Render)
// Features: MS365 email (client + internal), OpenAI summaries, Clio Grow Lead Inbox push.

import express from 'express';
import cors from 'cors';
import multer from 'multer';

// -------------------- Config --------------------
const PORT = process.env.PORT || 3000;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || '';
const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini'; // set to 'gpt-5' if enabled in your account

const MS_TENANT_ID = process.env.MS_TENANT_ID || process.env.MICROSOFT_TENANT_ID || '';
const MS_CLIENT_ID = process.env.MS_CLIENT_ID || process.env.MICROSOFT_CLIENT_ID || '';
const MS_CLIENT_SECRET = process.env.MS_CLIENT_SECRET || process.env.MICROSOFT_CLIENT_SECRET || '';
const MS_GRAPH_SENDER = process.env.MS_GRAPH_SENDER || process.env.MICROSOFT_SENDER || ''; // user email or UPN

const INTAKE_NOTIFY_TO = process.env.INTAKE_NOTIFY_TO || 'intake@jacobscounsellaw.com';

const CLIO_GROW_BASE = process.env.CLIO_GROW_BASE || 'https://grow.clio.com';
const CLIO_GROW_INBOX_TOKEN = process.env.CLIO_GROW_INBOX_TOKEN || '';

// -------------------- App basics --------------------
const app = express();
app.use(cors());
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 15 * 1024 * 1024, files: 10 } // 15MB each, up to 10 files
});

// -------------------- Microsoft Graph helpers --------------------
async function getGraphToken() {
  if (!MS_TENANT_ID || !MS_CLIENT_ID || !MS_CLIENT_SECRET) {
    throw new Error('MS Graph credentials missing');
  }
  const body = new URLSearchParams({
    client_id: MS_CLIENT_ID,
    client_secret: MS_CLIENT_SECRET,
    scope: 'https://graph.microsoft.com/.default',
    grant_type: 'client_credentials'
  });
  const resp = await fetch(`https://login.microsoftonline.com/${MS_TENANT_ID}/oauth2/v2.0/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body
  });
  if (!resp.ok) throw new Error(`Token error ${resp.status}`);
  const json = await resp.json();
  return json.access_token;
}

async function sendGraphMail({ to, subject, text, html, attachments = [] }) {
  if (!MS_GRAPH_SENDER) throw new Error('MS_GRAPH_SENDER not set');
  const token = await getGraphToken();

  // keep total attachment size modest to avoid Graph chunking
  let total = 0;
  const atts = [];
  for (const a of attachments) {
    if (!a?.content) continue;
    total += a.content.length || 0;
    if (total > 10 * 1024 * 1024) break; // cap ~10MB
    atts.push({
      '@odata.type': '#microsoft.graph.fileAttachment',
      name: a.filename || 'attachment',
      contentType: a.contentType || 'application/octet-stream',
      contentBytes: Buffer.isBuffer(a.content) ? a.content.toString('base64') : Buffer.from(a.content).toString('base64')
    });
  }

  const mail = {
    message: {
      subject,
      body: { contentType: html ? 'HTML' : 'Text', content: html || text || '' },
      toRecipients: (to || []).map(address => ({ emailAddress: { address } })),
      attachments: atts
    },
    saveToSentItems: true
  };

  const resp = await fetch(`https://graph.microsoft.com/v1.0/users/${encodeURIComponent(MS_GRAPH_SENDER)}/sendMail`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(mail)
  });
  if (!resp.ok) {
    const errTxt = await resp.text().catch(() => '');
    throw new Error(`sendMail failed ${resp.status} ${errTxt}`);
  }
}

// -------------------- OpenAI summary helper --------------------
async function buildSummaries(form) {
  if (!OPENAI_API_KEY) return { internal: null, client: null };

  const sys = `You are an estate-planning attorney for Jacobs Counsel. 
Write crisp, liability-aware summaries. 
Jurisdictions: NY, NJ, OH. 
Avoid legal advice; this intake is preliminary.`;

  const user = `
Create two pieces from the client's intake (use plain language, no PII beyond what they provided):

1) INTERNAL_SUMMARY:
- One-paragraph snapshot (who, where, marital, minors)
- Key people: executor + alternates; POA; HC POA; guardians; HIPAA recipients
- Assets & flags (home, other RE, retirement, LI, business, special notes)
- Package lean (Will vs RLT) with 1–2 sentence rationale; mark "Tentative"
- Follow-ups: any missing decision-makers or conflicts

2) CLIENT_EMAIL:
- Warm explanation of what estate planning is (short)
- Based on their answers, what their choices mean (executor, POAs, guardians)
- What happens next in our process (review → plan recommendation → engagement → signing)
- Price range language using: Will (single $2,250 / married $2,950), RLT (single $3,800 / married $4,800) — say “we’ll confirm after review”
- Close with reassurance: secure systems, AI used for quality control and efficiency, attorney review.

Client intake JSON:
${JSON.stringify(form, null, 2)}
`;

  const resp = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${OPENAI_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: OPENAI_MODEL,
      temperature: 0.3,
      messages: [
        { role: 'system', content: sys },
        { role: 'user', content: user }
      ]
    })
  });
  const data = await resp.json();
  if (!resp.ok) throw new Error(`OpenAI ${resp.status} ${JSON.stringify(data)}`);

  const out = data.choices?.[0]?.message?.content || '';
  const iTag = 'INTERNAL_SUMMARY:';
  const cTag = 'CLIENT_EMAIL:';
  const iIdx = out.indexOf(iTag);
  const cIdx = out.indexOf(cTag);

  let internal = null, client = null;
  if (iIdx !== -1 && cIdx !== -1) {
    internal = out.slice(iIdx + iTag.length, cIdx).trim();
    client = out.slice(cIdx + cTag.length).trim();
  } else {
    // fallback: single body
    internal = out;
    client = out;
  }
  return { internal, client };
}

// -------------------- Clio Grow Lead Inbox helpers --------------------
function buildClioLeadMessage(b = {}) {
  return [
    'Matter: Estate Planning',
    `State: ${b.state || '-'}`,
    `Marital: ${b.maritalStatus || '-'}`,
    `Minors: ${b.hasMinorChildren || '-'}`,
    `Spouse: ${b.spouseName || '-'}`,
    `Package: ${b.packagePreference || 'Not sure'}`,
    `Executor: ${b.executorPrimary || '-'} | Alts: ${b.executorAlt1 || '-'}, ${b.executorAlt2 || '-'}`,
    `Fin. POA: ${b.poaPrimary || '-'}`,
    `HC POA: ${b.hcpoaPrimary || '-'}`,
    `Guardians: ${b.guardianPrimary || '-'}`,
    `Concerns: ${b.concerns || '-'}`,
    `Notes: ${b.notes || '-'}`,
    `Submitted: ${new Date().toISOString()}`
  ].join('\n');
}

async function pushToClioGrow(form, referringUrl) {
  if (!CLIO_GROW_INBOX_TOKEN) return { skipped: 'No CLIO_GROW_INBOX_TOKEN set' };

  const payload = {
    inbox_lead: {
      from_first: form.firstName || '',
      from_last:  form.lastName || '',
      from_email: form.email || '',
      from_phone: form.phone || '',
      from_message: buildClioLeadMessage(form),
      referring_url: referringUrl || 'https://jacobscounsellaw.com/intake',
      from_source: 'JacobsCounsel Intake'
    },
    inbox_lead_token: CLIO_GROW_INBOX_TOKEN
  };

  const res = await fetch(`${CLIO_GROW_BASE}/inbox_leads`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
    body: JSON.stringify(payload)
  });

  // 201 Created on success
  let data = {};
  try { data = await res.json(); } catch {}
  if (!res.ok && res.status !== 201) {
    throw new Error(`Clio Grow ${res.status} ${res.statusText} ${JSON.stringify(data)}`);
  }
  return data;
}

// -------------------- Routes --------------------
app.get('/', (_req, res) => res.json({ ok: true, service: 'estate-intake-system' }));

app.post('/estate-intake', upload.array('document'), async (req, res) => {
  try {
    const form = req.body || {};
    const files = req.files || [];
    const submissionId = form.submissionId || `${Date.now()}`;

    // ----- Attachments (safe caps) -----
    let total = 0;
    const attachments = [];
    for (const f of files) {
      if (!f?.buffer) continue;
      if (f.size > 3 * 1024 * 1024) continue; // skip single files >3MB
      if (total + f.size > 10 * 1024 * 1024) break; // cap total ~10MB
      attachments.push({ filename: f.originalname, contentType: f.mimetype, content: f.buffer });
      total += f.size;
    }

    // ----- Price logic -----
    const marital = (form.maritalStatus || '').toLowerCase();
    const pkg = (form.packagePreference || '').toLowerCase();
    const married = marital === 'married';
    let price = null;
    if (pkg.includes('rlt') || pkg.includes('trust')) price = married ? 3650 : 2900;
else if (pkg.includes('will')) price = married ? 1900 : 1500;

    // ----- AI summaries -----
    let internalSummary = null, clientSummary = null;
    try {
      const sums = await buildSummaries(form);
      internalSummary = sums.internal;
      clientSummary = sums.client;
    } catch (e) {
      console.error('OpenAI summary failed:', e.message);
    }

    // ----- Email content -----
    const clientEmail = (form.email || '').trim();
    const adminSubject = `New Estate Intake — ${form.firstName || ''} ${form.lastName || ''} (${form.state || ''})`;
    const adminHtml = `
      <h2>New Estate Intake</h2>
      <p><b>Name:</b> ${form.firstName || ''} ${form.lastName || ''}</p>
      <p><b>Email:</b> ${form.email || ''} — <b>Phone:</b> ${form.phone || ''}</p>
      <p><b>State:</b> ${form.state || ''}; <b>Marital:</b> ${form.maritalStatus || ''}; <b>Minors:</b> ${form.hasMinorChildren || ''}</p>
      <p><b>Package:</b> ${form.packagePreference || 'Not sure'}; <b>Est. Price:</b> ${price ? `$${price.toLocaleString()}` : '—'}</p>
      ${internalSummary ? `<hr/><pre style="white-space:pre-wrap;font-family:ui-monospace,Menlo,Consolas;font-size:13px">${internalSummary}</pre>` : ''}
      <hr/>
      <details><summary>Raw Form</summary><pre style="white-space:pre-wrap;font-family:ui-monospace,Menlo,Consolas;font-size:12px">${JSON.stringify(form, null, 2)}</pre></details>
    `;

    const clientSubject = `Jacobs Counsel — Your Estate Planning Intake & Next Steps`;
    const clientHtml = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Your Estate Planning Intake - Next Steps</title>
</head>
<body style="font-family: 'SF Pro Display', -apple-system, BlinkMacSystemFont, Arial, sans-serif; line-height: 1.6; color: #0f172a; margin: 0; padding: 0;">
    <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <!-- Header -->
        <div style="background: linear-gradient(90deg, #ff4d00, #0b1f1e); height: 6px; border-radius: 3px; margin-bottom: 24px;"></div>
        
        <h1 style="color: #ff4d00; font-size: 28px; margin: 0 0 16px; font-weight: 700;">Thank you for starting your estate plan with Jacobs Counsel</h1>
        
        <p style="font-size: 16px; margin: 16px 0;">Hi <strong>${form.firstName || ''}</strong>,</p>
        
        <p style="font-size: 16px; margin: 16px 0;">We've received your estate planning intake and will review it within <strong>1 business day</strong>. Here's what happens next:</p>
        
        <!-- Process Steps -->
        <div style="background: #f8fafc; padding: 24px; border-radius: 12px; margin: 24px 0; border: 2px solid #e2e8f0;">
            <h3 style="margin: 0 0 16px; color: #0b1f1e; font-size: 20px;">Our Process:</h3>
            <ol style="margin: 0; padding-left: 20px; color: #64748b;">
                <li style="margin: 8px 0;"><strong style="color: #0f172a;">Review & Quote (1-2 days):</strong> We'll send you a personalized flat-fee quote and engagement letter</li>
                <li style="margin: 8px 0;"><strong style="color: #0f172a;">Engagement:</strong> If you decide to proceed, sign the engagement letter and pay the retainer</li>
                <li style="margin: 8px 0;"><strong style="color: #0f172a;">Drafting (1 week):</strong> We'll prepare your custom documents based on your responses</li>
                <li style="margin: 8px 0;"><strong style="color: #0f172a;">Attorney Review (30 min):</strong> Schedule a video call to review your documents and make any adjustments</li>
                <li style="margin: 8px 0;"><strong style="color: #0f172a;">Execution:</strong> Sign your final documents with notary/witnesses (we provide instructions)</li>
                <li style="margin: 8px 0;"><strong style="color: #0f172a;">Funding (if trust):</strong> Transfer assets to your trust using our detailed checklist</li>
            </ol>
        </div>

        ${price ? `
        <!-- Pricing -->
        <div style="background: #f0fdf4; padding: 20px; border-radius: 12px; margin: 24px 0; border: 2px solid #bbf7d0; text-align: center;">
            <p style="margin: 0; font-size: 18px; font-weight: 600; color: #166534;">Estimated Investment: $${price.toLocaleString()}</p>
            <p style="margin: 8px 0 0; font-size: 14px; color: #059669;">Final pricing confirmed after review • Includes $350 self-signing credit</p>
        </div>
        ` : ''}
        
        <!-- Call to Action -->
        <div style="background: #e3f2fd; padding: 24px; border-radius: 12px; margin: 24px 0; text-align: center; border: 2px solid #7dd3fc;">
            <p style="margin: 0 0 16px; font-weight: 600; color: #0369a1; font-size: 16px;">Ready to schedule your consultation now?</p>
            <a href="https://app.usemotion.com/meet/drew-jacobs-jcllc/8xx9grm" 
               style="background: linear-gradient(135deg, #ff4d00, #0b1f1e); color: white; padding: 14px 28px; text-decoration: none; border-radius: 12px; display: inline-block; font-weight: 600; font-size: 16px;">
               📅 Book Your Attorney Review Session
            </a>
            <p style="margin: 12px 0 0; font-size: 14px; color: #0369a1;">30-minute consultation to review your custom estate plan</p>
        </div>
        
        <!-- What's Included -->
        <div style="margin: 24px 0;">
            <h3 style="color: #0b1f1e; font-size: 18px; margin: 0 0 12px;">What's Included in Your Package:</h3>
            <ul style="margin: 0; padding-left: 20px; color: #64748b;">
                <li style="margin: 6px 0;">Custom document drafting based on your responses</li>
                <li style="margin: 6px 0;">30-minute attorney review session via video call</li>
                <li style="margin: 6px 0;">Detailed signing instructions with notary/witness coordination</li>
                <li style="margin: 6px 0;">Funding checklist and bank letters (for trusts)</li>
                <li style="margin: 6px 0;">Ongoing document storage and annual check-ins</li>
                <li style="margin: 6px 0;">Electronic notarization available (additional fee)</li>
            </ul>
        </div>
        
        <p style="font-size: 16px; margin: 24px 0 16px;">Questions? Simply reply to this email or call us at <strong>(XXX) XXX-XXXX</strong>.</p>
        
        <p style="font-size: 16px; margin: 16px 0;">Best regards,<br>
        <strong style="color: #0b1f1e;">The Jacobs Counsel Team</strong></p>
        
        <!-- Footer -->
        <hr style="margin: 32px 0; border: none; border-top: 1px solid #e2e8f0;">
        <p style="font-size: 13px; color: #64748b; margin: 0;">
            This email was sent because you completed an estate planning intake at jacobscounsellaw.com. 
            Your information is confidential and this does not create an attorney-client relationship.
        </p>
    </div>
</body>
</html>
`;

    // ----- Send internal email -----
    try {
      console.log('📧 Sending internal email to', INTAKE_NOTIFY_TO);
      await sendGraphMail({
        to: [INTAKE_NOTIFY_TO],
        subject: adminSubject,
        html: adminHtml,
        attachments
      });
      console.log('✅ Internal email sent');
    } catch (e) {
      console.error('❌ Internal mail failed:', e.message);
    }

    // Send client email + always copy to intake@
if (clientEmail) {
  try {
    console.log('📧 Sending client email to', clientEmail, 'and copy to intake@jacobscounsellaw.com');
    await sendGraphMail({
      to: [clientEmail, 'intake@jacobscounsellaw.com'],
      subject: clientSubject,
      html: clientHtml
    });
    console.log('✅ Client email sent (client + intake@)');
  } catch (e) {
    console.error('❌ Client mail failed:', e.message);
  }
}

    // ----- Push to Clio Grow -----
    try {
      console.log('📤 Pushing lead to Clio Grow');
      const referringUrl = form.referringUrl || req.headers.referer || 'https://jacobscounsellaw.com/intake';
      const clioResp = await pushToClioGrow(form, referringUrl);
      console.log('✅ Clio Grow push OK', clioResp?.id || '');
    } catch (e) {
      console.error('❌ Clio Grow push failed:', e.message);
    }

    // ----- Respond to browser -----
    res.json({ ok: true, price, submissionId });

  } catch (err) {
    console.error('💥 Intake error:', err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

// ----- Global error handler (Multer-friendly) -----
app.use((err, req, res, next) => {
  if (err && err.code) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({ ok:false, error:'One or more files are too large (max 15MB each). Try again without the oversized file(s).' });
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(413).json({ ok:false, error:'Too many files (max 10). Remove some and try again.' });
    }
    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({ ok:false, error:'Unexpected file field. Please use the file picker in the form.' });
    }
  }
  console.error('Unhandled error:', err);
  res.status(500).json({ ok:false, error:'Server error. Please try again or email us.' });
});

app.listen(PORT, () => console.log(`estate-intake-system listening on ${PORT}`));
