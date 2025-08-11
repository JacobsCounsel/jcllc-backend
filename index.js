// index.js — Email via Microsoft Graph (client + internal). Always returns 200 OK.

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

// --- Microsoft Graph auth (client credentials flow) ---
async function getGraphToken(){
  const tenant = process.env.MS_TENANT_ID;
  const clientId = process.env.MS_CLIENT_ID;
  const clientSecret = process.env.MS_CLIENT_SECRET;
  const url = `https://login.microsoftonline.com/${tenant}/oauth2/v2.0/token`;
  const params = new URLSearchParams();
  params.append('client_id', clientId);
  params.append('client_secret', clientSecret);
  params.append('scope', 'https://graph.microsoft.com/.default');
  params.append('grant_type', 'client_credentials');
  const r = await axios.post(url, params, { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } });
  return r.data.access_token;
}

async function sendGraphMail({ accessToken, from, to, subject, text }) {
  // Use the sender's mailbox (app-only) to send
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
  await axios.post(url, payload, { headers: { Authorization: `Bearer ${accessToken}` } });
}

// ---- MAIN INTAKE ----
app.post('/estate-intake', upload.array('document'), async (req, res) => {
  const reqId = Math.random().toString(36).slice(2,8);
  const d = pick(req.body || {}, [
    'firstName','lastName','email','phone','state','maritalStatus','hasMinorChildren',
    'executorPrimary','executorAlt1','executorAlt2',
    'guardianPrimary','guardianAlt1','guardianAlt2',
    'poaPrimary','poaAlt1','poaAlt2',
    'hcpoaPrimary','hcpoaAlt1','hcpoaAlt2',
    'packagePreference'
  ]);

  const sender = process.env.MS_SENDER || 'intake@jacobscounsellaw.com';
  const notifyTo = process.env.NOTIFY_TO || sender;
  const booking = process.env.MOTION_LINK || 'https://app.usemotion.com/meet/';

  // EMAILS via Graph (best-effort)
  try{
    if (process.env.MS_TENANT_ID && process.env.MS_CLIENT_ID && process.env.MS_CLIENT_SECRET) {
      const token = await getGraphToken();

      // Client email (if they gave an email)
      if (d.email) {
        const clientText = [
          `Thanks ${d.firstName || ''}, we received your Estate Planning intake.`,
          ``,
          `What happens next:`,
          `• We review your info`,
          `• We send a short summary and recommended plan`,
          `• Book next steps: ${booking}`,
          ``,
          `If you didn’t mean to submit this, reply and we’ll delete it.`
        ].join('\n');

        await sendGraphMail({
          accessToken: token,
          from: sender,
          to: d.email,
          subject: 'We received your Estate Planning intake',
          text: clientText
        });
      }

      // Internal email (always)
      const internalText = [
        `New intake received: ${d.firstName} ${d.lastName}`,
        `Email: ${d.email}  Phone: ${d.phone}`,
        `State: ${d.state}  Marital: ${d.maritalStatus}  Minors: ${d.hasMinorChildren}`,
        `Executors: ${d.executorPrimary} | ${d.executorAlt1} | ${d.executorAlt2}`,
        `Guardians: ${d.guardianPrimary} | ${d.guardianAlt1} | ${d.guardianAlt2}`,
        `POA: ${d.poaPrimary} | ${d.poaAlt1} | ${d.poaAlt2}`,
        `HCPOA: ${d.hcpoaPrimary} | ${d.hcpoaAlt1} | ${d.hcpoaAlt2}`,
        `Package Pref: ${d.packagePreference}`
      ].join('\n');

      await sendGraphMail({
        accessToken: token,
        from: sender,
        to: notifyTo,
        subject: `New Estate Intake — ${d.firstName} ${d.lastName}`,
        text: internalText
      });

      log(reqId, 'Graph emails sent', { client: !!d.email, toClient: d.email, toInternal: notifyTo });
    } else {
      log(reqId, 'Graph env not set — skipping email');
    }
  } catch (e) {
    const status = e.response?.status;
    const data = e.response?.data || e.message;
    log(reqId, 'Graph email error', { status, data });
    // do not fail the client
  }

  return res.status(200).json({ ok: true, id: reqId });
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log('Server listening on', PORT));
