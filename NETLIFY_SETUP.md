# Netlify Environment Variables Setup

## 🚨 CRITICAL: Set Environment Variable

Netlify **DOES NOT** automatically read `.env.production`. You must set environment variables in Netlify Dashboard!

## ⚙️ Setup Steps

### 1. Go to Netlify Dashboard

1. Open: https://app.netlify.com
2. Select your site: **info-test-web-sandbox**
3. Go to: **Site settings** → **Environment variables**

### 2. Add API URL Variable

Click **Add a variable** and set:

```
Key:   REACT_APP_API_URL
Value: https://infotest-7476.onrender.com/api
```

**Important:**
- Must start with `REACT_APP_` (React requirement)
- Use HTTPS (not HTTP)
- No trailing slash after `/api`

### 3. Trigger Redeploy

After adding variable:

**Option A: Via Dashboard**
1. Go to **Deploys** tab
2. Click **Trigger deploy** → **Clear cache and deploy site**

**Option B: Via Git**
```bash
git commit --allow-empty -m "Trigger Netlify redeploy"
git push origin main
```

### 4. Wait for Build

- Build time: ~2-3 minutes
- Status: Watch in **Deploys** tab
- When done: Status shows **Published**

### 5. Verify

After deployment:

1. Open: https://info-test-web-sandbox.netlify.app/register
2. Open browser console (F12)
3. Type in console:
   ```javascript
   // Check if API URL is correct
   fetch('https://infotest-7476.onrender.com/api/auth/check-username', {
     method: 'POST',
     headers: {'Content-Type': 'application/json'},
     body: JSON.stringify({username: 'test'})
   }).then(r => r.json()).then(console.log)
   ```
4. Expected output:
   ```json
   {
     "available": true,
     "message": "✅ Bu login bo'sh"
   }
   ```

---

## 📋 Current Environment Variables Needed

### Required for Production:

| Variable | Value |
|----------|-------|
| `REACT_APP_API_URL` | `https://infotest-7476.onrender.com/api` |
| `NODE_ENV` | `production` (automatic) |
| `GENERATE_SOURCEMAP` | `false` (optional) |

---

## 🔍 Debugging

### Check Current Build

1. Go to Netlify Dashboard
2. **Deploys** tab
3. Click latest deploy
4. Check **Deploy log**
5. Look for:
   ```
   Building with: "REACT_APP_API_URL=https://infotest-7476.onrender.com/api"
   ```

### Test API URL in Browser

Open site, then in console:
```javascript
// This won't work in production without env var
console.log(process.env.REACT_APP_API_URL)
// undefined = not set!
```

---

## ✅ Success Indicators

After correct setup:

1. ✅ Validation messages appear
2. ✅ Green/red borders on inputs
3. ✅ "✅ Bu login bo'sh" or "❌ Bu login band"
4. ✅ Submit button enables/disables correctly
5. ✅ Registration works (no 400 error)
6. ✅ Console clean (no network errors)

---

## 🚨 Common Mistakes

### Mistake 1: Not setting env var
```
❌ Relying only on .env.production file
✅ Set in Netlify Dashboard
```

### Mistake 2: Wrong variable name
```
❌ API_URL
❌ REACT_API_URL
✅ REACT_APP_API_URL (must start with REACT_APP_)
```

### Mistake 3: Not redeploying
```
❌ Adding var but not rebuilding
✅ Trigger redeploy after adding var
```

### Mistake 4: Using HTTP instead of HTTPS
```
❌ http://infotest-7476.onrender.com/api
✅ https://infotest-7476.onrender.com/api
```

---

## 📞 Need Help?

If still not working after setup:

1. Screenshot Netlify environment variables page
2. Screenshot latest deploy log
3. Screenshot browser console errors
4. Share all three screenshots

---

**Setup Time:** ~5 minutes  
**Priority:** 🚨 CRITICAL  
**Impact:** Fixes all validation and registration issues
