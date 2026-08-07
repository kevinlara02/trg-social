// Turns whatever Meta hands back into ONE shape the Inbox can draw.
//
//   { kind, url, preview, name, mime }
//   kind: image | video | audio | file | share | story
//
// WHY THIS IS DEFENSIVE RATHER THAN PRECISE. Meta's own guides contain zero
// attachment examples, so there is no official JSON sample to copy, and the parts
// that matter most for rendering (image_data, video_data) are documented as prose
// key lists rather than as selectable sub-fields. So every reader below tries
// several documented key names and gives up quietly instead of throwing.
//
// THE RULE THAT SHAPED THE FIELD EXPRESSIONS: an invalid field name does not get
// ignored, it hard-errors the WHOLE request. So we ask only for top-level fields
// Meta documents on the node, never a sub-selection like image_data{url}, and any
// query that reaches for something unverified has a fallback (see comments.js).

const str = (v) => (typeof v === "string" && v.trim() ? v.trim() : null);

// mime_type is the only documented signal on the attachments edge, so it decides
// the kind whenever it is present.
function kindFromMime(mime, name) {
  const m = String(mime || "").toLowerCase();
  if (m.startsWith("image/")) return "image";
  if (m.startsWith("video/")) return "video";
  if (m.startsWith("audio/")) return "audio";
  if (m) return "file";
  // No mime: fall back to the filename, which is all a file attachment carries.
  const n = String(name || "").toLowerCase();
  if (/\.(jpe?g|png|gif|webp|heic|avif)$/.test(n)) return "image";
  if (/\.(mp4|mov|m4v|webm|avi)$/.test(n)) return "video";
  if (/\.(mp3|m4a|aac|wav|ogg|oga)$/.test(n)) return "audio";
  return "file";
}

// One entry off message.attachments.data. Documented sub-fields on that edge are
// only id, mime_type, name, size and file_url; image_data and video_data are
// documented on the Message node in prose, so both are read leniently.
export function fromMessageAttachment(a) {
  if (!a || typeof a !== "object") return null;
  const img = a.image_data || null;
  const vid = a.video_data || null;

  // A Messenger sticker or GIF announces itself here, and it is worth keeping
  // distinct from a photo so the Inbox can size it small.
  const isSticker = !!vid?.render_as_sticker;
  const gif = str(vid?.animated_gif_url);
  const gifStill = str(vid?.animated_gif_preview_url);

  const url = str(a.file_url) || gif || str(vid?.url) || str(img?.url) || str(img?.media_url) || null;
  const preview = gifStill || str(vid?.preview_url) || str(img?.preview_url) || str(img?.url) || str(img?.media_url) || null;

  let kind = kindFromMime(a.mime_type, a.name);
  if (img && kind === "file") kind = "image";
  if ((vid || gif) && kind === "file") kind = "video";
  // A sticker or GIF plays badly in a <video> and reads better as a small image.
  if (isSticker || gif) kind = "image";

  if (!url && !preview && !str(a.name)) return null;
  return {
    kind,
    url,
    preview: preview || (kind === "image" ? url : null),
    name: str(a.name),
    mime: str(a.mime_type),
    sticker: isSticker || !!gif || undefined,
  };
}

// One entry off message.shares.data. Documented fields: id, link, name,
// description, template. A forwarded post, reel or product card.
export function fromMessageShare(sh) {
  if (!sh || typeof sh !== "object") return null;
  const link = str(sh.link);
  // A product share nests its image under template.payload.product.elements[].
  const el = sh.template?.payload?.product?.elements?.[0] || null;
  const preview = str(el?.image_url) || str(sh.image_url) || null;
  if (!link && !preview && !str(sh.name)) return null;
  return {
    kind: preview ? "image" : "share",
    url: link,
    preview,
    name: str(sh.name) || str(el?.title) || str(sh.description) || "Shared post",
    mime: null,
  };
}

// message.story: an Instagram story reply or mention. The verified note is that
// its shape is NOT a flat { link, id }, so this walks a couple of documented
// nestings rather than assuming one.
export function fromMessageStory(story) {
  if (!story || typeof story !== "object") return null;
  const link = str(story.link) || str(story.mention?.link) || str(story.reply_to?.link) || null;
  const id = str(story.id) || str(story.mention?.id) || str(story.reply_to?.id) || null;
  if (!link && !id) return null;
  return {
    kind: "story",
    url: link,
    preview: null,
    // Said plainly because a story link dies with the story, after 24 hours: the
    // one lifetime Meta documents explicitly.
    name: link ? "Instagram story (expires in 24h)" : "Instagram story",
    mime: null,
  };
}

// Everything a single message carries, in the order a person would expect to see
// it. Never throws: a message that yields nothing simply has no attachments.
export function messageAttachments(m) {
  const out = [];
  try {
    for (const a of m?.attachments?.data || []) { const x = fromMessageAttachment(a); if (x) out.push(x); }
    for (const s of m?.shares?.data || []) { const x = fromMessageShare(s); if (x) out.push(x); }
    const st = fromMessageStory(m?.story);
    if (st) out.push(st);
    // is_unsupported is only returned when true. Without this the bubble would be
    // blank with no explanation, which is the exact symptom this work started from.
    if (m?.is_unsupported && !out.length) {
      out.push({ kind: "file", url: null, preview: null, name: "Content Messenger will not share", mime: null });
    }
  } catch { /* a malformed payload must not take the whole conversation down */ }
  return out;
}

// A Facebook comment's media, via StoryAttachment, whose fields ARE documented
// even though `attachment` is not documented on the Comment node itself. Only
// reached when the probing query below succeeded, so this never runs on a shape
// that does not exist.
export function fromStoryAttachment(att) {
  if (!att || typeof att !== "object") return null;
  const src = str(att.media?.image?.src) || str(att.media?.source) || null;
  const link = str(att.url) || str(att.target?.url) || null;
  const type = String(att.type || "").toLowerCase();
  if (!src && !link) return null;
  const kind = type.includes("video") ? "video" : src ? "image" : "share";
  return {
    kind,
    // media.source is the playable file for a video; image.src is a still.
    url: str(att.media?.source) || link,
    preview: src,
    name: str(att.title) || str(att.description) || null,
    mime: null,
  };
}
