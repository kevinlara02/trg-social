// Shared inbox state: which comments and DMs have been handled, plus the reply
// text and who did it, so the WHOLE team sees the same thing and it survives a
// reload. Stored in the Netlify Blob store (the same place posts and media
// already live), NOT in any database. GET is any signed-in TRG-OS user; POST
// (mark handled) needs the write allowlist, exactly like sending a reply.
import { getStore } from '@netlify/blobs'
import { authorize, canWrite } from './_authz.mjs'

const KEY = 'state'

export default async (req) => {
  const authz = await authorize((n) => req.headers.get(n))
  if (!authz.ok) {
    return json(401, { error: 'unauthorized' })
  }
  if (req.method === 'POST' && !authz.viaToken && !canWrite(authz.email)) {
    return json(403, { error: 'forbidden' })
  }
  const store = getStore('inbox')
  try {
    if (req.method === 'GET') {
      const state = (await store.get(KEY, { type: 'json' })) || {}
      return json(200, { ok: true, state })
    }
    if (req.method === 'POST') {
      const body = await req.json().catch(() => ({}))
      const id = String(body.id || '').trim()
      if (!id) return json(400, { error: 'missing id' })
      const state = (await store.get(KEY, { type: 'json' })) || {}
      state[id] = {
        replied: body.replied !== false,
        text: body.text || null,
        kind: body.kind || null,
        by: authz.email || 'unknown',
        at: new Date().toISOString(),
      }
      await store.setJSON(KEY, state)
      return json(200, { ok: true, state })
    }
    return json(405, { error: 'method not allowed' })
  } catch (e) {
    return json(500, { error: String(e?.message || e) })
  }
}

function json(status, obj) {
  return new Response(JSON.stringify(obj), { status, headers: { 'content-type': 'application/json' } })
}
