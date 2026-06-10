// Reply suggestions. In production these call the Claude serverless function
// (netlify/functions/ai-reply.js); offline / in the demo they fall back to a
// smart, bilingual local draft so the feature still works.

const AI_ENDPOINT = '/.netlify/functions/ai-reply'

function isSpanish(text = '') {
  const t = text.toLowerCase()
  if (/[áéíóúñ¿¡]/.test(t)) return true
  return /\b(el|la|los|las|una|unos|que|de|gracias|comida|servicio|muy|buena|bueno|mala|malo|rico|rica|excelente|pésimo|encantó|increíble|mejor|amable|esper|reserva|pedido|horario)\b/.test(t)
}

// --- Local fallback drafts (also used as the instant default) ---
export function suggestReviewReply(review) {
  const name = review.author_name ? `, ${review.author_name}` : ''
  const r = Number(review.rating) || 0
  if (isSpanish(review.body)) {
    if (r >= 4) return `¡Muchísimas gracias${name}! Nos alegra muchísimo que la hayas pasado bien y te esperamos pronto de nuevo. 🙌`
    if (r === 3) return `Gracias por tus comentarios${name}. Nos encantó tenerte y nos encantaría que tu próxima visita sea aún mejor.`
    return `Lamentamos mucho que tu experiencia no fuera la mejor${name}. Esto no refleja nuestro estándar. Escríbenos para poder compensarte.`
  }
  if (r >= 4) return `Thank you so much${name}! We're thrilled you enjoyed your visit and can't wait to welcome you back soon. 🙌`
  if (r === 3) return `Thanks for the honest feedback${name}. We're glad you stopped by, and we'd love to make your next visit even better.`
  return `We're so sorry your experience fell short${name}. That's not the standard we hold ourselves to. Please reach out so we can make it right.`
}

export function suggestMessageReply(message) {
  const whoRaw = message.author_name || message.author_handle || ''
  const who = whoRaw ? ` ${whoRaw}` : ''
  const t = (message.body || '').toLowerCase()
  const has = (re) => re.test(t)
  if (isSpanish(message.body)) {
    if (has(/(reserv|mesa|evento|fiesta|patio|cater|banquet)/)) return `¡Hola${who}! Con gusto te atendemos. Respóndenos con la fecha, la hora y el número de personas y lo dejamos listo. 🎉`
    if (has(/(vegan|vegetarian|gluten|alergi|sin gluten)/)) return `¡Buena pregunta${who}! Sí tenemos opciones. Nuestro equipo con gusto te las muestra cuando nos visites. 🌱`
    if (has(/(hora|horario|abierto|abren|cierran)/)) return `¡Gracias por escribir${who}! Dinos cuál local te interesa y te compartimos el horario exacto. 🙌`
    return `¡Gracias por tu mensaje${who}! Lo agradecemos mucho y alguien de nuestro equipo te responderá enseguida. 😊`
  }
  if (has(/(reserv|book|table|party|patio|event|cater)/)) return `Hi${who}! We'd love to host you. Reply with your date, time, and party size and we'll get you booked right away. 🎉`
  if (has(/(vegan|gluten|allerg|vegetarian|dairy)/)) return `Great question${who}! Yes, we have options for that. Our team will gladly walk you through the menu when you visit. 🌱`
  if (has(/(hour|open|close|time)/)) return `Thanks for reaching out${who}! Let us know which location and we'll share the exact hours. Happy to help. 🙌`
  return `Thank you for your message${who}! We appreciate you reaching out, and someone from our team will get right back to you. 😊`
}

// --- Async: try the real Claude backend, fall back to the local draft ---
export async function aiSuggest({ kind, item, location }) {
  const fallback = kind === 'review' ? suggestReviewReply(item) : suggestMessageReply(item)
  try {
    const payload = {
      kind,
      author: item.author_name || item.author_handle || null,
      rating: item.rating ?? null,
      body: item.body || '',
      platform: item.platform || null,
      location: location || null,
    }
    const res = await fetch(AI_ENDPOINT, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload),
    })
    if (!res.ok) throw new Error('ai unavailable')
    const data = await res.json()
    if (data && data.text) return { text: data.text, source: 'claude' }
    throw new Error('no text')
  } catch {
    // Offline / demo: brief pause so the "Generating…" state is visible.
    await new Promise((r) => setTimeout(r, 500))
    return { text: fallback, source: 'local' }
  }
}
