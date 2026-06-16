// Scheduled daily (see netlify.toml): records one Trends snapshot so growth
// charts keep filling in even when nobody opens the Trends page.
import { ensureToday } from '../snapshot-core.js'

export const handler = async () => {
  try {
    const history = await ensureToday()
    return { statusCode: 200, body: JSON.stringify({ ok: true, days: history.length }) }
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ ok: false, error: String(err?.message || err) }) }
  }
}
