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

    // Attachments (safe caps to avoid Graph chunk upload)
    let total = 0;
    const attachments = [];
    for (const f of files) {
      if (!f?.buffer) continue;
      if (f.size > 3 * 1024 * 1024) continue;         // skip single files >3MB
      if (total + f.size > 10 * 1024 * 1024) break;   // cap total ~10MB
      attachments.push({ filename: f.originalname, contentType: f.mimetype, content: f.buffer });
      total += f.size;
    }

    // Estimated pricing (matches site logic)
    const marital = (form.maritalStatus || '').toLowerCase();
    const pkg = (form.packagePreference || '').toLowerCase();
    const married = marital === 'married';
    let price = null;
    if (pkg.includes('rlt')) price = married ? 4800 : 3800;
    else if (pkg.includes('will')) price = married ? 2950 : 2250;

    // Build AI summaries (safe if key missing)
    let internalSummary = null, clientSummary = null;
    try {
      const sums = await buildSummaries(form);
      internalSummary = sums.internal;
      clientSummary = sums.client;
    } catch (e) {
      console.error('OpenAI summary failed:', e.message);
    }

    // Compose emails
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

    const clientSubject = `We received your Jacobs Counsel estate planning intake`;
    const clientHtml = `
      <p>Thanks for completing your intake. We’ve started our review.</p>
      <p><b>What happens next</b></p>
      <ol>
        <li>We review your details and confirm the right plan (Will vs. RLT).</li>
        <li>We send a preliminary engagement draft and schedule your call.</li>
        <li>We finalize documents and sign.</li>
      </ol>
      ${clientSummary ? `<hr/><div>${clientSummary}</div>` : ''}
      <p style="margin-top:12px;color:#475467"><i>We use secure systems and may use AI for quality control and efficiency. An attorney reviews every plan.</i></p>
    `;

    // Send emails
    try {
      await sendGraphMail({ to: [INTAKE_NOTIFY_TO], subject: adminSubject, html: adminHtml, attachments });
    } catch (e) { console.error('Internal mail failed:', e.message); }
    if (clientEmail) {
      try { await sendGraphMail({ to: [clientEmail], subject: clientSubject, html: clientHtml }); }
      catch (e) { console.error('Client mail failed:', e.message); }
    }

    // Push to Clio Grow
    try {
      const referringUrl = form.referringUrl || req.headers.referer || 'https://jacobscounsellaw.com/intake';
      const clioResp = await pushToClioGrow(form, referringUrl);
      console.log('Clio Grow push OK', clioResp?.id || '');
    } catch (e) {
      console.error('Clio Grow push failed:', e.message);
    }

    // Respond to the browser
    res.json({ ok: true, price, submissionId });
  } catch (err) {
    console.error('Intake error:', err);
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
