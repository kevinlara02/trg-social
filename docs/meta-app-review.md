# Meta App Review package — Instagram DMs

App: **TRG** (App ID 968067005994062)
Goal: get **Advanced Access** for **`instagram_manage_messages`** (Instagram messaging
capability) so the app can read and reply to Instagram Direct messages for TRG's
own restaurant Instagram accounts. Facebook DMs (`pages_messaging`) already work.

## Prerequisites (do these in Meta first)
1. **Business Verification** of Toast Restaurant Group (Business Settings → Security Center).
2. **Consolidate the 7 Pages into one verified Business portfolio** (today they sit in
   "Other assets"). Connect that portfolio to the TRG app.
3. Make sure the app has, under App Settings → Basic:
   - Privacy Policy URL: `https://trg-socialmedia.netlify.app/privacy`
   - User Data Deletion: `https://trg-socialmedia.netlify.app/data-deletion`
   - App icon, category, and a valid contact email.

## Permission to request
- `instagram_manage_messages` — **Advanced Access**.
  (Already granted at Standard/dev level for the owner; App Review is what unlocks it
  live for the connected business accounts.)

## Use-case justification (paste into the request)
> TRG Social is a private, internal tool used only by authorized Toast Restaurant Group
> staff to manage the Facebook Pages and Instagram Business accounts that our company
> owns for its seven restaurant locations. We are requesting `instagram_manage_messages`
> so our team can read Instagram Direct messages sent to our own restaurant accounts and
> reply to them from a single internal inbox, alongside the Facebook Messenger and comment
> replies the app already handles. This lets a small marketing team respond to guest
> questions (reservations, hours, catering, events) quickly and consistently across all
> locations. The permission is used exclusively on Instagram accounts that TRG owns and is
> authorized to manage. We do not access any other users' data, we do not sell or share
> data, and messages are only displayed to authenticated staff so they can respond.

## Reviewer test instructions (paste into "How to test")
> 1. Open https://trg-socialmedia.netlify.app
> 2. Sign in (this internal demo accepts any email and password and logs you in as an admin).
> 3. In the left menu, open **Inbox**.
> 4. At the top of Inbox, click the **Direct Messages** tab.
> 5. You will see message threads pulled live from our connected Pages/accounts, grouped by
>    restaurant. Facebook Messenger threads are shown today; once `instagram_manage_messages`
>    is approved, Instagram Direct threads appear in the same view.
> 6. Open a thread and use the reply box at the bottom to send a response; it is delivered
>    to the customer through the Meta API as the Page/account.

## Demo screencast script (record a 60–90s video)
1. Show the homepage/login; sign in.
2. Click **Inbox → Direct Messages**. Narrate: "This is our internal inbox for all
   restaurant accounts."
3. Open a Facebook Messenger thread; scroll the conversation. Narrate: "We read guest
   messages here and reply as the restaurant."
4. Type a reply and send it. Narrate: "The reply is delivered through the Meta API."
5. Narrate the ask: "We are requesting Instagram messaging so Instagram Direct messages
   appear in this same inbox and our team can respond to them the same way."
6. Briefly show the **Comments** tab (already live IG+FB comments) to prove the app already
   works with our Instagram accounts for reading/replying to comments.

## Data handling answers (for the review form)
- **What data:** message content + the sender's public name and ID, for our own accounts.
- **How stored:** access tokens server-side only (env vars); messages fetched live and
  cached briefly for performance.
- **Shared with third parties:** no.
- **Deletion:** email request or the /data-deletion page; removed within 30 days.

## Live URLs
- App: https://trg-socialmedia.netlify.app
- Privacy Policy: https://trg-socialmedia.netlify.app/privacy
- Data Deletion: https://trg-socialmedia.netlify.app/data-deletion
