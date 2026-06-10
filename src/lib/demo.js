// ============================================================
// DEMO MODE — realistic sample data so the whole app is browsable
// without a live backend (for showing the client what it looks like).
//
// Flip DEMO to false once the real Supabase backend + platform
// connections are live. The pages query `supabase` the same way in
// both modes, so nothing else needs to change.
// ============================================================
export const DEMO = true

export const demoProfile = {
  id: 'demo-admin', full_name: 'Kevin', email: 'kevin@toastrestaurantgroup.com',
  role: 'admin', location_id: null, active: true,
}

const SEED = {
  reviews: [
    { id: 1,  location_id: 3, platform: 'google', author_name: 'Maria L.',   rating: 5, body: 'Best brunch in Whittier, hands down. The horchata latte is unreal.',          review_url: '#', review_date: '2026-06-08T16:20:00Z', status: 'new',     reply_body: null },
    { id: 2,  location_id: 6, platform: 'yelp',   author_name: 'James R.',    rating: 4, body: 'Great food and cocktails. Service was a touch slow at peak hours.',          review_url: '#', review_date: '2026-06-08T14:05:00Z', status: 'new',     reply_body: null },
    { id: 3,  location_id: 5, platform: 'google', author_name: 'Priya S.',    rating: 5, body: 'Story Brea never misses. The patio is gorgeous at sunset.',                  review_url: '#', review_date: '2026-06-07T23:40:00Z', status: 'replied', reply_body: 'Thank you so much, Priya! See you on the patio again soon.' },
    { id: 4,  location_id: 4, platform: 'google', author_name: 'Carlos M.',   rating: 5, body: 'Amazing birthday dinner. The staff went above and beyond for us.',           review_url: '#', review_date: '2026-06-07T19:15:00Z', status: 'new',     reply_body: null },
    { id: 5,  location_id: 1, platform: 'google', author_name: 'Dana P.',     rating: 4, body: 'Lovely brunch spot. Can get busy on weekends, but worth it.',               review_url: '#', review_date: '2026-06-06T17:30:00Z', status: 'replied', reply_body: 'Thanks Dana! Weekends are popular, a reservation helps. See you soon.' },
    { id: 6,  location_id: 2, platform: 'google', author_name: 'Sam T.',      rating: 5, body: 'Toast Whittier nails it every time. Friendly team.',                         review_url: '#', review_date: '2026-06-06T15:10:00Z', status: 'new',     reply_body: null },
    { id: 7,  location_id: 3, platform: 'yelp',   author_name: 'Olivia W.',   rating: 3, body: 'Food was good but we waited 25 minutes for a table on a Sunday.',            review_url: '#', review_date: '2026-06-05T18:00:00Z', status: 'new',     reply_body: null },
    { id: 8,  location_id: 6, platform: 'google', author_name: 'Andre B.',    rating: 5, body: 'Benny and Marys is our family go-to. Always consistent.',                   review_url: '#', review_date: '2026-06-05T12:25:00Z', status: 'replied', reply_body: 'We love having your family with us, Andre. Thank you!' },
    { id: 9,  location_id: 7, platform: 'google', author_name: 'Grace K.',    rating: 4, body: 'Solid spot in Downey with friendly staff and good coffee.',                  review_url: '#', review_date: '2026-06-04T20:45:00Z', status: 'new',     reply_body: null },
    { id: 10, location_id: 5, platform: 'yelp',   author_name: 'Marcus D.',   rating: 4, body: 'Great vibe for date night. The birria pizza is a must.',                    review_url: '#', review_date: '2026-06-04T16:00:00Z', status: 'new',     reply_body: null },
    { id: 11, location_id: 4, platform: 'yelp',   author_name: 'Sofia R.',    rating: 5, body: 'Hidden gem in Anaheim. We came back twice in one week!',                    review_url: '#', review_date: '2026-06-03T21:10:00Z', status: 'new',     reply_body: null },
    { id: 12, location_id: 2, platform: 'yelp',   author_name: 'Ben H.',      rating: 2, body: 'Tasty food but our order came out wrong twice and no one checked on us.',     review_url: '#', review_date: '2026-06-03T13:50:00Z', status: 'replied', reply_body: 'We are so sorry, Ben. That is not our standard. Please email us, we want to make it right.' },
    { id: 13, location_id: 1, platform: 'google', author_name: 'Tina M.',     rating: 5, body: 'The Benediction is beautiful and the pastries are incredible.',               review_url: '#', review_date: '2026-06-02T10:30:00Z', status: 'new',     reply_body: null },
    { id: 14, location_id: 6, platform: 'yelp',   author_name: 'Luis G.',     rating: 5, body: 'Best margaritas in town and the carne asada is perfect.',                    review_url: '#', review_date: '2026-06-01T22:15:00Z', status: 'new',     reply_body: null },
    { id: 15, location_id: 3, platform: 'google', author_name: 'Hannah J.',   rating: 5, body: 'Took my mom for her birthday and they made it so special. Thank you!',       review_url: '#', review_date: '2026-05-31T19:20:00Z', status: 'replied', reply_body: 'Happy birthday to your mom! We loved having you both. 💛' },
    { id: 16, location_id: 4, platform: 'google', author_name: 'Derek P.',    rating: 3, body: 'Good food, but parking around here is a nightmare on weekends.',             review_url: '#', review_date: '2026-05-30T18:05:00Z', status: 'new',     reply_body: null },
    { id: 17, location_id: 7, platform: 'yelp',   author_name: 'Nina V.',     rating: 4, body: 'Cute spot, great lattes. Wish they were open later though.',                 review_url: '#', review_date: '2026-05-29T15:40:00Z', status: 'new',     reply_body: null },
    { id: 18, location_id: 5, platform: 'google', author_name: 'Tony C.',     rating: 1, body: 'Waited over an hour for our food on a slow night. Really disappointing.',     review_url: '#', review_date: '2026-05-28T20:50:00Z', status: 'new',     reply_body: null },
    { id: 19, location_id: 2, platform: 'google', author_name: 'Erin S.',     rating: 5, body: 'My favorite weekend ritual. The avocado toast is perfection.',               review_url: '#', review_date: '2026-05-27T11:10:00Z', status: 'replied', reply_body: 'That makes our day, Erin! See you this weekend. 🥑' },
    { id: 20, location_id: 6, platform: 'google', author_name: 'Pablo M.',    rating: 5, body: 'Live music nights are the best. Food and drinks always on point.',            review_url: '#', review_date: '2026-05-26T23:30:00Z', status: 'new',     reply_body: null },
    { id: 21, location_id: 1, platform: 'yelp',   author_name: 'Rachel D.',   rating: 4, body: 'Gorgeous interior, lovely staff. A little pricey but a nice treat.',         review_url: '#', review_date: '2026-05-25T14:00:00Z', status: 'new',     reply_body: null },
    { id: 22, location_id: 4, platform: 'yelp',   author_name: 'Omar F.',     rating: 5, body: 'The tacos here are next level. Already planning my next visit.',             review_url: '#', review_date: '2026-05-24T19:45:00Z', status: 'new',     reply_body: null },
    { id: 23, location_id: 3, platform: 'opentable',   author_name: 'Renata G.',  rating: 5, body: 'Booked through OpenTable and were seated right on time. A lovely dinner from start to finish.', review_url: '#', review_date: '2026-06-08T01:30:00Z', status: 'new',     reply_body: null },
    { id: 24, location_id: 5, platform: 'tripadvisor', author_name: 'Tom H.',     rating: 4, body: 'Found this on Tripadvisor while visiting LA. Great cocktails and a fun room.',           review_url: '#', review_date: '2026-06-07T02:00:00Z', status: 'new',     reply_body: null },
    { id: 25, location_id: 6, platform: 'opentable',   author_name: 'Cynthia W.', rating: 5, body: 'Easy reservation, fantastic service, and the patio was beautiful.',                     review_url: '#', review_date: '2026-06-06T03:15:00Z', status: 'replied', reply_body: 'Thank you, Cynthia! The patio is our favorite too. See you again soon.' },
    { id: 26, location_id: 4, platform: 'tripadvisor', author_name: 'Markus B.',  rating: 5, body: 'A must-visit in Anaheim. Authentic, delicious, and friendly staff.',                     review_url: '#', review_date: '2026-06-05T20:40:00Z', status: 'new',     reply_body: null },
    { id: 27, location_id: 1, platform: 'opentable',   author_name: 'Robert D.',  rating: 4, body: 'Great brunch and OpenTable made the whole thing easy.',                                  review_url: '#', review_date: '2026-06-04T17:10:00Z', status: 'new',     reply_body: null },
    { id: 28, location_id: 3, platform: 'tripadvisor', author_name: 'Yuki T.',    rating: 5, body: 'Wonderful spot, currently ranked #2 for brunch in Whittier on Tripadvisor for good reason.', review_url: '#', review_date: '2026-06-02T18:25:00Z', status: 'new',     reply_body: null },
    { id: 29, location_id: 6, platform: 'tripadvisor', author_name: 'Elena M.',   rating: 2, body: 'A bit overpriced for what you get, and it was very loud the night we went.',             review_url: '#', review_date: '2026-06-01T21:05:00Z', status: 'new',     reply_body: null },
    { id: 30, location_id: 5, platform: 'opentable',   author_name: 'Paul S.',    rating: 4, body: 'Solid date-night option. Reservation was smooth and the food came out fast.',            review_url: '#', review_date: '2026-05-30T02:30:00Z', status: 'new',     reply_body: null },
  ],
  messages: [
    { id: 1,  location_id: 3, platform: 'instagram',   kind: 'dm',      author_name: null,            author_handle: '@foodie_la',     body: 'Do you take reservations for 8 this Saturday?',                  permalink: '#', message_date: '2026-06-08T17:10:00Z', status: 'new',     reply_body: null },
    { id: 2,  location_id: 6, platform: 'facebook',    kind: 'comment', author_name: 'Karen P.',      author_handle: null,             body: 'Are you open on Memorial Day?',                                  permalink: '#', message_date: '2026-06-08T15:30:00Z', status: 'new',     reply_body: null },
    { id: 3,  location_id: 5, platform: 'instagram',   kind: 'comment', author_name: null,            author_handle: '@brea_bites',    body: 'That birria pizza looks amazing 🤤',                              permalink: '#', message_date: '2026-06-08T11:45:00Z', status: 'new',     reply_body: null },
    { id: 4,  location_id: 3, platform: 'squarespace', kind: 'form',    author_name: 'Jessica Romero', author_handle: null,            body: 'Hi! I would like to book a private event for 30 people in July. Do you have a space?', permalink: '#', message_date: '2026-06-08T10:05:00Z', status: 'new', reply_body: null },
    { id: 5,  location_id: 4, platform: 'facebook',    kind: 'dm',      author_name: 'Mark T.',       author_handle: null,             body: 'Hi! Do you have gluten free options on the menu?',               permalink: '#', message_date: '2026-06-07T20:05:00Z', status: 'new',     reply_body: null },
    { id: 6,  location_id: 6, platform: 'squarespace', kind: 'form',    author_name: 'David Nguyen',  author_handle: null,             body: 'Looking for catering for a corporate lunch (~50 people). Can someone send pricing?', permalink: '#', message_date: '2026-06-07T16:40:00Z', status: 'new', reply_body: null },
    { id: 7,  location_id: 3, platform: 'instagram',   kind: 'comment', author_name: null,            author_handle: '@hungryhippo',   body: 'Best pancakes in LA, no contest',                                permalink: '#', message_date: '2026-06-07T14:20:00Z', status: 'replied', reply_body: 'Thank you so much! 🥞' },
    { id: 8,  location_id: 6, platform: 'instagram',   kind: 'dm',      author_name: null,            author_handle: '@eventsbylauren', body: 'Can we book the patio for a party of 20 next month?',           permalink: '#', message_date: '2026-06-07T09:30:00Z', status: 'new',     reply_body: null },
    { id: 9,  location_id: 1, platform: 'facebook',    kind: 'comment', author_name: 'Helen R.',      author_handle: null,             body: 'Such a lovely spot for brunch with friends!',                    permalink: '#', message_date: '2026-06-06T16:40:00Z', status: 'new',     reply_body: null },
    { id: 10, location_id: 5, platform: 'squarespace', kind: 'form',    author_name: 'Aisha Khan',    author_handle: null,             body: 'Do you host bridal showers? Looking for a Sunday in August.',    permalink: '#', message_date: '2026-06-06T13:15:00Z', status: 'new',     reply_body: null },
    { id: 11, location_id: 7, platform: 'facebook',    kind: 'dm',      author_name: 'Diego S.',      author_handle: null,             body: 'What time does happy hour start on weekdays?',                   permalink: '#', message_date: '2026-06-06T12:15:00Z', status: 'new',     reply_body: null },
    { id: 12, location_id: 5, platform: 'instagram',   kind: 'dm',      author_name: null,            author_handle: '@plantbased.kt', body: 'Any vegan dishes I should try?',                                 permalink: '#', message_date: '2026-06-05T18:50:00Z', status: 'new',     reply_body: null },
    { id: 13, location_id: 2, platform: 'instagram',   kind: 'comment', author_name: null,            author_handle: '@toastlover',    body: 'The avocado toast 😍😍',                                          permalink: '#', message_date: '2026-06-05T10:05:00Z', status: 'replied', reply_body: 'Our favorite too! 💚' },
    { id: 14, location_id: 4, platform: 'squarespace', kind: 'form',    author_name: 'Brian Walsh',   author_handle: null,             body: 'Is there a wait for parties of 6 on Friday nights, or can I reserve?', permalink: '#', message_date: '2026-06-04T19:25:00Z', status: 'new', reply_body: null },
    { id: 15, location_id: 6, platform: 'facebook',    kind: 'comment', author_name: 'Monica T.',     author_handle: null,             body: 'Loved the live music last night! Who was the band?',             permalink: '#', message_date: '2026-06-04T09:10:00Z', status: 'new',     reply_body: null },
    { id: 16, location_id: 1, platform: 'squarespace', kind: 'form',    author_name: 'Priya Anand',   author_handle: null,             body: 'Do you sell gift cards online? Want one for a birthday gift.',   permalink: '#', message_date: '2026-06-03T15:55:00Z', status: 'replied', reply_body: 'Yes! Gift cards are on our website under the menu. Thank you, Priya!' },
    { id: 17, location_id: 3, platform: 'instagram',   kind: 'dm',      author_name: null,            author_handle: '@whittier.mom',  body: 'Is the kids menu available all day?',                            permalink: '#', message_date: '2026-06-03T08:30:00Z', status: 'new',     reply_body: null },
    { id: 18, location_id: 7, platform: 'squarespace', kind: 'form',    author_name: 'Kevin Brooks',  author_handle: null,             body: 'Interested in a standing weekly coffee order for my office. Who do I talk to?', permalink: '#', message_date: '2026-06-02T11:20:00Z', status: 'new', reply_body: null },
  ],
  posts: [
    { id: 1, caption: 'Weekend brunch special: bottomless mimosas 🥂 Reserve your table now.', status: 'scheduled', scheduled_at: '2026-06-12T16:00:00Z', published_at: null, targets: [{ location_id: 3, platform: 'instagram' }, { location_id: 3, platform: 'facebook' }, { location_id: 5, platform: 'instagram' }] },
    { id: 2, caption: 'Happy Hour every Friday, 4 to 6pm at Story Brea 🍸',                     status: 'scheduled', scheduled_at: '2026-06-13T23:00:00Z', published_at: null, targets: [{ location_id: 5, platform: 'facebook' }, { location_id: 5, platform: 'instagram' }] },
    { id: 3, caption: 'Our new summer menu drops Monday ☀️ Who is ready?',                      status: 'scheduled', scheduled_at: '2026-06-15T17:00:00Z', published_at: null, targets: [{ location_id: 3, platform: 'instagram' }, { location_id: 4, platform: 'instagram' }, { location_id: 5, platform: 'instagram' }] },
    { id: 4, caption: 'Father’s Day brunch is booking up fast 👔 Grab your spot.',          status: 'scheduled', scheduled_at: '2026-06-16T15:00:00Z', published_at: null, targets: [{ location_id: 1, platform: 'facebook' }, { location_id: 6, platform: 'facebook' }, { location_id: 6, platform: 'instagram' }] },
    { id: 5, caption: 'Thank you for an amazing Mother’s Day! 💐',                          status: 'published', scheduled_at: null, published_at: '2026-05-11T18:00:00Z', targets: [{ location_id: 6, platform: 'facebook' }, { location_id: 6, platform: 'instagram' }] },
    { id: 6, caption: 'Taco Tuesday is back 🌮 All day, all locations.',                        status: 'published', scheduled_at: null, published_at: '2026-06-03T15:00:00Z', targets: [{ location_id: 4, platform: 'instagram' }] },
    { id: 7, caption: 'New cold brew flight just landed ☕ Come try all four.',                 status: 'published', scheduled_at: null, published_at: '2026-05-28T16:30:00Z', targets: [{ location_id: 2, platform: 'instagram' }, { location_id: 7, platform: 'instagram' }] },
    { id: 8, caption: 'Behind the scenes with our pastry chef 🥐',                              status: 'draft',     scheduled_at: null, published_at: null, targets: [{ location_id: 1, platform: 'instagram' }] },
    { id: 9, caption: 'Summer patio season is here 🌿 Tag who you are bringing.',               status: 'draft',     scheduled_at: null, published_at: null, targets: [{ location_id: 5, platform: 'instagram' }, { location_id: 3, platform: 'instagram' }] },
  ],
  profiles: [
    { id: 'p1', full_name: 'Kevin',            email: 'kevin@toastrestaurantgroup.com', role: 'admin',   location_id: null, active: true },
    { id: 'p2', full_name: 'Marcus Reyes',     email: 'marcus@trg.com',          role: 'manager', location_id: 3,    active: true },
    { id: 'p3', full_name: 'Ava Thompson',     email: 'ava@trg.com',             role: 'manager', location_id: 5,    active: true },
    { id: 'p4', full_name: 'Diego Salas',      email: 'diego@trg.com',           role: 'manager', location_id: 6,    active: true },
    { id: 'p5', full_name: 'Hannah Park',      email: 'hannah@trg.com',          role: 'manager', location_id: 1,    active: true },
    { id: 'p6', full_name: 'Tyler Brooks',     email: 'tyler@trg.com',           role: 'staff',   location_id: 4,    active: true },
    { id: 'p7', full_name: 'Sofia Delgado',    email: 'sofia@trg.com',           role: 'staff',   location_id: 2,    active: true },
    { id: 'p8', full_name: 'Jordan Lee',       email: 'jordan@trg.com',          role: 'staff',   location_id: 7,    active: false },
  ],
  activity: [
    { id: 1, actor: 'Kevin', action: 'replied to a Google review',        target: 'Priya S.',               location_id: 5, at: '2026-06-08T17:02:00Z' },
    { id: 2, actor: 'Diego',  action: 'replied to a Yelp review',          target: 'Andre B.',               location_id: 6, at: '2026-06-08T13:40:00Z' },
    { id: 3, actor: 'Marcus', action: 'replied to an Instagram comment',   target: '@hungryhippo',           location_id: 3, at: '2026-06-07T15:10:00Z' },
    { id: 4, actor: 'Kevin', action: 'scheduled a post',                  target: 'Weekend brunch special', location_id: 3, at: '2026-06-07T11:25:00Z' },
    { id: 5, actor: 'Ava',    action: 'replied to a Squarespace inquiry',  target: 'Aisha Khan',             location_id: 5, at: '2026-06-06T14:05:00Z' },
    { id: 6, actor: 'Sofia',  action: 'replied to an Instagram comment',   target: '@toastlover',            location_id: 2, at: '2026-06-05T10:20:00Z' },
    { id: 7, actor: 'Hannah', action: 'replied to a Squarespace inquiry',  target: 'Priya Anand',            location_id: 1, at: '2026-06-03T16:10:00Z' },
    { id: 8, actor: 'Kevin', action: 'published a post',                  target: 'Taco Tuesday is back',   location_id: 4, at: '2026-06-03T15:00:00Z' },
  ],
  connected_accounts: [
    { location_id: 1, platform: 'google', status: 'connected' }, { location_id: 1, platform: 'yelp', status: 'connected' }, { location_id: 1, platform: 'facebook', status: 'connected' }, { location_id: 1, platform: 'instagram', status: 'connected' }, { location_id: 1, platform: 'squarespace', status: 'connected' },
    { location_id: 2, platform: 'google', status: 'connected' }, { location_id: 2, platform: 'facebook', status: 'connected' }, { location_id: 2, platform: 'instagram', status: 'connected' },
    { location_id: 3, platform: 'google', status: 'connected' }, { location_id: 3, platform: 'yelp', status: 'connected' }, { location_id: 3, platform: 'facebook', status: 'connected' }, { location_id: 3, platform: 'instagram', status: 'connected' }, { location_id: 3, platform: 'squarespace', status: 'connected' },
    { location_id: 4, platform: 'google', status: 'connected' }, { location_id: 4, platform: 'facebook', status: 'connected' }, { location_id: 4, platform: 'instagram', status: 'connected' }, { location_id: 4, platform: 'squarespace', status: 'connected' },
    { location_id: 5, platform: 'google', status: 'connected' }, { location_id: 5, platform: 'yelp', status: 'connected' }, { location_id: 5, platform: 'facebook', status: 'connected' }, { location_id: 5, platform: 'instagram', status: 'connected' },
    { location_id: 6, platform: 'google', status: 'connected' }, { location_id: 6, platform: 'yelp', status: 'connected' }, { location_id: 6, platform: 'facebook', status: 'connected' }, { location_id: 6, platform: 'instagram', status: 'connected' }, { location_id: 6, platform: 'squarespace', status: 'connected' },
    { location_id: 7, platform: 'google', status: 'connected' }, { location_id: 7, platform: 'facebook', status: 'connected' }, { location_id: 7, platform: 'instagram', status: 'connected' },
    { location_id: 1, platform: 'opentable', status: 'connected' }, { location_id: 1, platform: 'tripadvisor', status: 'connected' },
    { location_id: 3, platform: 'opentable', status: 'connected' }, { location_id: 3, platform: 'tripadvisor', status: 'connected' },
    { location_id: 4, platform: 'tripadvisor', status: 'connected' },
    { location_id: 5, platform: 'opentable', status: 'connected' }, { location_id: 5, platform: 'tripadvisor', status: 'connected' },
    { location_id: 6, platform: 'opentable', status: 'connected' }, { location_id: 6, platform: 'tripadvisor', status: 'connected' },
  ],
  // AI visibility: do common local prompts surface our restaurants in AI assistants?
  ai_checks: [
    { id: 1, prompt: 'best brunch in Whittier',            results: [{ engine: 'ChatGPT', mentioned: true, location_id: 3 }, { engine: 'Claude', mentioned: true, location_id: 3 }, { engine: 'Gemini', mentioned: false, location_id: null }, { engine: 'Perplexity', mentioned: true, location_id: 1 }] },
    { id: 2, prompt: 'where to eat in Brea with cocktails', results: [{ engine: 'ChatGPT', mentioned: true, location_id: 5 }, { engine: 'Claude', mentioned: true, location_id: 5 }, { engine: 'Gemini', mentioned: true, location_id: 5 }, { engine: 'Perplexity', mentioned: false, location_id: null }] },
    { id: 3, prompt: 'romantic dinner in Anaheim',          results: [{ engine: 'ChatGPT', mentioned: true, location_id: 4 }, { engine: 'Claude', mentioned: false, location_id: null }, { engine: 'Gemini', mentioned: true, location_id: 4 }, { engine: 'Perplexity', mentioned: true, location_id: 4 }] },
    { id: 4, prompt: 'family restaurant in Downey',         results: [{ engine: 'ChatGPT', mentioned: false, location_id: null }, { engine: 'Claude', mentioned: true, location_id: 7 }, { engine: 'Gemini', mentioned: false, location_id: null }, { engine: 'Perplexity', mentioned: false, location_id: null }] },
    { id: 5, prompt: 'best margaritas in Los Angeles',      results: [{ engine: 'ChatGPT', mentioned: true, location_id: 6 }, { engine: 'Claude', mentioned: true, location_id: 6 }, { engine: 'Gemini', mentioned: false, location_id: null }, { engine: 'Perplexity', mentioned: true, location_id: 6 }] },
    { id: 6, prompt: 'good coffee near Whittier',           results: [{ engine: 'ChatGPT', mentioned: true, location_id: 2 }, { engine: 'Claude', mentioned: true, location_id: 2 }, { engine: 'Gemini', mentioned: true, location_id: 2 }, { engine: 'Perplexity', mentioned: false, location_id: null }] },
  ],
  // Website visits that arrived from AI assistants (e.g. from your Squarespace / GA analytics).
  ai_referrals: [
    { id: 1, source: 'ChatGPT',    visits: 142 },
    { id: 2, source: 'Perplexity', visits: 73 },
    { id: 3, source: 'Gemini',     visits: 38 },
    { id: 4, source: 'Claude',     visits: 21 },
    { id: 5, source: 'Copilot',    visits: 12 },
  ],
  // Website visits (from Squarespace / Google analytics) — per restaurant, this month vs last.
  web_traffic: [
    { id: 1, location_id: 1, visits: 2840, prev: 2510 },
    { id: 2, location_id: 2, visits: 1960, prev: 2050 },
    { id: 3, location_id: 3, visits: 4120, prev: 3380 },
    { id: 4, location_id: 4, visits: 3050, prev: 2890 },
    { id: 5, location_id: 5, visits: 3380, prev: 3010 },
    { id: 6, location_id: 6, visits: 5210, prev: 4620 },
    { id: 7, location_id: 7, visits: 1540, prev: 1380 },
  ],
  // Where the website visits came from (this month).
  web_sources: [
    { id: 1, source: 'Search', visits: 9600 },
    { id: 2, source: 'Direct', visits: 7800 },
    { id: 3, source: 'Social', visits: 4414 },
    { id: 4, source: 'AI',     visits: 286 },
  ],
  // Social profile activity (from Facebook & Instagram insights) — per restaurant + network.
  social_traffic: [
    { id: 1,  location_id: 1, platform: 'facebook',  profile_visits: 640,  reach: 9800,  followers: 2400 },
    { id: 2,  location_id: 1, platform: 'instagram', profile_visits: 1100, reach: 15200, followers: 4100 },
    { id: 3,  location_id: 2, platform: 'facebook',  profile_visits: 520,  reach: 7600,  followers: 1900 },
    { id: 4,  location_id: 2, platform: 'instagram', profile_visits: 880,  reach: 11800, followers: 3300 },
    { id: 5,  location_id: 3, platform: 'facebook',  profile_visits: 1280, reach: 18400, followers: 5200 },
    { id: 6,  location_id: 3, platform: 'instagram', profile_visits: 2100, reach: 26800, followers: 8600 },
    { id: 7,  location_id: 4, platform: 'facebook',  profile_visits: 740,  reach: 10200, followers: 2700 },
    { id: 8,  location_id: 4, platform: 'instagram', profile_visits: 1320, reach: 16900, followers: 5100 },
    { id: 9,  location_id: 5, platform: 'facebook',  profile_visits: 980,  reach: 13600, followers: 3600 },
    { id: 10, location_id: 5, platform: 'instagram', profile_visits: 1680, reach: 21400, followers: 6400 },
    { id: 11, location_id: 6, platform: 'facebook',  profile_visits: 1520, reach: 21800, followers: 6100 },
    { id: 12, location_id: 6, platform: 'instagram', profile_visits: 2460, reach: 31200, followers: 9800 },
    { id: 13, location_id: 7, platform: 'facebook',  profile_visits: 410,  reach: 5900,  followers: 1500 },
    { id: 14, location_id: 7, platform: 'instagram', profile_visits: 690,  reach: 9100,  followers: 2600 },
  ],
}

export { SEED }

// Persist a small change to the in-memory seed (so demo replies/posts
// stick when you navigate away and come back during a demo).
export function demoMutate(table, id, patch) {
  const row = (SEED[table] || []).find((r) => r.id === id)
  if (row) Object.assign(row, patch)
}
export function demoInsert(table, row) {
  const list = SEED[table] || (SEED[table] = [])
  const id = Math.max(0, ...list.map((r) => (typeof r.id === 'number' ? r.id : 0))) + 1
  const full = { id, ...row }
  list.unshift(full)
  return full
}

// Record an action in the activity log (demo mode).
export function logActivity({ action, target, location_id }) {
  return demoInsert('activity', {
    actor: demoProfile.full_name.split(' ')[0],
    action,
    target: target || '',
    location_id: location_id ?? null,
    at: new Date().toISOString(),
  })
}

// A tiny in-memory stand-in for the Supabase client that supports the
// query shapes the pages use: .select().eq().gt().in().order().limit() and .single().
function builder(rows) {
  let data = [...rows]
  let orderKey = null, orderAsc = true, lim = null
  const b = {
    select: () => b,
    eq: (k, v) => { data = data.filter((r) => r[k] === v); return b },
    gt: (k, v) => { data = data.filter((r) => r[k] > v); return b },
    in: (k, vs) => { data = data.filter((r) => vs.includes(r[k])); return b },
    order: (k, opts) => { orderKey = k; orderAsc = opts?.ascending !== false; return b },
    limit: (n) => { lim = n; return b },
    update: () => b, insert: () => b, delete: () => b,
    single: () => Promise.resolve({ data: data[0] || null, error: null }),
    then: (resolve) => {
      let out = [...data]
      if (orderKey) out.sort((a, z) => {
        const av = a[orderKey], zv = z[orderKey]
        return (av > zv ? 1 : av < zv ? -1 : 0) * (orderAsc ? 1 : -1)
      })
      if (lim != null) out = out.slice(0, lim)
      return resolve({ data: out, error: null })
    },
  }
  return b
}

export const demoClient = {
  from: (table) => builder(SEED[table] || []),
  auth: {
    getSession: async () => ({ data: { session: null } }),
    onAuthStateChange: () => ({ data: { subscription: { unsubscribe() {} } } }),
    signInWithPassword: async () => ({ error: null }),
    signOut: async () => ({ error: null }),
  },
}
