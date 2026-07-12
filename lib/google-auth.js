// Mints a Google OAuth access token from a service-account key, used by the GA4
// traffic + Sheets messages functions. Pure Node crypto (no extra deps).
// Vercel port: reads the service account from the GOOGLE_SA_JSON env var
// (Vercel allows large env values, so no Blob fallback is needed). If it's not
// set, getAccessToken throws and callers degrade to an empty result.
import crypto from "crypto";

let TOKEN = { at: 0, value: null, scope: null };

function b64url(input) {
  return Buffer.from(input).toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function serviceAccountRaw() {
  if (process.env.GOOGLE_SA_JSON) return process.env.GOOGLE_SA_JSON;
  throw new Error("Google service account not configured");
}

export async function getAccessToken(scope) {
  if (TOKEN.value && TOKEN.scope === scope && Date.now() - TOKEN.at < 50 * 60 * 1000) return TOKEN.value;

  const sa = JSON.parse(serviceAccountRaw());
  const now = Math.floor(Date.now() / 1000);
  const header = b64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const claim = b64url(JSON.stringify({
    iss: sa.client_email,
    scope,
    aud: "https://oauth2.googleapis.com/token",
    iat: now,
    exp: now + 3600,
  }));
  const signer = crypto.createSign("RSA-SHA256");
  signer.update(`${header}.${claim}`);
  const signature = b64url(signer.sign(sa.private_key));
  const jwt = `${header}.${claim}.${signature}`;

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion: jwt }),
  });
  const data = await res.json();
  if (!data.access_token) throw new Error("token exchange failed: " + JSON.stringify(data).slice(0, 200));

  TOKEN = { at: Date.now(), value: data.access_token, scope };
  return data.access_token;
}
