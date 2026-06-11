// fetch-meta-tokens.mjs
// Turns a short-lived Meta USER token into PERMANENT page access tokens for the
// 7 TRG restaurant Facebook pages, and grabs their connected Instagram Business
// Account IDs. Writes everything to meta-credentials.local (gitignored).
//
// Run:
//   cd ~/Projects/trg-social
//   ~/.node/node-v20.18.0-darwin-x64/bin/node fetch-meta-tokens.mjs
//
// Reads your 3 secrets from meta-input.local (gitignored).

import { readFileSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = dirname(fileURLToPath(import.meta.url));
const GRAPH = 'https://graph.facebook.com/v25.0';

// ---- read the 3 input values ----
const inputPath = resolve(ROOT, 'meta-input.local');
let raw;
try {
  raw = readFileSync(inputPath, 'utf8');
} catch {
  console.error(`\n  No encontre meta-input.local en ${ROOT}`);
  console.error('   Crea el archivo con APP_ID, APP_SECRET y USER_TOKEN.\n');
  process.exit(1);
}
const cfg = {};
for (const line of raw.split('\n')) {
  const m = line.match(/^\s*([A-Z_]+)\s*=\s*(.+?)\s*$/);
  if (m) cfg[m[1]] = m[2].trim();
}
const { APP_ID, APP_SECRET, USER_TOKEN } = cfg;
if (!APP_ID || !APP_SECRET || !USER_TOKEN || /PEGA_AQUI/i.test(`${APP_ID}${APP_SECRET}${USER_TOKEN}`)) {
  console.error('\n  Faltan valores reales en meta-input.local (APP_ID, APP_SECRET, USER_TOKEN).\n');
  process.exit(1);
}

// ---- map a Facebook page name to its restaurant slot ----
function slotFor(name) {
  const n = (name || '').toLowerCase();
  if (n.includes('benediction')) return 'TB';
  if (n.includes('downey')) return 'TD';
  if (n.includes('brea')) return 'SB';
  if (n.includes('benny')) return 'BM';
  if (n.includes('anaheim')) return 'SA';
  if (n.includes('story') && n.includes('whittier')) return 'SW';
  if (n.includes('whittier')) return 'TW'; // ToastWhittier (after Downey/Brea/Story checks)
  return null;
}
const SLOT_NAMES = {
  TB: 'The Benediction', TW: 'Toast Whittier', SW: 'Story Whittier',
  SA: 'Story Anaheim', SB: 'Story Brea', BM: 'Benny and Marys', TD: 'Toast Downey',
};
const ORDER = ['TB', 'TW', 'SW', 'SA', 'SB', 'BM', 'TD'];

async function api(path, params) {
  const url = new URL(`${GRAPH}/${path}`);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  const res = await fetch(url);
  const json = await res.json();
  if (json.error) throw new Error(`${json.error.message} (code ${json.error.code})`);
  return json;
}

(async () => {
  console.log('\n1/3  Convirtiendo el token de usuario a PERMANENTE...');
  const longLived = await api('oauth/access_token', {
    grant_type: 'fb_exchange_token',
    client_id: APP_ID,
    client_secret: APP_SECRET,
    fb_exchange_token: USER_TOKEN,
  });
  const userToken = longLived.access_token;
  console.log('   OK - token de largo plazo obtenido.');

  console.log('\n2/3  Bajando las paginas con sus tokens permanentes...');
  const accounts = await api('me/accounts', {
    fields: 'name,access_token,instagram_business_account{id,username}',
    access_token: userToken,
    limit: '100',
  });
  const pages = accounts.data || [];
  console.log(`   OK - ${pages.length} paginas recibidas.`);

  console.log('\n3/3  Organizando los 7 restaurantes...');
  const bySlot = {};
  const ignored = [];
  for (const p of pages) {
    const slot = slotFor(p.name);
    if (slot && !bySlot[slot]) bySlot[slot] = p;
    else ignored.push(p.name);
  }

  // ---- build the credentials file ----
  const lines = [
    '# === META (Facebook + Instagram) - generado por fetch-meta-tokens.mjs ===',
    '# Tokens de pagina PERMANENTES (no expiran). Copia estas lineas a Netlify env vars.',
    `VITE_META_APP_ID=${APP_ID}`,
    `VITE_META_APP_SECRET=${APP_SECRET}`,
  ];
  const igIds = [];
  for (const slot of ORDER) {
    const p = bySlot[slot];
    if (!p) { lines.push(`# FALTA ${slot} (${SLOT_NAMES[slot]}) - no aparecio`); continue; }
    lines.push(`META_PAGE_ID_${slot}=${p.id || ''}`);
    lines.push(`META_PAGE_ACCESS_TOKEN_${slot}=${p.access_token || ''}`);
    const ig = p.instagram_business_account?.id;
    if (ig) { lines.push(`INSTAGRAM_BUSINESS_ID_${slot}=${ig}`); igIds.push(ig); }
  }
  if (igIds.length) lines.push(`VITE_INSTAGRAM_BUSINESS_ACCOUNT_IDS=${igIds.join(',')}`);
  const outPath = resolve(ROOT, 'meta-credentials.local');
  writeFileSync(outPath, `${lines.join('\n')}\n`, 'utf8');

  // ---- masked summary (no tokens printed) ----
  let tokenCount = 0, igCount = 0;
  console.log('\n========================= RESUMEN =========================');
  for (const slot of ORDER) {
    const p = bySlot[slot];
    if (!p) { console.log(`  ${slot}  ${SLOT_NAMES[slot].padEnd(16)}  NO ENCONTRADA`); continue; }
    tokenCount++;
    const hasIg = !!p.instagram_business_account?.id;
    if (hasIg) igCount++;
    const ig = hasIg ? `IG OK (${p.instagram_business_account.id})` : 'IG falta (necesita instagram_basic)';
    console.log(`  ${slot}  ${SLOT_NAMES[slot].padEnd(16)}  token OK  ${ig}`);
  }
  if (ignored.length) console.log(`\n  Ignoradas (no TRG): ${ignored.join(', ')}`);
  console.log('===========================================================');
  console.log(`\n  Tokens permanentes: ${tokenCount}/7    Instagram: ${igCount}/7`);
  console.log(`  Guardado en: ${outPath}  (no se sube a git)\n`);
  console.log(`  Dime cuantos tokens y cuantos IG salieron y seguimos.\n`);
})().catch((e) => {
  console.error(`\n  ERROR: ${e.message}`);
  console.error('  (Si dice que el token expiro, genera uno nuevo en el Graph Explorer y vuelve a pegarlo.)\n');
  process.exit(1);
});
