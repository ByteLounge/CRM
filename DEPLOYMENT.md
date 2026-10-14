# FlowCRM — Deployment Guide (Netlify & Cloud Services)

This guide covers deploying the **FlowCRM** React frontend to **Netlify** and running the backend API in production.

---

## Part 1: Deploying the Frontend to Netlify

### Option A: Automatic Git Integration (Recommended)

1. Push your repository to **GitHub** (or GitLab / Bitbucket).
2. Log in to [Netlify](https://app.netlify.com/) and click **"Add new site" ➔ "Import an existing project"**.
3. Select your GitHub repository (`FlowCRM`).
4. Netlify will automatically detect the root [`netlify.toml`](file:///D:/Projects/CRM/netlify.toml):
   - **Base directory:** `frontend`
   - **Build command:** `npm run build`
   - **Publish directory:** `frontend/dist` (or `dist`)
5. In Netlify's **Site configuration ➔ Environment variables**, add:
   ```env
   VITE_SUPABASE_URL = https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY = your_supabase_anon_key_here
   VITE_API_URL = https://your-backend-url.onrender.com
   ```
6. Click **Deploy Site**. Netlify will build and publish your site with a live URL (e.g. `https://flowcrm.netlify.app`).

---

### Option B: Instant Drag & Drop (Fastest for Evaluators)

1. The frontend production build is already pre-built in [`frontend/dist`](file:///D:/Projects/CRM/frontend/dist).
2. Go to [https://app.netlify.com/drop](https://app.netlify.com/drop).
3. Drag and drop the `D:\Projects\CRM\frontend\dist` folder directly onto the browser window.
4. Your site will be published instantly with a live URL!

> [!NOTE]
> The [`frontend/public/_redirects`](file:///D:/Projects/CRM/frontend/public/_redirects) file is already compiled into `dist/_redirects` (`/* /index.html 200`), guaranteeing that refreshing pages like `/customers` or `/orders` never causes 404 errors.

---

## Part 2: Deploying the Backend API (Render / Railway / Fly.io)

Because Netlify specializes in static web applications and serverless functions, the Express API runs best on a free Node.js hosting platform such as [Render.com](https://render.com) or [Railway.app](https://railway.app).

### Deploying to Render.com (Free)

1. Sign in to [Render](https://dashboard.render.com/) and click **New ➔ Web Service**.
2. Connect your GitHub repository.
3. Configure the web service:
   - **Root Directory:** `backend`
   - **Environment:** `Node`
   - **Build Command:** `npm install && npm run build`
   - **Start Command:** `npm start`
4. Add the Environment Variables:
   ```env
   PORT = 4000
   NODE_ENV = production
   CLIENT_URL = https://your-site.netlify.app
   SUPABASE_URL = https://your-project.supabase.co
   SUPABASE_ANON_KEY = your_supabase_anon_key_here
   SUPABASE_SERVICE_ROLE_KEY = your_supabase_service_role_key_here
   SUPABASE_JWT_SECRET = your_jwt_secret_here
   DATABASE_URL = postgresql://postgres:password@db.your-project.supabase.co:5432/postgres
   WOOCOMMERCE_MOCK_MODE = false
   WOOCOMMERCE_STORE_URL = https://your-store.local
   WOOCOMMERCE_CONSUMER_KEY = ck_your_consumer_key_here
   WOOCOMMERCE_CONSUMER_SECRET = cs_your_consumer_secret_here
   WOOCOMMERCE_WEBHOOK_SECRET = your_webhook_secret_here
   GEMINI_API_KEY = your_gemini_api_key_here
   ```
5. Click **Create Web Service**. Render will assign a public URL (e.g. `https://flowcrm-api.onrender.com`).
6. Copy that Render URL and set it as `VITE_API_URL` in your Netlify site settings!

---

## Part 3: Netlify Reverse Proxy (Optional)

If you prefer the frontend to make requests to `/api/v1` without CORS configuration, you can add a proxy rule to `netlify.toml`:

```toml
[[redirects]]
  from = "/api/*"
  to = "https://flowcrm-api.onrender.com/api/:splat"
  status = 200
  force = true
```

---

## Verification Checklist

- [x] `netlify.toml` committed to repository root
- [x] `frontend/public/_redirects` configured for SPA routing
- [x] Dynamic `VITE_API_URL` support in `frontend/src/services/api.ts`
- [x] Supabase Auth Cloud connected and verified
- [x] 1-Click Fast-Track Demo Login ready for evaluators
- [x] Zero build errors in `frontend/dist`
