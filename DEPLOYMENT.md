# FlowCRM — Render Cloud Deployment Guide (Frontend & Backend)

FlowCRM is designed to run seamlessly on **[Render.com](https://render.com/)** as a **single unified full-stack service** (serving both the React frontend and Express REST API from a single free URL) or as two separate services.

---

## Method 1: Single Unified Web Service (Recommended — 2 Minutes)

Because Express serves the compiled React application from `frontend/dist` with SPA fallback routing, you can deploy **both Frontend and Backend together under a single Render service**. This eliminates CORS issues and gives you a single URL (e.g. `https://flowcrm.onrender.com`).

### Step-by-Step Setup:

1. Push your latest code to GitHub:
   ```bash
   git push origin main
   ```

2. Log in to [Render Dashboard](https://dashboard.render.com/) and click **"New +" ➔ "Web Service"**.

3. Connect your GitHub repository (`ByteLounge/CRM`).

4. Configure the Web Service settings:
   - **Name:** `flowcrm`
   - **Region:** Any (e.g. `Oregon (US West)` or `Frankfurt (EU)`)
   - **Branch:** `main`
   - **Root Directory:** *(leave blank / repository root)*
   - **Runtime:** `Node`
   - **Build Command:**
     ```bash
     npm run install:all && npm run build
     ```
   - **Start Command:**
     ```bash
     npm start
     ```
   - **Instance Type:** `Free`

5. Add Environment Variables (under **Advanced ➔ Environment Variables**):

   | Key | Value | Description |
   |---|---|---|
   | `NODE_ENV` | `production` | Production mode |
   | `PORT` | `10000` | Render standard port |
   | `DATABASE_URL` | `postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres` | Supabase Postgres (or local SQLite if omitted) |
   | `SUPABASE_URL` | `https://[PROJECT-REF].supabase.co` | Supabase project URL |
   | `SUPABASE_ANON_KEY` | `your_supabase_anon_key` | Supabase public anon key |
   | `SUPABASE_SERVICE_ROLE_KEY` | `your_supabase_service_role_key` | Supabase service role secret |
   | `SUPABASE_JWT_SECRET` | `flowcrm-local-jwt-secret-key-32chars-min!` | JWT secret key |
   | `WOOCOMMERCE_MOCK_MODE` | `false` (or `true` if testing demo mode) | Store adapter driver |
   | `WOOCOMMERCE_STORE_URL` | `https://flowstore.local` | WooCommerce store URL |
   | `WOOCOMMERCE_CONSUMER_KEY` | `ck_your_consumer_key` | WooCommerce REST API key |
   | `WOOCOMMERCE_CONSUMER_SECRET` | `cs_your_consumer_secret` | WooCommerce REST API secret |
   | `WOOCOMMERCE_WEBHOOK_SECRET` | `flowcrm_webhook_secret_key_123` | HMAC webhook verification secret |
   | `GEMINI_API_KEY` | `your_gemini_api_key` | Google AI Gemini key |

6. Click **"Deploy Web Service"**.
   - Render will install dependencies, build the frontend (`frontend/dist`), compile TypeScript backend (`backend/dist`), and start the unified server.
   - When finished, Render gives you a live public URL (e.g. `https://flowcrm.onrender.com`).

---

## Method 2: Render Blueprint (Infrastructure-as-Code via `render.yaml`)

We have committed a [`render.yaml`](file:///D:/Projects/CRM/render.yaml) file to the repository root:

1. In [Render Dashboard](https://dashboard.render.com/), click **"New +" ➔ "Blueprint"**.
2. Select your repository `ByteLounge/CRM`.
3. Render will read [`render.yaml`](file:///D:/Projects/CRM/render.yaml) and automatically configure the build command, start command, and health check endpoint (`/api/health`).
4. Fill in the required environment secrets (Supabase keys, WooCommerce keys, Gemini API key).
5. Click **"Apply"** to deploy.

---

## Testing Your Live Deployment

Once deployed on Render:
1. Open your Render URL (`https://your-app.onrender.com`) in any browser or mobile device.
2. The login page will appear with the **Squares** animated background and **SpotlightCard**.
3. Click **"Instant 1-Click Demo Login"** to immediately access the dashboard without typing credentials.
4. Verify the 4 KPI metric cards count up smoothly with **React Bits CountUp**.
5. Test the **WooCommerce Sync** button in the header and review customer metrics.
