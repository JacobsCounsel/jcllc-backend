// index.js — Microsoft Graph email + AI summaries (client welcome packet + internal brief). Always returns 200 OK.

import express from 'express';
import multer from 'multer';
import axios from 'axios';

const app = express();
const upload = multer({ limits: { fileSize: 20 * 1024 * 1024 } }); // 20MB

// --- CORS ---
const ALLOWED = process.env.ALLOWED_ORIGIN || '*';
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', ALLOWED);
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept');
  res.setHeader('Access-Control-Max-Age', '86400');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

app.get('/', (_req, res) => res.status(200).send('Estate intake system: OK'));
app.get('/health', (_req, res) => res.status(200).json({ ok: true }));

// Helpers
function pick(obj, keys){ return keys.reduce((o,k)=> (o[k]=obj?.[k]||'', o), {}); }
function now(){ return new Date().toISOString().replace('T',' ').replace('Z',''); }
function log(id, msg, extra={}){ console.log(`[${now()}][${id}] ${msg}`, extra); }

// ---------- AI Prompts ----------
function buildAISummaryPrompt(d){
  return [
    'You are a paralegal drafting a concise internal summary for an estate-planning attorney.',
    'Output 4–6 short bullets, then ONE sentence recommending Will vs. RLT. Plain English.',
    'No personal opinions, no extra fluff.',
    '',
    `Client: ${d.firstName} ${d.lastName} (${d.state})`,
    `Marital: ${d.maritalStatus}; Minor children: ${d.hasMinorChildren}`,
    `Executors: ${d.executorPrimary} | Alt1 ${d.executorAlt1} | Alt2 ${d.executorAlt2}`,
    `Guardians: ${d.guardianPrimary} | Alt1 ${d.guardianAlt1} | Alt2 ${d.guardianAlt2}`,
    `Financial POA: ${d.poaPrimary} | Alt1 ${d.poaAlt1} | Alt2 ${d.poaAlt2}`,
    `Health Care POA: ${d.hcpoaPrimary} | Alt1 ${d.hcpoaAlt1} | Alt2 ${d.hcpoaAlt2}`,
    `HIPAA recipients: ${d.hipaaRecipients}`,
    `Trust roles: Initial ${d.initialTrustees}; Disability ${d.disabilityTrusteePrimary}/${d.disabilityTrusteeAlt1}/${d.disabilityTrusteeAlt2}; Death ${d.deathTrusteePrimary}/${d.deathTrusteeAlt1}/${d.deathTrusteeAlt2}`,
    `Assets flags: Home=${d.ownHome}, Other RE=${d.otherRealEstate}, Retirement=${d.retirementAccounts}, LifeIns=${d.lifeInsurance}, Bank/Invest=${d.bankInvestment}, Business=${d.ownBusiness}, Other=${d.otherAssets}`,
    `Concerns: ${d.concerns}`,
    `Wishes: Disposition=${d.disposition}; Gifts=${d.specificGifts}; Notes=${d.notes}`,
    `Package preference: ${d.packagePreference}`
  ].join('\n');
}

function buildClientPrompt(d){
  return [
    'You are writing to a new estate planning client.',
    'Write a short, clear welcome email with three sections:',
    '',
    '1) What estate planning is and why it matters (3–4 sentences, plain English).',
    '2) What their answers mean for their situation — summarize key factors from their intake form in a way that is reassuring and easy to understand.',
    '3) What happens next in the process — outline the steps we will take, from reviewing their intake to sending them a draft engagement letter, drafting documents, and scheduling a signing meeting.',
    '',
    'Tone: warm, professional, confident. Avoid legal jargon. No prices.',
    '',
    `Client's key answers: State=${d.state}; Marital=${d.maritalStatus}; Minor children=${d.hasMinorChildren}; Package preference=${d.packagePreference}`,
    `Executors: ${d.executorPrimary}, ${d.executorAlt1}, ${d.executorAlt2}`,
    `Guardians: ${d.guardianPrimary}, ${d.guardianAlt1}, ${d.guardianAlt2}`,
    `Financial POA: ${d.poaPrimary}, ${d.poaAlt1}, ${d.poaAlt2}`,
    `Health Care POA: ${d.hcpoaPrimary}, ${d.hcpoaAlt1}, ${d.hcpoaAlt2}`,
    `Assets: Home=${d.ownHome}, Other RE=${d.otherRealEstate}, Retirement=${d.retirementAccounts}, Life Insurance=${d.lifeInsurance}, Bank/Invest=${d.bankInvestment}, Business=${d.ownBusiness}, Other=${d.otherAssets}`,
    `Concerns: ${d.concerns || 'None noted'}`,
    '',
    'End with a friendly invitation to reach out with questions.'
  ].join('\n');
}

async function getAISummary(prompt){
  if (!process.env.OPENAI_API_KEY) return null;
  const model = process.env.OPENAI_MODEL || 'gpt-4o-mini';
  const body = { model, messages: [{ role: 'user', content: prompt }], temperature: 0.2 };
  const r = await axios.post('https://api.openai.com/v1/chat/completions', body, {
    headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
    timeout: 12000
  });
  return r.data?.choices?.[0]?.message?.content?.trim() || null;
}

// ---------- Microsoft Graph (app-only) ----------
async function getGraphToken(){
  const url = `https://login.microsoftonline.com/${process.env.MS_TENANT_ID}/oauth2/v2.0/token`;
  const params = new URLSearchParams();
  params.append('client_id', process.env.MS_CLIENT_ID);
  params.append('client_secret', process.env.MS_CLIENT_SECRET);
  params.append('scope', 'https://graph.microsoft.com/.default');
  params.append('grant_type', 'client_credentials');
  const r = await axios.post(url, params, { headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, timeout: 10000 });
  return r.data.access_token;
}

async function sendGraphMail({ accessToken, from, to, subject, text }) {
  const url = `https://graph.microsoft.com/v1.0/users/${encodeURIComponent(from)}/sendMail`;
  const payload = {
    message: {
      subject,
      body: { contentType: 'Text', content: text },
      toRecipients: [{ emailAddress: { address: to } }],
      from: { emailAddress: { address: from } }
    },
    saveToSentItems: true
  };
  await axios.post(url, payload, { headers: { Authorization: `Bearer ${accessToken}` }, timeout: 12000 });
}

// ---- MAIN INTAKE ----
app.post('/estate-intake', upload.array('document'), async (req, res) => {
  const reqId = Math.random().toString(36).slice(2,8);

  // Intake snapshot
  const d = pick(req.body || {}, [
    'firstName','lastName','email','phone','address1','address2','city','county','zip','state','maritalStatus','hasMinorChildren',
    'spouseName','spouseEmail','children',
    'executorPrimary','executorAlt1','executorAlt2','guardianPrimary','guardianAlt1','guardianAlt2',
    'poaPrimary','poaAlt1','poaAlt2','hcpoaPrimary','hcpoaAlt1','hcpoaAlt2','hipaaRecipients',
    'initialTrustees','disabilityTrusteePrimary','disabilityTrusteeAlt1','disabilityTrusteeAlt2','deathTrusteePrimary','deathTrusteeAlt1','deathTrusteeAlt2',
    'ownHome','otherRealEstate','retirementAccounts','lifeInsurance','bankInvestment','ownBusiness','otherAssets','concerns','disposition','specificGifts','notes',
    'packagePreference'
  ]);

  const sender   = process.env.MS_SENDER || 'intake@jacobscounsellaw.com';
  const notifyTo = process.env.NOTIFY_TO || sender;
  const booking  = process.env.MOTION_LINK || 'https://app.usemotion.com/meet/';

  // 1) AI (best-effort)
  let internalAI = null, clientAI = null;
  try { internalAI = await getAISummary(buildAISummaryPrompt(d)); }
  catch(e){ log(reqId, 'AI internal error', { status: e.response?.status, data: e.response?.data || e.message }); }
  try { clientAI = await getAISummary(buildClientPrompt(d)); }
  catch(e){ log(reqId, 'AI client error', { status: e.response?.status, data: e.response?.data || e.message }); }

  // 2) Email via Graph (best-effort)
  try{
    if (process.env.MS_TENANT_ID && process.env.MS_CLIENT_ID && process.env.MS_CLIENT_SECRET) {
      const token = await getGraphToken();

      // Client email
      if (d.email) {
        const clientText = [
          clientAI || `Thanks ${d.firstName || ''}, we received your Estate Planning intake. We’ll review and recommend the best path for you.`,
          '',
          `Book next steps: ${booking}`,
          '',
          'We use secure systems and may use AI to speed drafting. An attorney reviews every plan.'
        ].join('\n');
        await sendGraphMail({
          accessToken: token,
          from: sender,
          to: d.email,
          subject: 'We received your Estate Planning intake',
          text: clientText
        });
      }

      // Internal email
      const internalLines = [
        `New intake received: ${d.firstName} ${d.lastName}`,
        `Email: ${d.email}  Phone: ${d.phone}`,
        `State: ${d.state}  Marital: ${d.maritalStatus}  Minors: ${d.hasMinorChildren}`,
        `Executors: ${d.executorPrimary} | ${d.executorAlt1} | ${d.executorAlt2}`,
        `Guardians: ${d.guardianPrimary} | ${d.guardianAlt1} | ${d.guardianAlt2}`,
        `POA: ${d.poaPrimary} | ${d.poaAlt1} | ${d.poaAlt2}`,
        `HCPOA: ${d.hcpoaPrimary} | ${d.hcpoaAlt1} | ${d.hcpoaAlt2}`,
        `Package Pref: ${d.packagePreference}`,
        '',
        'AI Summary:',
        internalAI || '(unavailable)'
      ];
      await sendGraphMail({
        accessToken: token,
        from: sender,
        to: notifyTo,
        subject: `New Estate Intake — ${d.firstName} ${d.lastName}`,
        text: internalLines.join('\n')
      });

      log(reqId, 'Graph emails sent', { client: !!d.email, toClient: d.email, toInternal: notifyTo, ai: !!internalAI });
    } else {
      log(reqId, 'Graph env not set — skipping email');
    }
  } catch (e) {
    const status = e.response?.status;
    const data = e.response?.data || e.message;
    log(reqId, 'Graph email error', { status, data });
  }

  // 3) Always return success to browser
  return res.status(200).json({ ok: true, id: reqId });
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log('Server listening on', PORT));
