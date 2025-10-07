import crypto from 'crypto';

export const config = { api: { bodyParser: false } };

function rawBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (c) => chunks.push(c));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

export default async function handler(req, res) {
  const VERIFY_TOKEN = process.env.META_VERIFY_TOKEN || 'test_verify_token';
  const APP_SECRET = process.env.META_APP_SECRET || 'test_app_secret';

  // --- GET verification (Meta callback setup) ---
  if (req.method === 'GET') {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
      return res.status(200).send(challenge);
    } else {
      return res.status(403).send('Verification failed');
    }
  }

  // --- POST (receiving actual webhook events) ---
  if (req.method === 'POST') {
    try {
      const raw = await rawBody(req);
      const signature = req.headers['x-hub-signature-256'];
      const expected = 'sha256=' + crypto.createHmac('sha256', APP_SECRET).update(raw).digest('hex');

      if (!signature || signature !== expected) {
        return res.status(403).send('Invalid signature');
      }

      const body = JSON.parse(raw.toString());
      console.log('📩 Webhook event received:', JSON.stringify(body, null, 2));

      return res.status(200).send('EVENT_RECEIVED');
    } catch (err) {
      console.error('Webhook Error:', err);
      return res.status(500).send('Server Error');
    }
  }

  res.setHeader('Allow', ['GET', 'POST']);
  return res.status(405).send('Method Not Allowed');
}
