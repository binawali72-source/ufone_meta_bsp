import crypto from "crypto";

export const config = {
  api: {
    bodyParser: false, // Important for signature validation
  },
};

// Helper to read raw body
async function getRawBody(req) {
  const chunks = [];
  for await (const chunk of req) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}

export default async function handler(req, res) {
  const VERIFY_TOKEN = process.env.META_VERIFY_TOKEN || "test_verify_token";
  const APP_SECRET = process.env.META_APP_SECRET || "test_app_secret";

  // --- STEP 1: Verification (GET) ---
  if (req.method === "GET") {
    const mode = req.query["hub.mode"];
    const token = req.query["hub.verify_token"];
    const challenge = req.query["hub.challenge"];

    if (mode && token === VERIFY_TOKEN) {
      console.log("✅ Webhook verified successfully!");
      return res.status(200).send(challenge);
    } else {
      console.warn("❌ Verification failed. Check VERIFY_TOKEN.");
      return res.status(403).send("Verification failed");
    }
  }

  // --- STEP 2: Handle Events (POST) ---
  if (req.method === "POST") {
    try {
      const rawBody = await getRawBody(req);
      const signature = req.headers["x-hub-signature-256"];
      const expectedSignature =
        "sha256=" +
        crypto.createHmac("sha256", APP_SECRET).update(rawBody).digest("hex");

      // Signature verification
      if (signature !== expectedSignature) {
        console.error("❌ Invalid signature");
        return res.status(403).send("Invalid signature");
      }

      const body = JSON.parse(rawBody.toString());
      console.log("📩 Webhook Event Received:\n", JSON.stringify(body, null, 2));

      // Respond 200 OK to Meta
      return res.status(200).send("EVENT_RECEIVED");
    } catch (err) {
      console.error("🚨 Webhook Processing Error:", err);
      return res.status(500).send("Internal Server Error");
    }
  }

  // --- Unsupported Methods ---
  res.setHeader("Allow", ["GET", "POST"]);
  res.status(405).end(`Method ${req.method} Not Allowed`);
}
