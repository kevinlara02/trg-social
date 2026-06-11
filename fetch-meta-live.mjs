// fetch-meta-live.mjs
// Pulls REAL live data (followers + latest Instagram post) for the 7 TRG
// restaurants using the permanent tokens saved in meta-credentials.local.
// Read-only: it does not change anything on Facebook or Instagram.
//
// Run:
//   cd ~/Projects/trg-social
//   ~/.node/node-v20.18.0-darwin-x64/bin/node fetch-meta-live.mjs

import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = dirname(fileURLToPath(import.meta.url));
const GRAPH = 'https://graph.facebook.com/v25.0';

const SLOTS = [
  ['TB', 'The Benediction'],
  ['TW', 'Toast Whittier'],
  ['SW', 'Story Whittier'],
  ['SA', 'Story Anaheim'],
  ['SB', 'Story Brea'],
  ['BM', 'Benny and Marys'],
  ['TD', 'Toast Downey'],
];

let raw;
try {
  raw = readFileSync(resolve(ROOT, 'meta-credentials.local'), 'utf8');
} catch {
  console.error('\n  No encontre meta-credentials.local. Corre primero fetch-meta-tokens.mjs.\n');
  process.exit(1);
}
const cfg = {};
for (const line of raw.split('\n')) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
  if (m) cfg[m[1]] = m[2].trim();
}

async function api(path, params) {
  const url = new URL(`${GRAPH}/${path}`);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  try {
    const res = await fetch(url);
    const json = await res.json();
    if (json.error) return { _error: json.error.message };
    return json;
  } catch (e) {
    return { _error: e.message };
  }
}

const num = (n) => (n == null ? '-' : Number(n).toLocaleString('en-US'));

(async () => {
  console.log('\nBajando datos REALES de Facebook + Instagram...\n');
  const rows = await Promise.all(SLOTS.map(async ([code, name]) => {
    const token = cfg[`META_PAGE_ACCESS_TOKEN_${code}`];
    const pageId = cfg[`META_PAGE_ID_${code}`];
    const igId = cfg[`INSTAGRAM_BUSINESS_ID_${code}`];
    if (!token || !pageId) return { code, name, fbErr: 'sin token' };
    const fb = await api(pageId, { fields: 'name,fan_count,followers_count', access_token: token });
    const ig = igId ? await api(igId, { fields: 'username,followers_count,media_count', access_token: token }) : {};
    const media = igId ? await api(`${igId}/media`, { fields: 'timestamp,like_count,comments_count', limit: '1', access_token: token }) : {};
    const last = media?.data?.[0];
    return {
      code, name,
      fbFollowers: fb.followers_count ?? fb.fan_count,
      igHandle: ig.username,
      igFollowers: ig.followers_count,
      igPosts: ig.media_count,
      lastPost: last?.timestamp ? last.timestamp.slice(0, 10) : null,
      lastLikes: last?.like_count,
      lastComments: last?.comments_count,
      fbErr: fb._error, igErr: ig._error,
    };
  }));

  console.log('=============================== DATOS REALES ===============================');
  console.log('  RESTAURANTE        FB segs.   IG @handle            IG segs.   posts');
  console.log('  -------------------------------------------------------------------------');
  for (const r of rows) {
    const ig = r.igHandle ? `@${r.igHandle}` : (r.igErr ? '(error IG)' : '-');
    console.log(`  ${r.name.padEnd(18)} ${num(r.fbFollowers).padStart(8)}   ${ig.padEnd(20)} ${num(r.igFollowers).padStart(9)}  ${num(r.igPosts).padStart(5)}`);
  }
  console.log('===========================================================================');

  const withPosts = rows.filter((r) => r.lastPost);
  if (withPosts.length) {
    console.log('\n  Ultima publicacion en Instagram (fecha / likes / comentarios):');
    for (const r of withPosts) {
      console.log(`    ${r.name.padEnd(18)} ${r.lastPost}   ${num(r.lastLikes)} likes / ${num(r.lastComments)} coment.`);
    }
  }

  const errs = rows.filter((r) => r.fbErr || r.igErr);
  if (errs.length) {
    console.log('\n  Avisos:');
    for (const r of errs) console.log(`    ${r.name}: ${r.fbErr || ''} ${r.igErr || ''}`.trimEnd());
  }
  console.log('\n  Si estos numeros son los reales de tus cuentas, los conecto a la app.\n');
})();
