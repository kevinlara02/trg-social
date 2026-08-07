// Returns recent comments on Instagram + Facebook posts for the 7 TRG
// restaurants, so they can be read (and replied to) from the Inbox.
// Needs the token to have: instagram_manage_comments (IG) and
// pages_read_user_content (FB). Reads creds from META_CREDENTIALS_JSON.

import { fromStoryAttachment } from './attachments.js'

const GRAPH = 'https://graph.facebook.com/v25.0'

let CACHE = { at: 0, data: null }
const TTL_MS = 5 * 60 * 1000 // 5 minutes (comments change often)

async function api(path, params) {
  const url = new URL(`${GRAPH}/${path}`)
  for (const [key, val] of Object.entries(params)) url.searchParams.set(key, val)
  try {
    const res = await fetch(url)
    const data = await res.json()
    if (data.error) return { _error: data.error.message }
    return data
  } catch (err) {
    return { _error: String(err?.message || err) }
  }
}

// StoryAttachment's own fields ARE documented, so once `attachment` resolves at
// all, everything inside it is safe to ask for.
const FB_COMMENT_RICH = 'id,message,from{name},created_time,attachment{type,url,title,description,media{image{src},source},target{url}}'
const FB_COMMENT_SAFE = 'id,message,from{name},created_time'

async function fbPostsFor(r) {
  // full_picture is the post's own image, which is what tells somebody WHICH photo
  // a comment is about. attachments{...} with subattachments covers albums, where
  // full_picture is only the first frame.
  const post = (commentFields) => `id,message,permalink_url,full_picture,attachments{media{image{src}},subattachments{media{image{src}}}},comments.limit(15){${commentFields}}`
  const rich = await api(`${r.page_id}/posts`, { fields: post(FB_COMMENT_RICH), limit: '6', access_token: r.page_token })
  if (!rich._error) return { data: rich, commentMedia: true }
  // Second attempt without the unverified field. Reported so the payload says
  // whether comment media was actually available, instead of leaving an empty
  // result looking like nobody attached anything.
  const safe = await api(`${r.page_id}/posts`, { fields: post(FB_COMMENT_SAFE), limit: '6', access_token: r.page_token })
  return { data: safe, commentMedia: false, attachmentError: rich._error }
}

async function fetchRestaurant(r) {
  if (!r.page_token) return { code: r.code, comments: [] }
  const [igMedia, fb] = await Promise.all([
    // media_url can legitimately be absent on some post types, and the docs say so,
    // so thumbnail_url is asked for as the fallback rather than treated as an error.
    r.ig_id ? api(`${r.ig_id}/media`, { fields: 'id,caption,permalink,media_type,media_url,thumbnail_url,comments.limit(15){id,text,username,timestamp}', limit: '6', access_token: r.page_token }) : Promise.resolve({}),
    r.page_id ? fbPostsFor(r) : Promise.resolve({ data: {}, commentMedia: false }),
  ])
  const fbPosts = fb.data || {}

  const comments = []
  for (const m of (igMedia.data || [])) {
    for (const c of (m.comments?.data || [])) {
      comments.push({
        id: c.id, network: 'instagram',
        author: c.username || 'Instagram user',
        text: c.text || '', date: c.timestamp || null,
        post_caption: m.caption || '', post_permalink: m.permalink || null,
        // Instagram comments cannot carry media through the API: that is a flat
        // no in Meta's reference, not a gap in this code. What IS available is the
        // post's own picture, and on a picture-first account that is the thing
        // that makes a comment make sense at all.
        post_media: m.media_url || m.thumbnail_url || null,
        attachments: [],
      })
    }
  }
  for (const p of (fbPosts.data || [])) {
    for (const c of (p.comments?.data || [])) {
      comments.push({
        id: c.id, network: 'facebook',
        author: c.from?.name || 'Facebook user',
        text: c.message || '', date: c.created_time || null,
        post_caption: p.message || '', post_permalink: p.permalink_url || null,
        post_media: p.full_picture
          || p.attachments?.data?.[0]?.media?.image?.src
          || p.attachments?.data?.[0]?.subattachments?.data?.[0]?.media?.image?.src
          || null,
        // Only present when the first attempt above resolved. fromStoryAttachment
        // returns null for a shape it does not recognise, so a surprise payload
        // drops the media rather than the comment.
        attachments: [fromStoryAttachment(c.attachment)].filter(Boolean),
      })
    }
  }
  // Said out loud in the payload: whether comment media was actually reachable.
  // Otherwise zero attachments everywhere looks like zero attachments sent.
  return { code: r.code, comments, comment_media: !!fb.commentMedia, comment_media_error: fb.attachmentError || null }
}

export default async function handler(req, res) {
  const _pt = process.env.SOCIAL_PROXY_TOKEN;
  if (_pt && req.headers["x-proxy-token"] !== _pt) return res.status(401).json({ error: "unauthorized" });
  const json = (statusCode, body) => {
    res.setHeader('cache-control', 'public, max-age=120')
    return res.status(statusCode).json(body)
  }
  const raw = process.env.META_CREDENTIALS_JSON
  if (!raw) return json(503, { ok: false, error: 'META_CREDENTIALS_JSON not configured' })
  let creds
  try {
    creds = JSON.parse(raw)
  } catch {
    return json(500, { ok: false, error: 'META_CREDENTIALS_JSON is not valid JSON' })
  }
  const list = Array.isArray(creds) ? creds : creds.restaurants
  if (!Array.isArray(list)) return json(500, { ok: false, error: 'no restaurants in META_CREDENTIALS_JSON' })

  if (CACHE.data && Date.now() - CACHE.at < TTL_MS) {
    return json(200, { ok: true, cached: true, ...CACHE.data })
  }

  const restaurants = await Promise.all(list.map(fetchRestaurant))
  const data = { generated_at: new Date().toISOString(), restaurants }
  CACHE = { at: Date.now(), data }
  return json(200, { ok: true, cached: false, ...data })
}
