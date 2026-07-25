// GET: returns the daily Trends history (and lazily records today's snapshot
// the first time it's read each day, so the chart fills in even between the
// scheduled runs).
// v2 function (export default): Netlify Blobs auto-configures in this format.
import { ensureToday } from '../snapshot-core.js'
import { authorize } from './_authz.mjs'

export default async (req) => {
  const authz = await authorize((n) => req.headers.get(n));
  if (!authz.ok) {
    return new Response(JSON.stringify({ error: "unauthorized" }), { status: 401, headers: { "content-type": "application/json" } });
  }
  try {
    const history = await ensureToday()
    return new Response(JSON.stringify({ ok: true, history }), {
      status: 200,
      headers: { 'content-type': 'application/json', 'access-control-allow-origin': '*' },
    })
  } catch (err) {
    return new Response(JSON.stringify({ ok: false, error: String(err?.message || err), history: [] }), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    })
  }
}
