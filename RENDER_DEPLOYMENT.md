# 🚀 **RENDER DEPLOYMENT - STEP BY STEP**

## **Your Single URL:** 
After deployment: `https://bluesphere-[random].onrender.com`

## **EXACT STEPS TO PASTE INTO RENDER:**

### **1. New Web Service Settings:**
```
Repository: https://github.com/twick1234/BlueSphere
Branch: main
```

### **2. Build & Deploy Settings:**
```
Root Directory: (leave blank - use root directory)
Build Command: npm ci && npm run build
Start Command: npm start
```

### **3. Environment Variables:**
```
NODE_ENV=production
```

### **4. Advanced Settings:**
```
Auto-Deploy: ON
Health Check Path: /api/status
Instance Type: Free
Region: Oregon (US West)
```

## **COPY-PASTE FOR RENDER:**

**Root Directory:** `(leave blank - use root directory)`
**Build Command:** `npm ci && npm run build`
**Start Command:** `npm start`
**Node Version:** `18.x` (leave blank for latest)

## **AFTER DEPLOYMENT:**

Your complete BlueSphere platform will be at:
- **🏠 Homepage:** `https://your-app.onrender.com/`
- **🗺️ Ocean Map:** `https://your-app.onrender.com/map`
- **📊 API Docs:** `https://your-app.onrender.com/docs`
- **ℹ️ About:** `https://your-app.onrender.com/about`

## **If Deployment Fails:**

1. Check build logs in Render dashboard
2. Common fix: Add `.nvmrc` file with `18` in root
3. Verify package.json has all dependencies

## **Custom Domain Setup:**

1. Render Dashboard → Settings → Custom Domains
2. Add: `bluesphere.org` (your domain)
3. Update DNS: CNAME → your-render-url.onrender.com

**That's it! Single app, single URL, simple deployment.** 🌊