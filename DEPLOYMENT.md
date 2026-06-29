# InfoTest Platform - Deployment Guide

## 🌐 Live Deployment

### Frontend (Netlify)
**URL:** https://infotest-platform.netlify.app

### Backend (Render.com)
**URL:** Will be available after Render deployment

---

## 📋 Deployment Steps

### 1️⃣ Frontend - Netlify

✅ **Status:** Configured

**Steps:**
1. Go to: https://app.netlify.com
2. Sign in with GitHub
3. Click "Add new site" → "Import an existing project"
4. Select **Action19/InfoTest** repository
5. Build settings (should auto-detect from `netlify.toml`):
   ```
   Base directory: frontend
   Build command: npm run build
   Publish directory: frontend/build
   ```
6. Click "Deploy site"

**After Backend Deployment:**
- Go to Site settings → Environment variables
- Add: `REACT_APP_API_URL` = `https://your-backend-url.onrender.com/api`
- Trigger redeploy

---

### 2️⃣ Backend - Render.com

✅ **Status:** Configured (render.yaml ready)

**Steps:**

#### Option A: Blueprint Deploy (Recommended)
1. Go to: https://render.com/deploy
2. Sign in with GitHub
3. Click "New" → "Blueprint"
4. Connect **Action19/InfoTest** repository
5. Render will automatically detect `render.yaml`
6. Review settings and click "Apply"

#### Option B: Manual Deploy
1. Go to: https://dashboard.render.com
2. Click "New +" → "Web Service"
3. Connect GitHub and select **Action19/InfoTest**
4. Settings:
   ```
   Name: infotest-backend
   Environment: Node
   Region: Singapore (or closest to you)
   Branch: main
   Root Directory: (leave empty)
   Build Command: cd backend && npm install
   Start Command: cd backend && node server.js
   ```
5. Environment Variables:
   ```
   NODE_ENV = production
   PORT = 5000
   JWT_SECRET = (click "Generate" - Render will auto-generate)
   JWT_EXPIRE = 7d
   ```
6. Select **Free** plan
7. Click "Create Web Service"

**After Deployment:**
- Copy your backend URL (e.g., `https://infotest-backend.onrender.com`)
- Update Netlify environment variables
- Initialize database by visiting: `https://your-backend-url.onrender.com/api/health`

---

## 🔧 Post-Deployment Configuration

### 3️⃣ Update Frontend Environment Variables

1. Go to Netlify dashboard
2. Site settings → Environment variables
3. Add/Update:
   ```
   REACT_APP_API_URL = https://your-backend.onrender.com/api
   ```
4. Deploys → Trigger deploy → Clear cache and deploy

### 4️⃣ Initialize Backend Database

**First-time setup:**

Visit these URLs in browser (or use curl):

```bash
# Health check
https://your-backend.onrender.com/api/health

# Initialize database (if needed)
# You may need to trigger this manually or via API
```

**Seed demo data:**

Since Render has ephemeral filesystem on free tier, you have two options:

**Option A:** Use Render Disk (Paid)
- Add Render Disk for persistent storage

**Option B:** Initialize on startup
- Modify backend to auto-initialize and seed on first run

---

## ⚠️ Important Notes

### Render.com Free Tier Limitations:
- ⏰ **Spins down after 15 minutes of inactivity**
- ⏱️ **First request after sleep takes ~30 seconds**
- 💾 **Ephemeral filesystem** (database resets on deploy)
- 🔄 **750 hours/month** (sufficient for testing)

### Solutions:
1. **Keep alive:** Use external service to ping every 14 minutes
2. **Persistent storage:** Upgrade to Render Disk ($7/month)
3. **Alternative:** Use PostgreSQL instead of SQLite (recommended for production)

---

## 🔄 Continuous Deployment

Both platforms are configured for automatic deployment:

- **Netlify:** Auto-deploys on push to `main` branch
- **Render:** Auto-deploys on push to `main` branch

**To disable auto-deploy:**
- Netlify: Site settings → Build & deploy → Stop auto publishing
- Render: Settings → Auto-Deploy → Disable

---

## 📊 Monitoring

### Netlify:
- Deploys tab: See build logs
- Analytics: Traffic stats
- Functions: Serverless function logs

### Render:
- Logs tab: Real-time application logs
- Metrics: CPU, Memory usage
- Events: Deploy history

---

## 🚀 Custom Domains (Optional)

### Netlify:
1. Domain settings → Add custom domain
2. Follow DNS configuration steps
3. Free SSL included

### Render:
1. Settings → Custom Domain
2. Add domain and configure DNS
3. Free SSL included

---

## 🔐 Security Checklist

- ✅ HTTPS enabled (automatic)
- ✅ CORS configured
- ✅ Environment variables secured
- ✅ JWT secret auto-generated
- ✅ SQL injection prevention
- ✅ XSS protection headers
- ⚠️ Consider rate limiting for production
- ⚠️ Change default passwords in seed data

---

## 📝 Post-Deployment Testing

1. **Frontend:** Visit Netlify URL
2. **Backend Health:** Visit `https://backend-url/api/health`
3. **API Test:** Try login with demo accounts
4. **CORS Test:** Check browser console for errors
5. **Database:** Verify data persistence

---

## 🐛 Troubleshooting

### "API not responding"
- Check Render service status
- Wait 30 seconds if service is sleeping
- Check backend logs in Render dashboard

### "CORS error"
- Verify CORS_ORIGIN in Render environment variables
- Ensure Netlify URL is in allowed origins
- Check browser console for exact error

### "Database not found"
- Database may have reset (ephemeral filesystem)
- Need to reinitialize and seed
- Consider PostgreSQL for production

### "Build failed"
- Check build logs in respective platforms
- Verify all dependencies in package.json
- Ensure Node version compatibility

---

## 💰 Cost Breakdown

| Service | Plan | Cost | Features |
|---------|------|------|----------|
| **Netlify** | Starter | **FREE** | 100GB bandwidth, Unlimited sites |
| **Render** | Free | **FREE** | 750hrs/month, 512MB RAM |
| **Total** | - | **$0/month** | Perfect for testing! |

### Upgrade Options:
- **Netlify Pro:** $19/month (more bandwidth, analytics)
- **Render Starter:** $7/month (persistent disk, more RAM)

---

## 🎯 Production Recommendations

For production use, consider:

1. **Database:** Migrate to PostgreSQL (Render provides free PostgreSQL)
2. **Storage:** Add Render Disk for persistent data
3. **Monitoring:** Setup error tracking (Sentry, Rollbar)
4. **Backups:** Regular database backups
5. **CDN:** Cloudflare for additional caching
6. **Email:** SendGrid for notifications

---

## 📞 Support

- **Netlify Docs:** https://docs.netlify.com
- **Render Docs:** https://render.com/docs
- **GitHub Issues:** https://github.com/Action19/InfoTest/issues

---

**Last Updated:** 2026-06-29  
**Status:** ✅ Ready for Deployment
