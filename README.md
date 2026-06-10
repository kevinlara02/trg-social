# 🎯 TRG Digital Monitor

Unified social media and reviews management platform for 7 Toast Restaurant Group (TRG) locations.

Monitor and respond to reviews, publish posts, and track analytics across Google, Facebook, Instagram, and Yelp—all from one dashboard.

---

## ✨ Features

- **📱 Review Management**: Centralized reviews from Google, Yelp, Facebook, Instagram, OpenTable, and TripAdvisor
- **🤖 AI-Powered Replies**: Auto-generate responses with Claude AI (bilingual)
- **📅 Social Publishing**: Schedule and publish posts to Facebook & Instagram
- **📊 Analytics Dashboard**: Visual charts for ratings trends, reviews by platform, traffic data
- **🔔 Smart Alerts**: Negative review notifications and unread message tracking
- **⏰ Activity Log**: Track all actions across locations
- **🎨 Brand Consistency**: Per-location color coding
- **📱 Mobile Optimized**: Fully responsive design

---

## 🏗️ Tech Stack

- **Frontend**: Vite + React 19 + Tailwind CSS
- **Database**: Supabase (PostgreSQL)
- **AI**: Claude API (Anthropic)
- **APIs**: Google, Meta, Yelp, OpenTable, TripAdvisor
- **Hosting**: Netlify (with serverless functions)
- **Authentication**: Supabase Auth (Row Level Security)

---

## 🚀 Quick Start

### Prerequisites
- Node.js 20.18.0+
- Supabase project
- Netlify account
- GitHub repository

### Development

```bash
# Install dependencies
npm install

# Start dev server (localhost:5176)
./start-dev.sh

# Or manually:
export PATH="/Users/nicolecaballero/.node/node-v20.18.0-darwin-x64/bin:$PATH"
npm run dev
```

### Environment Variables

Copy `.env.example` to `.env` and fill in your credentials:

```bash
cp .env.example .env
```

See `COMPLETE_API_SETUP.md` for detailed API configuration instructions.

---

## 📦 Deployment

### Deploy to Netlify

```bash
# 1. Push to GitHub
git add .
git commit -m "Deploy to production"
git push

# 2. In Netlify UI:
#    - Connect your GitHub repo
#    - Add environment variables (from .env.example)
#    - Connect domain
#    - Auto-deploys on each push

# 3. Your site is live!
```

### Environment Variables in Netlify

Go to: **Settings → Environment → Add environment variables**

Required variables (from `.env.example`):
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `ANTHROPIC_API_KEY`
- All Meta, Google, Yelp credentials

---

## 📚 Documentation

- **[API Setup Guide](./COMPLETE_API_SETUP.md)** - Step-by-step configuration for all APIs
- **[Cost Analysis](./COST_ANALYSIS.md)** - Infrastructure costs and pricing models
- **[Setup Instructions](./SETUP.md)** - Initial database setup

---

## 👥 User Roles

- **Admin**: Access to all 7 locations, manage users, view reports, analytics
- **Manager**: Own restaurant only, can respond to reviews and publish posts
- **Staff**: Own restaurant only, read-only access

---

## 🔒 Security

- Row Level Security (RLS) on Supabase
- API keys stored securely in Netlify environment variables
- Never commit `.env` or credentials to GitHub
- HTTPS enforced by Netlify
- Service accounts for Google/Meta APIs

---

## 🐛 Troubleshooting

### "Token expired"
Convert short-lived tokens to long-lived tokens (see API setup guide)

### "Permission denied on Google"
Ensure service account has access to all 7 Google Business Profiles

### "Instagram not publishing"
Verify Instagram Business Account IDs in Meta Graph API

### "Claude not responding"
Check `ANTHROPIC_API_KEY` in Netlify environment variables

---

## 📞 Support

For API setup help, see `COMPLETE_API_SETUP.md`  
For cost analysis, see `COST_ANALYSIS.md`

---

## 📄 License

All rights reserved. Built for Toast Restaurant Group.
