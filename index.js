// index.js — Intake backend with optional integrations (AI, Email, Drive, Clio)
// Always responds 200 to the client; logs integration results for you.

import express from 'express';
import multer from 'multer';
import axios from 'axios';
import cors from 'cors';

// Optional libs — only used if env vars set
import sgMail from '@sendgrid/mail';           // EMAIL: SENDGRID_API_KEY
import { google } from 'googleapis';           // DRIVE: GOOGLE_SERVICE_ACCOUNT, DRIVE_PARENT_FOLDER_ID

const app = express();
const upload = multer({ limits: { fileSize: 20 * 1024 * 1024 } }); // 20MB per file

// ---- CORS (update ALLOWED_ORIGIN) ----
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

// ---------- Helpers ----------
function pick(obj, keys){ return keys.reduce((o,k)=> (o[k]=obj[k]||'', o), {}); }
function now(){ return new Date().toISOString().replace('T',' ').replace('Z',''); }
function log(id, msg, extra={}){ console.log(`[${now()}][${id}] ${msg}`, extra); }

// Google Drive client (only if creds exist)
function getDriveClient(){
  const svc = process.env.GOOGLE_SERVICE_ACCOUNT;
  const parent = process.env.DRIVE_PARENT_FOLDER_ID;
  if (!svc || !parent) return null;
  try{
    const creds = JSON.parse(svc);
    const jwt = new google.auth.JWT(
      creds.client_email,
      null,
      creds.private_key,
      ['https://www.googleapis.com/auth/drive.file']
    );
    return { drive: google.drive({ version: 'v3', auth: jwt }), parent };
  }catch(e){ console.error('Drive creds parse error', e.message); return null; }
}

// Upload one file to Drive
async function uploadToDrive(driveClient, file){
  const { drive, parent } = driveClient;
  const res = await drive.files.create({
    requestBody: { name: file.originalname, parents: [parent] },
    media: { mimeType: file.mimetype, body: Buffer.from(file.buffer) }
  });
  const fileId = res.data.id;
  // Make linkable (anyone with link – adjust to your policy)
  await drive.permissions.create({ fileId, requestBody: { role: 'reader', type: 'anyone' }});
  const link = `https://drive.google.com/file/d/${fileId}/view`;
  return link;
}

// Build a succinct AI prompt
function buildAISummaryPrompt(d){
  return [
    `Client: ${d.firstName} ${d.lastName} (${d.state}) — Marital: ${d.maritalStatus}; Minors: ${d.hasMinorChildren}`,
    `Executors: ${d.executorPrimary} | Alt1: ${d.executorAlt1} | Alt2: ${d.executorAlt2}`,
    `Guardians: ${d.guardianPrimary} | Alt1: ${d.guardianAlt1} | Alt2: ${d.guardianAlt2}`,
    `POA: ${d.poaPrimary} | Alt1: ${d.poaAlt1} | Alt2: ${d.poaAlt2}`,
    `HCPOA: ${d.hcpoaPrimary} | Alt1: ${d.hcpoaAlt1} | Alt2: ${d.hcpoaAlt2}`,
    `HIPAA: ${d.hipaaRecipients}`,
    `Trust Roles: Initial ${d.initialTrustees}; Disability ${d.disabilityTrusteePrimary}/${d.disabilityTrusteeAlt1}/${d.disabilityTrusteeAlt2}; Death ${d.deathTrusteePrimary}/${d.deathTrusteeAlt1}/${d.deathTrusteeAlt2}`,
    `Assets: Home=${d.ownHome}, OtherRE=${d.otherRealEstate}, Retirement=${d.retirementAccounts}, LifeIns=${d.lifeInsurance}, Bank/Inv=${d.bankInvestment}, Biz=${d.ownBusiness}, Other=${d.otherAssets}`,
    `Concerns: ${d.concerns}`,
    `Wishes: Disposition=${d.disposition}; Gifts=${d.specificGifts}; Notes=${d.notes}`,
    `Package Preference: ${d.packagePreference}`,
    ``,
    `Write a short, plain-English summary (3–6 bullets). Flag any red flags. Recommend Will vs RLT in one line.`
  ].join('\n');
}

// ---------- Main intake endpoint ----------
app.post('/estate-intake', upload.array('document'), async (req, res) => {
  const reqId = Math.random().toString(36).slice(2,8);
  const body = req.body || {};
  const files = req.files || [];

  // 1) SNAPSHOT data we care about (prevents undefined explosions)
  const d = pick(body, [
    'firstName','lastName','email','phone','address1','address2','city','county','zip','state','maritalStatus','hasMinorChildren','spouseName','spouseEmail','children',
    'executorPrimary','executorAlt1','executorAlt2','guardianPrimary','guardianAlt1','guardianAlt2',
    'poaPrimary','poaAlt1','poaAlt2','hcpoaPrimary','hcpoaAlt1','hcpoaAlt2','hipaaRecipients',
    'initialTrustees','disabilityTrusteePrimary','disabilityTrusteeAlt1','disabilityTrusteeAlt2','deathTrusteePrimary','deathTrusteeAlt1','deathTrusteeAlt2',
    'ownHome','otherRealEstate','retirementAccounts','lifeInsurance','bankInvestment','ownBusiness','otherAssets','concerns','disposition','specificGifts','notes',
    'packagePreference','ackNoAdvice','ackFees','consentESign','consentEngagement','typedSignature','signatureDate'
  ]);

  // 2) Respond to the browser LAST, but DO NOT BLOCK on integrations
  // We'll run integrations in try/catch and collect results. If any fail, we still 200.
  const result = { ok:true, id:reqId, ai:null, email:false, driveLinks:[], clio:false };

  // 3) DRIVE (optional)
  try{
    const dc = getDriveClient();
    if (dc && files.length){
      for (const f of files){
        try { const link = await uploadToDrive(dc, f); result.driveLinks.push(link); }
        catch(e){ log(reqId, 'Drive upload failed', { file:f.originalname, err:e.message }); }
      }
    }
  }catch(e){ log(reqId, 'Drive section error', { err:e.message }); }

  // 4) AI SUMMARY (optional)
  try{
    if (process.env.OPENAI_API_KEY){
      const prompt = buildAISummaryPrompt(d);
      // If you’re using the official OpenAI SDK, swap this axios call for the SDK call
      const ai = await axios.post('https://api.openai.com/v1/chat/completions', {
        model: 'gpt-5',               // <-- your provisioned model name
        messages: [{ role:'user', content: prompt }],
        temperature: 0.2
      }, { headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}` }});
      result.ai = ai.data?.choices?.[0]?.message?.content || null;
    }
  }catch(e){ log(reqId, 'OpenAI error', { err: e.response?.status, data: e.response?.data || e.message }); }

  // 5) EMAIL (optional, SendGrid)
  try{
    if (process.env.SENDGRID_API_KEY && d.email){
      sgMail.setApiKey(process.env.SENDGRID_API_KEY);
      const booking = process.env.MOTION_LINK || 'https://app.usemotion.com/meet/';
      const textSummary = result.ai ? result.ai : 'We received your intake. We’ll review and follow up shortly.';
      const clientMsg = {
        to: d.email,
        from: process.env.FROM_EMAIL || 'intake@jacobscounsellaw.com',
        subject: 'We received your Estate Planning intake',
        text: `${textSummary}\n\nBook here: ${booking}`,
      };
      const internalMsg = {
        to: process.env.NOTIFY_TO || (process.env.FROM_EMAIL || 'intake@jacobscounsellaw.com'),
        from: process.env.FROM_EMAIL || 'intake@jacobscounsellaw.com',
        subject: `New intake: ${d.firstName} ${d.lastName} (${d.state || ''}) [${reqId}]`,
        text: [
          `Client: ${d.firstName} ${d.lastName} — ${d.email} — ${d.phone}`,
          `State: ${d.state}; Marital: ${d.maritalStatus}; Minors: ${d.hasMinorChildren}`,
          `Executors: ${d.executorPrimary} | ${d.executorAlt1} | ${d.executorAlt2}`,
          `Guardians: ${d.guardianPrimary} | ${d.guardianAlt1} | ${d.guardianAlt2}`,
          `POA: ${d.poaPrimary} | ${d.poaAlt1} | ${d.poaAlt2}`,
          `HCPOA: ${d.hcpoaPrimary} | ${d.hcpoaAlt1} | ${d.hcpoaAlt2}`,
          `Assets: Home=${d.ownHome}, OtherRE=${d.otherRealEstate}, Ret=${d.retirementAccounts}, Ins=${d.lifeInsurance}, Bank/Inv=${d.bankInvestment}, Biz=${d.ownBusiness}`,
          `Package Pref: ${d.packagePreference}`,
          result.driveLinks.length ? `Files: ${result.driveLinks.join('\n')}` : `Files: none`,
          `AI Summary:\n${result.ai || '(none)'}`
        ].join('\n')
      };
      await sgMail.send(clientMsg).catch(e => { throw new Error(e?.response?.body ? JSON.stringify(e.response.body) : e.message); });
      await sgMail.send(internalMsg).catch(e => { throw new Error(e?.response?.body ? JSON.stringify(e.response.body) : e.message); });
      result.email = true;
    }
  }catch(e){ log(reqId, 'Email error', { err:e.message }); }

  // 6) CLIO (optional)
  try{
    if (process.env.CLIO_ACCESS_TOKEN){
      // Create contact (very basic). You may need to adjust field names to your Clio setup.
      const hdrs = { Authorization: `Bearer ${process.env.CLIO_ACCESS_TOKEN}` };
      const contactResp = await axios.post('https://app.clio.com/api/v4/contacts', {
        contact: {
          first_name: d.firstName, last_name: d.lastName, email: d.email,
          phone_numbers: d.phone ? [{ number: d.phone, name: 'Mobile' }] : [],
          addresses: [{
            street: [d.address1, d.address2].filter(Boolean).join(' '),
            city: d.city, province: d.state, postal_code: d.zip, country: 'US', address_type: 'home'
          }]
        }
      }, { headers: hdrs });
      const contactId = contactResp?.data?.id;

      // Add a note with the AI summary + files
      const noteText = [
        'Intake Summary:',
        result.ai || '(no AI summary)',
        '',
        `Executors: ${d.executorPrimary} | Alt1: ${d.executorAlt1} | Alt2: ${d.executorAlt2}`,
        `Guardians: ${d.guardianPrimary} | Alt1: ${d.guardianAlt1} | Alt2: ${d.guardianAlt2}`,
        `POA: ${d.poaPrimary} | Alt1: ${d.poaAlt1} | Alt2: ${d.poaAlt2}`,
        `HCPOA: ${d.hcpoaPrimary} | Alt1: ${d.hcpoaAlt1} | Alt2: ${d.hcpoaAlt2}`,
        result.driveLinks.length ? `Files: ${result.driveLinks.join(' | ')}` : 'Files: none'
      ].join('\n');

      await axios.post('https://app.clio.com/api/v4/communications', {
        communication: {
          type: 'Note',
          subject: 'Estate Intake',
          body: noteText,
          contacts: [contactId]
        }
      }, { headers: hdrs });

      result.clio = true;
    }
  }catch(e){ log(reqId, 'Clio error', { err: e.response?.status, data: e.response?.data || e.message }); }

  // 7) Return to the browser — never fail the user
  log(reqId, 'Intake processed', { email: result.email, ai: !!result.ai, drive: result.driveLinks.length, clio: result.clio });
  return res.status(200).json({ ok:true, id:reqId });
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log('Server listening on', PORT));

