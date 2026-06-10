# TRG Purchasing & Inventory  |  Setup Guide

This system uses its own Supabase project (separate from TRG Maintenance).
Follow these steps once. After that, you just log in.

---

## Step 1 — Create your Supabase project

1. Go to [supabase.com](https://supabase.com) and sign in (same account as your other projects is fine).
2. Click **"New Project"**.
3. Name it: `trg-purchasing`
4. Pick a strong database password and save it somewhere safe.
5. Wait about 2 minutes for it to finish setting up.

---

## Step 2 — Set up the database

1. In your new project, open **SQL Editor** (left sidebar).
2. Click **"New query"**.
3. Open the file `supabase/schema.sql` from this project, copy ALL of it, and paste it in.
4. Click **"Run"** (the green button).

This creates every table and pre-loads the 7 restaurants and the 14 categories.

---

## Step 3 — Get your two keys

1. In Supabase, go to **Settings > API**.
2. Copy these two values:
   - **Project URL** (looks like `https://xxxxxxxx.supabase.co`)
   - **anon public** key (a long string starting with `eyJ...`)

> The **anon public** key is safe to share and is meant for the app. Do NOT share the **service_role** key.

---

## Step 4 — Connect the app

Create a file named `.env` in the project root with your two values:

```
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-public-key
```

(There is an example file, `.env.example`, you can copy.)

---

## Step 5 — Create your admin login

1. In Supabase, go to **Authentication > Users**.
2. Click **"Add user" > "Create new user"**.
3. Enter your email and a password.
4. Go back to **SQL Editor** and run this (use the same email):

```sql
update profiles set role = 'admin' where email = 'YOUR-EMAIL-HERE';
```

Admin sees all 7 restaurants and can manage suppliers, the catalog, and users.

---

## Step 6 — Log in

- On your computer (testing): open the app at the local address (for example `http://localhost:5175`) and sign in.
- Online (after you publish): open your live web address and sign in.

---

## Step 7 — Add your team

Once you are logged in as admin:
1. Go to **Users** in the menu.
2. Add each manager or staff member with their email, a temporary password, their role, and their restaurant.
   - **Manager / Staff** see and order only for their own restaurant.
   - **Admin** sees everything.

---

## Go live (publish online) — optional, when you are ready

1. Create a new repository on GitHub (e.g. `trg-purchasing`).
2. In Terminal:

```bash
cd ~/Projects/trg-purchasing
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/trg-purchasing.git
git push -u origin main
```

3. Go to [netlify.com](https://netlify.com) > **Add new site** > **Import an existing project** > pick the repo.
4. Build settings auto-detect (no changes needed).
5. In **Site configuration > Environment variables**, add:

| Key | Value |
|-----|-------|
| `VITE_SUPABASE_URL` | Your Supabase Project URL |
| `VITE_SUPABASE_ANON_KEY` | Your Supabase anon public key |

6. Click **Trigger deploy**. Your system will be live at `https://your-site-name.netlify.app`.

Every time the code changes and is pushed to GitHub, Netlify rebuilds automatically.
