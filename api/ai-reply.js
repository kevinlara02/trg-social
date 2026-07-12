// Server-side AI reply drafting with Claude. Runs on Netlify (the API key
// lives here as an env var, never in the browser). The frontend POSTs the
// review/message context and gets back a drafted reply.
//
// Setup to go live:
//   1. Add ANTHROPIC_API_KEY in Netlify > Site settings > Environment variables.
//   2. (Optional) Set AI_MODEL to use a cheaper model, e.g. claude-haiku-4-5.
import Anthropic from '@anthropic-ai/sdk'

const MODEL = process.env.AI_MODEL || 'claude-opus-4-8'

const BRAND_VOICE = `You write public replies on behalf of TRG, a group of seven family-owned restaurants in the Los Angeles area (brunch spots, bars, and eateries).

Voice: warm, genuine, gracious, and concise, like a friendly owner — never corporate or robotic. Keep it to 1 to 3 sentences. No hashtags.

Rules:
- Use the guest's name if one is provided.
- If the guest wrote in Spanish, reply in Spanish. Otherwise reply in English.
- For positive feedback: thank them warmly and invite them back.
- For negative feedback: apologize sincerely, take it seriously, and invite them to reach out so you can make it right. Do not promise refunds, discounts, or anything specific you cannot guarantee.
- Output ONLY the reply text, nothing else.`

export default async function handler(req, res) {
  const _pt = process.env.SOCIAL_PROXY_TOKEN;
  if (_pt && req.headers["x-proxy-token"] !== _pt) return res.status(401).json({ error: "unauthorized" });
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return res.status(503).json({ error: 'AI not configured' })
  }

  try {
    const reqBody = typeof req.body === "string" ? JSON.parse(req.body || "{}") : (req.body || {})
    const { kind = 'message', author, rating, body = '', platform, location } = reqBody

    const context = kind === 'review'
      ? `A ${rating ? rating + '-star ' : ''}${platform || ''} review for ${location || 'our restaurant'} from ${author || 'a guest'}:\n"${body}"`
      : `A ${platform || ''} ${kind} for ${location || 'our restaurant'} from ${author || 'a guest'}:\n"${body}"`

    const client = new Anthropic({ apiKey })
    const response = await client.messages.create({
      model: MODEL,
      max_tokens: 400,
      system: BRAND_VOICE,
      messages: [{ role: 'user', content: `${context}\n\nWrite the reply we should post.` }],
    })

    const text = response.content
      .filter((b) => b.type === 'text')
      .map((b) => b.text)
      .join('')
      .trim()

    return res.status(200).json({ text, source: 'claude', model: MODEL })
  } catch (err) {
    return res.status(500).json({ error: String(err?.message || err) })
  }
}
