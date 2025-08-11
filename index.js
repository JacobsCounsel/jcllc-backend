// index.js — Email-only integration (client + internal). Always returns 200 OK.

import express from 'express';
import multer from 'multer';
import sgMail from '@sendgrid/mail';

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

// ---- MAIN INTAKE ----
app.post('/estate-intake', upload.array('document'), async (req, res) => {
  const reqId = Math.random().toString(36).slice(2,8);

  // Fields we care about for emails (safe subset)
  const d = pick(req.body || {}, [
    'firstName','lastName','email','phone','state','maritalStatus','hasMinorChildren',
    'executorPrimary','executorAlt1','executorAlt2',
    'guardianPrimary','guardianAlt1','guardianAlt2',
    'poaPrimary','poaAlt1','poaAlt2',
    'hcpoaPrimary','hcpoaAlt1','hcpoaAlt2',
    'packagePreference'
  ]);

  // 1) Send emails (best-effort). Never blocks the final 200.
  try{
    if (process.env.SENDGRID_API_KEY) {
      sgMail.setApiKey(process.env.SENDGRID_API_KEY);

      const fromEmail = process.env.FROM_EMAIL || 'intake@jacobscounsellaw.com';
      const notifyTo  = process.env.NOTIFY_TO  || fromEmail;
      const booking   = process.env.MOTION_LINK || 'https://app.usemotion.com/meet/';

      // Client email (if client provided email)
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

        await sgMail.send({
          to: d.email,
          from: fromEmail,
          subject: 'We received your Estate Planning intake',
          text: clientText
        });
      }

      // Internal notification (always)
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

      await sgMail.send({
        to: notifyTo,
        from: fromEmail,
        subject: `New Estate Intake — ${d.firstName} ${d.lastName}`,
        text: internalText
      });

      log(reqId, 'Email sent', { client: !!d.email, toClient: d.email, toInternal: notifyTo });
    } else {
      log(reqId, 'SENDGRID_API_KEY not set — skipping email');
    }
  } catch (e) {
    log(reqId, 'Email error', { err: e?.response?.body || e.message });
    // continue regardless
  }

  // 2) Return success to the browser (always)
  return res.status(200).json({ ok: true, id: reqId });
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log('Server listening on', PORT));
