# TRG Digital / Social Monitor  .  Setup

A Vite + React app with Netlify serverless functions. It reads LIVE data from
Meta, Yelp and Google, drafts replies with Claude, and keeps post / inbox
history in Netlify Blobs. It has NO database of its own; LOGIN reuses the
existing TRG-OS Supabase project.

## Login and access
- Sign in with a TRG-OS email + password (the same login as trg.center).
- Anyone with a TRG-OS account can VIEW the dashboards, reviews and inbox.
- Only the allowlisted accounts can PUBLISH posts or REPLY to comments / DMs:
  kevin@, cynthia@, ginger@toastrestaurantgroup.com. To change who can publish,
  edit WRITE_ALLOWLIST in BOTH netlify/functions/_authz.mjs and
  src/context/AuthContext.jsx, then redeploy.

## Environment variables
Set these in Netlify (Site settings > Environment variables). See .env.example
for the full list; the ones that matter:
- META_CREDENTIALS_JSON   Facebook / Instagram page tokens + ids (posts, comments, DMs, publishing).
- YELP_API_KEY            Yelp ratings + review counts.
- ANTHROPIC_API_KEY       Claude AI reply drafting (optional; falls back to a local template).
- GOOGLE_SA_JSON          Google service account for GA4 website traffic AND Squarespace form messages.
- SOCIAL_PROXY_TOKEN      Trusted token for scheduled jobs; user calls use a TRG-OS session instead.
- VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY  Optional; unset, login uses the TRG-OS Supabase.

## Deploy
Push to the `main` branch of kevinlara02/trg-social. Netlify builds and deploys.

## Known gaps (as of 2026-07-24)
- Reviews show Yelp stars only (no review text). Google Business Profile reviews
  are pending API approval; OpenTable / TripAdvisor are not built.
- Instagram DM replies are disabled pending Meta App Review (Facebook Messenger works).
- GA4 traffic covers 5 of 7 restaurants; Squarespace form messages cover 1 of 7.
- Alerts are in-app (the Dashboard "Needs attention" panel). There is no email or
  push notification yet.
