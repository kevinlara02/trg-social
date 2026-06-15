// yelp-verify.mjs - confirms the 7 final Yelp businesses and pulls a few real
// reviews each, so we can verify before wiring them in. Read-only.
//   node yelp-verify.mjs

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
const h = { headers: { Authorization: `Bearer ${KEY}` } }

const BIZ = [
  ['TB', 'The Benediction', '9PuUxaDOIoU6jefU36GJtQ'],
  ['TW', 'Toast Whittier', 'toast-on-first-whittier'],
  ['SW', 'Story Whittier', 'story-whittier-5'],
  ['SA', 'Story Anaheim', 'h9cHPvG-SUvfWIU4BmmKLQ'],
  ['SB', 'Story Brea', '17Jqi0azp05pI2fVfsPbAg'],
  ['BM', 'Benny and Marys', 'ty0Co6l06CtKx2qEFoUGcg'],
  ['TD', 'Toast Downey', 'VUhI0E-EpKQe7MNgsWeqnA'],
]

for (const [code, label, id] of BIZ) {
  const b = await (await fetch(`https://api.yelp.com/v3/businesses/${id}`, h)).json()
  if (b.error) { console.log(`\n${code} ${label}: ERROR ${b.error.code} - ${b.error.description}`); continue }
  const rv = await (await fetch(`https://api.yelp.com/v3/businesses/${id}/reviews?limit=3&sort_by=newest`, h)).json()
  console.log(`\n=== ${code} ${label} -> "${b.name}"  ${b.rating}star (${b.review_count})  id=${b.id} ===`)
  for (const r of (rv.reviews || [])) {
    console.log(`  ${r.rating}star  ${r.user?.name}  (${(r.time_created || '').slice(0, 10)})`)
    console.log(`     "${(r.text || '').slice(0, 130)}"`)
  }
}
