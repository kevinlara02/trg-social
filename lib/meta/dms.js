// Reads recent direct-message conversations for each restaurant's Facebook Page
// (and Instagram, best-effort) using the page token (needs pages_messaging).
// Reads META_CREDENTIALS_JSON from the Netlify env, like the other meta-* funcs.
import { messageAttachments } from './attachments.js'

const GRAPH = 'https://graph.facebook.com/v25.0'
let CACHE = { at: 0, data: null }
const TTL_MS = 3 * 60 * 1000

function restaurants() {
  try { return JSON.parse(process.env.META_CREDENTIALS_JSON).restaurants || [] } catch { return [] }
}

// What to write in the preview line when a message has media and no words.
function attachmentLabel(list) {
  const k = list[0]?.kind
  const more = list.length > 1 ? ' +' + (list.length - 1) : ''
  const word = k === 'image' ? 'Photo' : k === 'video' ? 'Video' : k === 'audio' ? 'Voice message'
    : k === 'story' ? 'Story' : k === 'share' ? 'Shared post' : 'File'
  return word + more
}

function shapeConvo(c, r, network) {
  const parts = c.participants?.data || []
  const cust = parts.find((p) => String(p.id) !== String(r.page_id) && String(p.id) !== String(r.ig_id)) || parts[0] || {}
  const msgs = (c.messages?.data || []).map((m) => {
    const fromUs = String(m.from?.id) === String(r.page_id) || String(m.from?.id) === String(r.ig_id)
    const attachments = messageAttachments(m)
    return {
      fromUs,
      author: fromUs ? 'You' : (m.from?.username || m.from?.name || cust.name || cust.username || 'Customer'),
      text: m.message || '',
      time: m.created_time,
      // Always an array, even when empty: the Inbox spreads this straight
      // through, so a missing key and an empty list must not be two cases there.
      attachments,
    }
  }).reverse()
  const last = msgs[msgs.length - 1]
  return {
    id: c.id, network,
    customer: cust.name || cust.username || (network === 'instagram' ? 'Instagram user' : 'Facebook user'),
    customerId: cust.id || null,
    updated: c.updated_time,
    messages: msgs,
    // A photo-only message previewed as an empty string, so a conversation whose
    // newest message was an image looked like it contained nothing.
    lastText: last?.text || (last?.attachments?.length ? attachmentLabel(last.attachments) : ''),
    lastFromUs: last?.fromUs || false,
  }
}

async function conversations(r, network) {
  const platform = network === 'instagram' ? '&platform=instagram' : ''
  const url = `${GRAPH}/${r.page_id}/conversations?fields=participants,updated_time,messages.limit(8){message,from,created_time,attachments,shares,story,is_unsupported}&limit=10${platform}&access_token=${r.page_token}`
  try {
    const d = await (await fetch(url)).json()
    if (d.error) return { list: [], error: d.error.message }
    return { list: (d.data || []).map((c) => shapeConvo(c, r, network)), error: null }
  } catch (e) {
    return { list: [], error: String(e?.message || e) }
  }
}

// Fetch with a hard timeout so one slow Graph call can't stall the function.
async function fetchJson(url, ms = 6000) {
  const ctl = new AbortController()
  const t = setTimeout(() => ctl.abort(), ms)
  try { return await (await fetch(url, { signal: ctl.signal })).json() }
  finally { clearTimeout(t) }
}

// EL ID TIENE QUE SER EL DE LA PAGINA, NO EL DE INSTAGRAM. Medido contra el
// Graph API Explorer el 2026-08-15 con un token de pagina que sí trae
// instagram_manage_messages:
//
//   /{ig_id}/conversations?platform=instagram
//     -> "(#3) Application does not have the capability to make this API call."
//   /{page_id}/conversations?platform=instagram
//     -> "Timeout" (subcode 2534084) o "Please reduce the amount of data"
//
// Son dos APIs distintas que se parecen. Preguntarle al IG id es la ruta de
// "Instagram con Instagram Login", que vive en graph.instagram.com y exige un
// token de Instagram y el permiso instagram_business_manage_messages. Con token
// de PAGINA la unica ruta documentada es la de la Pagina, y el (#3) que la
// pantalla llevaba meses mostrando era eso: la llave correcta en la puerta
// equivocada. El error nuevo ya no es de permiso, es de volumen.
//
// Se conserva la hidratacion en dos pasos (lista ligera y despues cada
// conversacion por separado) porque pedir participantes y mensajes de un jalon
// sí devuelve "Please reduce the amount of data you're asking for".
async function igConversations(r) {
  const owner = r.page_id || r.ig_id
  const listUrl = `${GRAPH}/${owner}/conversations?platform=instagram&fields=id,updated_time&limit=5&access_token=${r.page_token}`
  try {
    const list = await fetchJson(listUrl)
    if (list.error) return { list: [], error: list.error.message }
    const convs = await Promise.all((list.data || []).map(async (c) => {
      try {
        const d = await fetchJson(`${GRAPH}/${c.id}?fields=participants,updated_time,messages.limit(6){message,from,created_time,attachments,shares,story,is_unsupported}&access_token=${r.page_token}`)
        return d.error ? null : shapeConvo(d, r, 'instagram')
      } catch { return null }
    }))
    return { list: convs.filter(Boolean), error: null }
  } catch (e) {
    // "This operation was aborted" es NUESTRO corte de 6 segundos, no una
    // respuesta de Meta, y en pantalla no le dice nada a nadie. Meta tarda mas
    // de eso y despues igual contesta Timeout subcode 2534084 diciendo que la
    // cuenta tiene demasiadas conversaciones, asi que el corte se queda (subirlo
    // se lleva entera la funcion y tumbaria tambien los DM de Facebook, que si
    // funcionan) y lo que cambia es el texto: que diga lo que de verdad pasa.
    const abortada = e?.name === 'AbortError' || /abort/i.test(String(e?.message || e))
    if (abortada) {
      return { list: [], error: 'Instagram tardo mas de 6 segundos en contestar. Meta responde que esta cuenta tiene demasiadas conversaciones para listarlas de un jalon.' }
    }
    return { list: [], error: String(e?.message || e) }
  }
}

export default async function handler(req, res) {
  const _pt = process.env.SOCIAL_PROXY_TOKEN;
  if (_pt && req.headers["x-proxy-token"] !== _pt) return res.status(401).json({ error: "unauthorized" });
  const json = (statusCode, body) => res.status(statusCode).json(body)
  if (!process.env.META_CREDENTIALS_JSON) return json(503, { ok: false, error: 'META_CREDENTIALS_JSON not configured', restaurants: [] })
  if (CACHE.data && Date.now() - CACHE.at < TTL_MS) return json(200, { ok: true, cached: true, ...CACHE.data })

  const rs = restaurants()
  const results = await Promise.all(rs.map(async (r) => {
    const [fb, ig] = await Promise.all([conversations(r, 'facebook'), igConversations(r)])
    const list = [...fb.list, ...ig.list].sort((a, b) => (b.updated || '').localeCompare(a.updated || ''))
    return { code: r.code, v: 4, conversations: list, fbError: fb.error, igError: ig.error }
  }))

  const data = { generated_at: new Date().toISOString(), version: 4, restaurants: results }
  CACHE = { at: Date.now(), data }
  return json(200, { ok: true, ...data })
}
