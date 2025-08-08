// index.js — minimal server to prove deploy works
import express from 'express';
import multer from 'multer';

const app = express();
const upload = multer({ limits: { fileSize: 20 * 1024 * 1024 } }); // 20MB

// CORS: allow your site; for quick test, '*' is fine.
// After it works, change '*' to your Squarespace/custom domain.
const ALLOWED = process.env.ALLOWED_ORIGIN || '*';
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', ALLOWED);
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

app.get('/', (_req, res) => res.status(200).send('Estate intake system: OK'));

app.post('/estate-intake', upload.array('document'), (req, res) => {
  const body = req.body || {};
  const files = (req.files || []).map(f => f.originalname);
  return res.status(200).json({ ok: true, received: Object.keys(body).length, files });
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log('Server listening on', PORT));


