export default function handler(req, res) {
  const VERIFY_TOKEN = process.env.META_VERIFY_TOKEN || 'test_verify_token';

  if (req.method === 'GET') {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    console.log('🔍 Verification attempt:', { mode, token, challenge });

    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
      console.log('✅ WEBHOOK VERIFIED SUCCESSFULLY');
      return res.status(200).send(challenge);
    } else {
      console.log('❌ WEBHOOK VERIFICATION FAILED');
      return res.status(403).send('Verification failed');
    }
  }

  if (req.method === 'POST') {
    console.log('📩 Received webhook event:', req.body);
    return res.status(200).send('EVENT_RECEIVED');
  }

  return res.status(405).send('Method Not Allowed');
}
