// api/webhook.js
import crypto from 'crypto';
export const config = { api: { bodyParser: false } };

async function getRawBody(req){
  const chunks = [];
  for await (const c of req) chunks.push(c);
  return Buffer.concat(chunks);
}

export default async function handler(req, res){
  const VERIFY_TOKEN = process.env.META_VERIFY_TOKEN || 'test_verify_token';
  const APP_SECRET   = process.env.META_APP_SECRET  || 'test_app_secret';

  if (req.method === 'GET') {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];
    console.log('verify attempt', { mode, token, challenge: !!challenge });
    if (mode === 'subscribe' && token === VERIFY_TOKEN) return res.status(200).send(challenge);
    return res.status(403).send('Verification failed');
  }

  if (req.method === 'POST') {
    try {
      const raw = await getRawBody(req);
      const signature = req.headers['x-hub-signature-256'];
      const expected = 'sha256=' + crypto.createHmac('sha256', APP_SECRET).update(raw).digest('hex');
      if (!signature || signature !== expected) return res.status(403).send('Invalid signature');
      const payload = JSON.parse(raw.toString('utf8'));
      console.log('📩 webhook payload', JSON.stringify(payload, null, 2));
      return res.status(200).send('EVENT_RECEIVED');
    } catch (e) {
      console.error('Webhook error', e);
      return res.status(500).send('Server error');
    }
  }

  res.setHeader('Allow', ['GET','POST']);
  res.status(405).send('Method Not Allowed');
}
