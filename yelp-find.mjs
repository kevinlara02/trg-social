// yelp-find.mjs - searches Yelp for the 7 TRG restaurants so we can confirm
// the right business IDs before wiring them into the app. Read-only.
//   node yelp-find.mjs

import { readFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = dirname(fileURLToPath(import.meta.url))
const cfg = {}
for (const line of readFileSync(resolve(ROOT, 'yelp-input.local'), 'utf8').split('\n')) {
  const m = line.match(/^([A-Z_]+)=(.*)$/)
  if (m) cfg[m[1]] = m[2].trim()
}
const KEY = cfg.YELP_API_KEY

const RES = [
  { code: 'TB', term: 'The Benediction', loc: 'Whittier, CA' },
  { code: 'TW', term: 'Toast Kitchen and Bar', loc: 'Whittier, CA' },
  { code: 'SW', term: 'Story Kitchen and Bar', loc: 'Whittier, CA' },
  { code: 'SA', term: 'Story', loc: 'Anaheim, CA' },
  { code: 'SB', term: 'Toast Brea', loc: 'Brea, CA' },
  { code: 'BM', term: 'Benny and Marys', loc: 'Los Angeles, CA' },
  { code: 'TD', term: 'Toast Kitchen and Bar', loc: 'Downey, CA' },
]

async function search(term, loc) {
  const url = new URL('https://api.yelp.com/v3/businesses/search')
  url.searchParams.set('term', term)
  url.searchParams.set('location', loc)
  url.searchParams.set('limit', '5')
  const res = await fetch(url, { headers: { Authorization: `Bearer ${KEY}` } })
  return res.json()
}

for (const r of RES) {
  const d = await search(r.term, r.loc)
  console.log(`\n=== ${r.code}  (buscando "${r.term}" en ${r.loc}) ===`)
  if (d.error) { console.log('  ERROR:', d.error.code, '-', d.error.description); continue }
  for (const b of (d.businesses || []).slice(0, 4)) {
    const addr = (b.location?.display_address || []).join(', ')
    console.log(`  ${b.name}  |  ${b.rating}★ (${b.review_count})  |  ${addr}\n      id=${b.id}`)
  }
}
