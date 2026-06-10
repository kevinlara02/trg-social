# 🚀 DEPLOYMENT CHECKLIST

Complete this checklist before deploying to Netlify.

---

## ✅ PRE-DEPLOYMENT

### Code Quality
- [ ] No console.log() in production code (except errors)
- [ ] No hardcoded credentials or API keys
- [ ] All imports are correct
- [ ] No broken links
- [ ] CSS is responsive (tested on mobile)

### Repository
- [ ] .env file is in .gitignore
- [ ] .env.example has all variables
- [ ] node_modules is in .gitignore
- [ ] No large files (>50MB)
- [ ] Latest code pushed to main branch
- [ ] No merge conflicts

### Testing
- [ ] App runs locally: `npm run dev`
- [ ] Build succeeds: `npm run build`
- [ ] No console errors in browser
- [ ] Dashboard loads without errors
- [ ] All pages accessible (dashboard, reviews, inbox, publish, reports, traffic)

### Environment Setup
- [ ] All API keys obtained:
  - [ ] Google Business Profile
  - [ ] Meta (App ID + Secret)
  - [ ] Yelp API Key
  - [ ] Claude/Anthropic API Key
  - [ ] Google Analytics (Property ID)
  - [ ] Supabase (URL + Anon Key)

---

## 🔧 NETLIFY SETUP

### 1. Connect Repository
- [ ] GitHub repository created
- [ ] Netlify account created
- [ ] Repository connected to Netlify
- [ ] Auto-build enabled

### 2. Environment Variables
In Netlify → Settings → Environment:

#### Required
- [ ] `VITE_SUPABASE_URL`
- [ ] `VITE_SUPABASE_ANON_KEY`
- [ ] `ANTHROPIC_API_KEY`

#### Meta (Facebook & Instagram)
- [ ] `VITE_META_APP_ID`
- [ ] `VITE_META_APP_SECRET`
- [ ] `META_PAGE_ACCESS_TOKEN_TB`
- [ ] `META_PAGE_ACCESS_TOKEN_TW`
- [ ] `META_PAGE_ACCESS_TOKEN_SW`
- [ ] `META_PAGE_ACCESS_TOKEN_SA`
- [ ] `META_PAGE_ACCESS_TOKEN_SB`
- [ ] `META_PAGE_ACCESS_TOKEN_BM`
- [ ] `META_PAGE_ACCESS_TOKEN_TD`
- [ ] `VITE_INSTAGRAM_BUSINESS_ACCOUNT_IDS`

#### Google
- [ ] `GOOGLE_SERVICE_ACCOUNT_KEY`
- [ ] `GOOGLE_CLOUD_PROJECT_ID`
- [ ] `GOOGLE_ANALYTICS_PROPERTY_ID`

#### Yelp
- [ ] `VITE_YELP_API_KEY`
- [ ] `YELP_BUSINESS_ID_TB` through `YELP_BUSINESS_ID_TD`

#### Optional
- [ ] `VITE_SQUARESPACE_API_KEY` (if using)
- [ ] `TRIPADVISOR_API_KEY` (if using)

### 3. Domain Setup
- [ ] Domain registered or existing
- [ ] Domain added to Netlify
- [ ] DNS configured (or nameservers updated)
- [ ] HTTPS certificate auto-installed
- [ ] Domain resolves correctly

---

## 🚀 DEPLOYMENT

### 1. Final Push
```bash
git status                    # Review changes
git add .
git commit -m "Prepare for production deployment"
git push origin main
```

### 2. Netlify Build
- [ ] Netlify auto-detects push
- [ ] Build starts automatically
- [ ] Build completes without errors
- [ ] Deploy preview available
- [ ] Live site deployed

### 3. Post-Deployment
```
Open: https://yourdomain.com
```

---

## ✔️ LIVE VALIDATION

### Homepage
- [ ] Page loads in < 3 seconds
- [ ] Logo displays correctly
- [ ] "Digital Monitor" title visible
- [ ] Login form appears

### Login & Auth
- [ ] Can login with test credentials
- [ ] Redirects to dashboard after login
- [ ] "Sign out" button visible
- [ ] Logout works correctly

### Dashboard
- [ ] All stat cards load (New Reviews, Messages, Avg Rating, Posts)
- [ ] Charts render (Ratings Over Time, Rating Distribution, Platform Distribution)
- [ ] Charts are responsive
- [ ] No console errors

### Other Pages
- [ ] Reviews page loads and displays data
- [ ] Inbox page accessible
- [ ] Publish page works
- [ ] Reports page loads
- [ ] Traffic page displays
- [ ] Mobile view responsive

### APIs Integration
- [ ] Google reviews appear in Dashboard
- [ ] Yelp reviews appear
- [ ] Can click "Suggest" (AI reply)
- [ ] Claude generates responses
- [ ] Can publish to Facebook/Instagram (if Meta approved)

### Performance
- [ ] Page load time < 3 seconds
- [ ] Charts render smoothly
- [ ] No lag when navigating pages
- [ ] Network tab shows no 404s or 500s

### Mobile
- [ ] Viewport is correct (not zoomed out)
- [ ] All buttons clickable
- [ ] Text is readable
- [ ] Charts scale properly
- [ ] Top bar shows "Digital Monitor"

---

## 🔒 SECURITY FINAL CHECK

- [ ] No API keys in console logs
- [ ] No credentials in error messages
- [ ] HTTPS working (lock icon in browser)
- [ ] All API calls are HTTPS
- [ ] Service workers cached correctly

---

## 📊 MONITORING

### Netlify Dashboard
- [ ] Visit: https://app.netlify.com
- [ ] Check: Deploys → Latest deploy is GREEN
- [ ] Check: Analytics → Real-time visitors
- [ ] Check: Functions → No errors
- [ ] Set up: Notifications for deploy failures

### Uptime Monitoring (Optional)
- [ ] Set up: https://status.netlify.com
- [ ] Set up: Email alerts for downtime
- [ ] Monitor: Response time trends

---

## 🎯 GO-LIVE ITEMS

After deployment, complete these:

- [ ] Send login credentials to users
- [ ] Brief users on how to use the app
- [ ] Monitor first 24 hours for errors
- [ ] Collect feedback from users
- [ ] Plan next API integrations
- [ ] Schedule API review approvals (Meta takes 2-6 weeks)

---

## 🚨 EMERGENCY CONTACTS

If something breaks:

1. **Check Netlify Deploy Logs**
   - Go to: Deploys → Latest deploy
   - Click: "Deploy log"
   - Look for error messages

2. **Check Browser Console**
   - Press: F12 (DevTools)
   - Check: Console tab for JavaScript errors
   - Check: Network tab for failed requests

3. **Common Issues**
   - Environment variable missing → Add to Netlify
   - Build fails → Check `npm run build` locally
   - 404s → Check routing in netlify.toml
   - API errors → Verify API keys in .env

---

## ✅ FINAL SIGN-OFF

- [ ] All checkboxes completed
- [ ] App is LIVE
- [ ] Users can access
- [ ] No critical errors
- [ ] Ready for production use

---

**Deployment Date:** _______________

**Deployed By:** _______________

**Status:** 🟢 LIVE
