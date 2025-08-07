import express from 'express';
import multer from 'multer';
import axios from 'axios';
import dotenv from 'dotenv';
import { google } from 'googleapis';
import sgMail from '@sendgrid/mail';
import { PassThrough } from 'stream';

dotenv.config();

const app = express();
const upload = multer({ storage: multer.memoryStorage() });
app.use(express.json());

// --- healthcheck ---
app.get('/', (_req, res) => {
  res.status(200).send('Estate intake system: OK');
});

// --- configure SendGrid ---
if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
}

// --- Google Drive auth (optional until creds added) ---
let drive = null;
if (process.env.GOOGLE_CREDENTIALS) {
  try {
    const creds = JSON.parse(process.env.GOOGLE_CREDENTIALS);
    const auth = new google.auth.GoogleAuth({
      credentials: creds,
      scopes: ['https://www.googleapis.com/auth/drive.file']
    });
    drive = google.drive({ version: 'v3', auth });
  } catch (e) {
    console.error('Invalid GOOGLE_CREDENTIALS JSON');
  }
}

// helper: upload buffer to Drive
async function uploadToDrive(file) {
  if (!drive || !file) return null;
  const pass = new PassThrough();
  pass.end(Buffer.from(file.buffer));
  const res = await drive.files.create({
    requestBody: { name: file.originalname, mimeType: file.mimetype },
    media: { mimeType: file.mimetype, body: pass }
  });
  return `https://drive.google.com/file/d/${res.data.id}/view`;
}

// helper: build GPT prompt
function buildPrompt(formData, fileUrl) {
  return `You are an estate planning assistant for a law firm operating in NY, NJ, and OH.

Based on the intake below, produce:
1) Bullet-point summary of client, family, agents, assets, wishes.
2) Complexity rating: Basic / Moderate / Complex.
3) Red flags or missing info.
4) Package recommendation (Will vs RLT) and note if client's choice differs.

Client Intake (JSON):
${JSON.stringify(formData, null, 2)}

Uploaded Docs: ${fileUrl || 'None'}`;
}

// helper: compute quoted price
function computePrice({ maritalStatus, packagePreference }) {
  const married = (maritalStatus || '').toLowerCase() === 'married';
  const pref = (packagePreference || 'Not sure').toLowerCase();
  if (pref.includes('rlt')) return married ? 4000 : 3250;
  if (pref.includes('will')) return married ? 2250 : 1850;
  return married ? 2250 : 1850;
}

// --- main intake route ---
app.post('/estate-intake', upload.single('document'), async (req, res) => {
  const formData = req.body || {};
  const file = req.file || null;

  try {
    // 1) Upload file (optional)
    const fileUrl = await uploadToDrive(file);

    // 2) Call OpenAI (GPT-5 placeholder)
    const prompt = buildPrompt(formData, fileUrl);

    const ai = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-5',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3
      },
      { headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}` } }
    );

    const summary = ai.data.choices?.[0]?.message?.content || 'No summary generated.';

    // 3) Create/Update in Clio Grow
    try {
      await axios.post(
        'https://app.clio.com/api/v4/contacts',
        {
          contact: {
            first_name: formData.firstName,
            last_name: formData.lastName,
            email: formData.email,
            custom_fields: { estate_summary: summary }
          }
        },
        { headers: { Authorization: `${process.env.CLIO_ACCESS_TOKEN}` } }
      );
    } catch (e) {
      console.error('Clio error:', e?.response?.data || e.message);
    }

    // 4) Email client via SendGrid
    const quoted = computePrice(formData);
    const motionLink = 'https://app.usemotion.com/meet/drew-jacobs-jcllc/8xx9grm';

    if (process.env.SENDGRID_API_KEY && formData.email) {
      await sgMail.send({
        to: formData.email,
        from: 'intake@jacobscounsellaw.com',
        subject: 'Next Steps for Your Estate Plan',
        text: `Thanks for completing the intake, ${formData.firstName || ''}.

Summary:
${summary}

Estimated flat fee (based on your selection): $${quoted}.
Schedule your design meeting: ${motionLink}

Uploaded docs (if any): ${fileUrl || 'None'}`
      }).catch(err => console.error('SendGrid error:', err?.response?.body || err.message));
    }

    res.status(200).json({ ok: true, summary, fileUrl });
  } catch (err) {
    console.error(err?.response?.data || err.message);
    res.status(500).json({ ok: false, error: 'Processing failed' });
  }
});

// --- start server ---
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Estate intake listening on :${PORT}`));
