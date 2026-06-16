// GET: returns the daily Trends history (and lazily records today's snapshot
// the first time it's read each day, so the chart fills in even between the
// scheduled runs).
import { ensureToday } from '../snapshot-core.js'

export const handler = async () => {
  try {
    const history = await ensureToday()
    return {
      statusCode: 200,
      headers: { 'content-type': 'application/json', 'access-control-allow-origin': '*' },
      body: JSON.stringify({ ok: true, history }),
    }
  } catch (err) {
    return {
      statusCode: 200,
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ ok: false, error: String(err?.message || err), history: [] }),
    }
  }
}
