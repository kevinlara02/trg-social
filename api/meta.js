// Single Serverless Function that dispatches all Meta (Instagram/Facebook)
// endpoints, to stay under the Hobby plan's 12-function limit. Each original
// handler lives in lib/meta/ and is routed here by ?fn=... (vercel.json rewrites
// map /api/meta-posts -> /api/meta?fn=posts, etc., so callers are unchanged).
import posts from "../lib/meta/posts.js";
import comments from "../lib/meta/comments.js";
import dms from "../lib/meta/dms.js";
import live from "../lib/meta/live.js";
import publish from "../lib/meta/publish.js";
import commentReply from "../lib/meta/comment-reply.js";
import dmReply from "../lib/meta/dm-reply.js";

const MAP = {
  posts,
  comments,
  dms,
  live,
  publish,
  "comment-reply": commentReply,
  "dm-reply": dmReply,
};

export default async function handler(req, res) {
  const fn = req.query.fn;
  const h = MAP[fn];
  if (!h) return res.status(404).json({ ok: false, error: `unknown meta function: ${fn}` });
  return h(req, res);
}
