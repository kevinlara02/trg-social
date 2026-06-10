# ⚡ DEPLOY TO NETLIFY NOW - Quick Start

**Time to deploy: 15 minutes**

---

## STEP 1: Prepare GitHub (5 min)

```bash
cd /Users/nicolecaballero/Projects/trg-social

# Check status
git status

# Add all changes
git add .

# Commit
git commit -m "Prepare TRG Digital Monitor for production deployment"

# Push to GitHub
git push origin main
```

---

## STEP 2: Connect Netlify (5 min)

1. Go to: **https://app.netlify.com**
2. Click: **"Add new site"**
3. Select: **"Import an existing project"**
4. Choose: **GitHub**
5. Authorize Netlify to access GitHub
6. Select repository: **trg-social**
7. Click: **"Deploy site"**

Netlify will automatically:
- ✅ Detect build script from package.json
- ✅ Build your app
- ✅ Deploy to a temporary URL (like: cozy-lamp-12345.netlify.app)

---

## STEP 3: Add Environment Variables (3 min)

In Netlify, go to: **Settings → Environment**

Click: **"Add environment variables"**

Paste ALL variables from your `.env` file:

```
VITE_SUPABASE_URL = https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY = eyJ...
ANTHROPIC_API_KEY = sk-ant-...
VITE_META_APP_ID = 123456789
VITE_META_APP_SECRET = abc123def...
META_PAGE_ACCESS_TOKEN_TB = EAA...
META_PAGE_ACCESS_TOKEN_TW = EAA...
META_PAGE_ACCESS_TOKEN_SW = EAA...
META_PAGE_ACCESS_TOKEN_SA = EAA...
META_PAGE_ACCESS_TOKEN_SB = EAA...
META_PAGE_ACCESS_TOKEN_BM = EAA...
META_PAGE_ACCESS_TOKEN_TD = EAA...
VITE_INSTAGRAM_BUSINESS_ACCOUNT_IDS = id1,id2,id3,id4,id5,id6,id7
VITE_YELP_API_KEY = xxx...
GOOGLE_SERVICE_ACCOUNT_KEY = {"type":"service_account",...}
GOOGLE_CLOUD_PROJECT_ID = project-id
GOOGLE_ANALYTICS_PROPERTY_ID = 123456789
```

After adding, Netlify will **auto-redeploy** with the new variables.

---

## STEP 4: Configure Domain (2 min)

### Option A: Use Netlify Subdomain (Free)
- Your site is already live at: `yoursite.netlify.app`
- Skip to Step 5

### Option B: Connect Your Domain

1. In Netlify → **Settings → Domain Management**
2. Click: **"Add custom domain"**
3. Enter your domain: **digitalmonitor.mx**
4. Click: **"Verify"**
5. Update your domain's DNS:
   - Go to your domain registrar (GoDaddy, NameCheap, etc)
   - Replace nameservers with Netlify's:
     ```
     dns1.netlify.com
     dns2.netlify.com
     dns3.netlify.com
     dns4.netlify.com
     ```
6. Wait 5-10 minutes for DNS to propagate
7. ✅ Your domain is now pointing to your site

---

## STEP 5: Test Your Site (Live)

Open your domain:
```
https://yourdomain.com  (or yoursite.netlify.app)
```

Verify:
- ✅ Page loads without errors
- ✅ "Digital Monitor" title visible
- ✅ Login form appears
- ✅ Can login with test credentials
- ✅ Dashboard loads
- ✅ Charts render
- ✅ No errors in browser console (F12)

---

## ✅ YOU'RE DONE!

Your app is **LIVE** at: `https://yourdomain.com`

---

## 🔄 Future Deployments

Every time you push to GitHub:
```bash
git push origin main
```

Netlify automatically:
- ✅ Detects the push
- ✅ Rebuilds your app
- ✅ Redeploys within 2-5 minutes
- ✅ No downtime (blue-green deployment)

---

## 🐛 If Something Breaks

### Check Build Logs
1. Go to: **Netlify → Deploys**
2. Click: **Latest deploy**
3. Click: **"Deploy log"**
4. Read the error message

### Common Issues

**"Build failed"**
→ Fix locally: `npm run build`
→ Push the fix
→ Netlify rebuilds automatically

**"Environment variable not found"**
→ Add it to Netlify Settings → Environment
→ Netlify rebuilds automatically

**"404 on pages"**
→ Check netlify.toml (redirects rule)
→ This is already configured ✅

**"CORS error from API"**
→ Check API keys are correct in Netlify
→ Check VITE_ variables are exposed to frontend

---

## 📱 Share With Your Team

```
✅ App is now LIVE at: https://yourdomain.com
✅ Login with: [credentials]
✅ Questions? See COMPLETE_API_SETUP.md
```

---

## 🎉 NEXT STEPS

1. **Send login credentials to users**
2. **Monitor for 24 hours** (check Netlify Analytics)
3. **Complete Meta API Review** (takes 2-6 weeks)
4. **Set up monitoring** (optional but recommended)
5. **Collect user feedback**

---

**Status: DEPLOYED ✅**
