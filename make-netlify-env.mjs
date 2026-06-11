// make-netlify-env.mjs
// Reads meta-credentials.local and writes the single value you paste into
// Netlify as the env var META_CREDENTIALS_JSON (so the live site can read
// real Facebook/Instagram data). Output goes to meta-netlify-env.local.
//
// Run:
//   cd ~/Projects/trg-social
//   ~/.node/node-v20.18.0-darwin-x64/bin/node make-netlify-env.mjs

import { readFileSync, writeFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = dirname(fileURLToPath(import.meta.url))
let raw
try {
  raw = readFileSync(resolve(ROOT, 'meta-credentials.local'), 'utf8')
} catch {
  console.error('\n  No encontre meta-credentials.local. Corre primero fetch-meta-tokens.mjs.\n')
  process.exit(1)
}
const cfg = {}
for (const line of raw.split('\n')) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/)
  if (m) cfg[m[1]] = m[2].trim()
}

const CODES = ['TB', 'TW', 'SW', 'SA', 'SB', 'BM', 'TD']
const restaurants = CODES.map((code) => ({
  code,
  page_id: cfg[`META_PAGE_ID_${code}`] || '',
  page_token: cfg[`META_PAGE_ACCESS_TOKEN_${code}`] || '',
  ig_id: cfg[`INSTAGRAM_BUSINESS_ID_${code}`] || '',
})).filter((r) => r.page_token)

const value = JSON.stringify({ restaurants })
writeFileSync(resolve(ROOT, 'meta-netlify-env.local'), value + '\n', 'utf8')

console.log(`\n  Listo. ${restaurants.length} restaurantes incluidos.`)
console.log('  Valor para Netlify guardado en: meta-netlify-env.local')
console.log('\n  En Netlify > Site settings > Environment variables, agrega UNA variable:')
console.log('    Nombre:  META_CREDENTIALS_JSON')
console.log('    Valor:   (copia TODO el contenido de meta-netlify-env.local)\n')
