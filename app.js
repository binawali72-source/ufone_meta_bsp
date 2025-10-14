// app.js (Render/Express)
import express from 'express';
import crypto from 'crypto';
const app = express();

// raw body
app.use(express.raw({ type: '*/*' }));

const VERIFY_TOKEN = process.env.META_VERIFY_TOKEN;
const APP_SECRET = process.env.META_APP_SECRET;

app.get('/webhook', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];
  console.log('verify attempt', { mode, token, challenge: !!challenge });
  if (mode === 'subscribe' && token === VERIFY_TOKEN) {
    return res.status(200).send(challenge);
  }
  return res.status(403).send('Verification failed');
});

app.post('/webhook', (req, res) => {
  try {
    const raw = req.body;
    if (APP_SECRET) {
      const signature = req.headers['x-hub-signature-256'] || '';
      const expected = 'sha256=' + crypto.createHmac('sha256', APP_SECRET).update(raw).digest('hex');
      if (signature !== expected) {
        console.warn('Invalid signature');
        return res.status(403).send('Invalid signature');
      }
    }
    const body = JSON.parse(raw.toString('utf8'));
    console.log('📩 Webhook event:', JSON.stringify(body, null, 2));
    return res.status(200).send('EVENT_RECEIVED');
  } catch (err) {
    console.error(err);
    return res.status(500).send('Server error');
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log('listening', port));
