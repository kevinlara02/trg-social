// Temporary diagnostic: reports the prefix/length of this project's
// SOCIAL_PROXY_TOKEN and which secrets are present, so we can confirm the token
// matches the OS caller without exposing the secret. Remove after debugging.
export default async function handler(req, res) {
  const t = process.env.SOCIAL_PROXY_TOKEN || "";
  return res.status(200).json({
    tokenPrefix: t.slice(0, 6),
    tokenLen: t.length,
    hasMetaCreds: !!process.env.META_CREDENTIALS_JSON,
    hasYelp: !!process.env.YELP_API_KEY,
    hasBlob: !!process.env.BLOB_READ_WRITE_TOKEN,
  });
}
