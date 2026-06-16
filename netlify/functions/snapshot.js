// Scheduled daily: records one Trends snapshot so growth charts keep filling
// in even when nobody opens the Trends page.
// v2 function (export default + config.schedule): Netlify Blobs auto-configures
// in this format, and the schedule is declared in-code.
import { ensureToday } from '../snapshot-core.js'

export default async () => {
  try {
    const history = await ensureToday()
    return new Response(JSON.stringify({ ok: true, days: history.length }), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    })
  } catch (err) {
    return new Response(JSON.stringify({ ok: false, error: String(err?.message || err) }), {
      status: 500,
      headers: { 'content-type': 'application/json' },
    })
  }
}

export const config = { schedule: '@daily' }
