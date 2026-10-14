# FlowCRM — Intelligent Customer Relationship Management for WooCommerce

[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18.3-61dafb.svg)](https://reactjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-20+-green.svg)](https://nodejs.org/)
[![Tests](https://img.shields.io/badge/Tests-10%20Passed-emerald.svg)](https://vitest.dev/)
[![Status](https://img.shields.io/badge/Status-Production--Ready%20MVP-indigo.svg)]()

> Developed for the four-hour placement hackathon organised by **Kilowott**.
> 
> **Challenge:** "Analyse, design, and implement a Customer Relationship Management system that integrates with WooCommerce."
> **Mandatory Requirements:** 1. Customer data management | 2. Order tracking | 3. Communication workflows

---

## 1. Executive Summary & Problem Statement

E-commerce businesses running on WooCommerce store vital transactional data in WordPress, but WooCommerce lacks dedicated Customer Relationship Management capabilities:
- Customers churn without notice because purchase intervals are not tracked.
- High-value buyers are buried in transactional order lists.
- Customer support operators lack a single-pane-of-glass Customer 360 profile.
- Outreach is repetitive and lacks grounded context.

**FlowCRM** solves this by unifying customer data, order histories, deterministic segmentation, draft-and-approval communications, and server-side AI intelligence into a cohesive, production-grade B2B SaaS application.

---

## 2. Key Features

### 🛒 Dual-Mode WooCommerce Integration
- **Live REST API v3 Integration**: Authenticated HTTPS client connecting to `/wp-json/wc/v3/customers` and `/wp-json/wc/v3/orders` with pagination, timeout resilience, and rate-limiting retry logic.
- **Realistic Mock Adapter [DEMO MODE]**: High-fidelity simulated store with real product line items, diverse customer behavior profiles, repeat buyers, churn candidates, and guest orders.
- **Idempotent Synchronisation Engine**: Prevents duplicate records on repeated syncs.
- **Guest Checkout Reconciliation**: Associates guest orders by billing email and creates tagged guest customer profiles.
- **Cryptographic Webhooks**: Verified HMAC-SHA256 signature receiver for real-time `order.created`, `order.updated`, `customer.created`, `customer.updated` events.

### 👥 Customer 360 & Deterministic Segmentation
- Full-text search across names, emails, and phone numbers.
- Customer 360 Profile: Contact info, billing/shipping addresses, purchase timeline, and internal notes CRUD.
- Deterministic customer segments:
  - **New**: 1 order placed within the last 30 days.
  - **Repeat**: 2 or more completed orders.
  - **High-Value**: Lifetime spend exceeding $500.00.
  - **Inactive**: Over 60 days since last purchase.

### 📦 Order Tracking & Inspection
- Filterable order registry with WooCommerce status badges.
- Order Details Modal displaying line items, quantities, unit prices, totals, currency, and payment channels.
- Authoritative upstream principle: WooCommerce remains the source of truth for order statuses.

### ✉️ Communication Draft & Approval Workflows
- Multi-purpose composer: Order Follow-up, Thank-You Message, Customer Re-engagement, Support Response.
- Strict human-in-the-loop lifecycle: `draft` → `pending_approval` → `approved` → `sent`.
- Explicit audit logging for every approval action.

### 🤖 FlowAI — Customer Intelligence Assistant
- **Capability A (Customer Insights)**: Grounded behavioral summaries and churn risk diagnostics based strictly on verified purchase data.
- **Capability B (Personalized Communication Generator)**: Contextual draft generator respecting customer name, recent order, and purpose.
- **Capability C (Autonomous Retention Agent)**: Heuristic scan identifying inactive high-value buyers, diagnosing churn risk, formulating targeted recovery offers, and auto-drafting messages for 1-click human approval.

---

## 3. Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 18, TypeScript, Vite, Tailwind CSS, Lucide React, React Router v6, TanStack Query, Recharts |
| **Backend** | Node.js, TypeScript, Express.js, Zod validation, JWT authentication, Axios |
| **Database** | PostgreSQL / Supabase, SQL Migrations, embedded SQLite local fallback |
| **Integration** | WooCommerce REST API v3, HMAC-SHA256 Webhooks, WooCommerce Mock Adapter |
| **AI** | Server-side Gemini API integration + Grounded Heuristic Intelligence Engine |
| **Testing** | Vitest, Supertest |

---

## 4. Quick Start & Installation

### Prerequisites
- Node.js v18+ (tested on Node v20/v24)
- npm v9+

### 1. Clone & Install Dependencies
```bash
# Clone the repository
git clone <repository-url>
cd CRM

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install

# Return to root
cd ..
```

### 2. Environment Configuration
Copy the provided `.env.example` file:
```bash
cp .env.example .env
```
*(By default, `WOOCOMMERCE_MOCK_MODE=true` is enabled, allowing instant evaluation with rich demo data and zero external dependencies).*

### 3. Run Automated Tests
```bash
npm run test
```
*Executes all 10 unit and integration tests verifying multi-tenancy, idempotency, guest checkout reconciliation, and FlowAI schemas.*

### 4. Start Development Servers
Run backend and frontend concurrently:

```bash
# In terminal 1: Start backend server (runs on http://localhost:4000)
npm run dev:backend

# In terminal 2: Start frontend client (runs on http://localhost:5173)
npm run dev:frontend
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 5. Live WooCommerce Store Connection Guide

To connect FlowCRM to a live WooCommerce WordPress store:

1. In WordPress Admin, go to **WooCommerce → Settings → Advanced → REST API**.
2. Click **Add Key**, name it `FlowCRM`, set permissions to **Read/Write**, and generate API credentials.
3. In FlowCRM, navigate to **Integrations** in the sidebar.
4. Select **LIVE MODE (Connect Real WooCommerce Store)**.
5. Enter your **Store URL**, **Consumer Key** (`ck_...`), and **Consumer Secret** (`cs_...`).
6. Click **Test API Connection** to verify connectivity.
7. Click **Run Full Ingestion Sync** to import your live store customers and orders!

### Webhook Setup (Optional Real-Time Ingestion)
1. In WooCommerce, go to **WooCommerce → Settings → Advanced → Webhooks → Add Webhook**.
2. Set Status to **Active**.
3. Set Topic to **Order created** (and create additional webhooks for **Order updated**, **Customer created**).
4. Set Delivery URL to: `https://your-domain.com/api/v1/integrations/woocommerce/webhook`
5. Enter your Webhook Secret matching `WOOCOMMERCE_WEBHOOK_SECRET` in `.env`.

---

## 6. Project Structure

```
CRM/
├── backend/
│   ├── src/
│   │   ├── app.ts                  # Express setup, CORS, webhook raw body
│   │   ├── server.ts               # Server entry point & auto-seed
│   │   ├── config/env.ts           # Zod-validated environment config
│   │   ├── db/                     # DB client (Postgres & SQLite fallback)
│   │   ├── middleware/             # Auth, validation, error handler
│   │   ├── modules/
│   │   │   ├── auth/               # Supabase JWT & session management
│   │   │   ├── customers/          # Directory, Customer 360, Notes CRUD
│   │   │   ├── orders/             # Order list, items, status mapping
│   │   │   ├── communications/     # Draft-and-approval lifecycle
│   │   │   ├── integrations/       # WooCommerce Live REST & Mock adapters
│   │   │   ├── analytics/          # KPI aggregates & Recharts trends
│   │   │   └── ai/                 # FlowAI intelligence & retention agent
│   │   ├── repositories/           # Abstract database repository layer
│   │   ├── types/                  # Domain models & WooCommerce schemas
│   │   └── utils/                  # Structured logger & cryptographic tools
│   └── tests/api.test.ts           # Comprehensive Vitest/Supertest test suite
├── frontend/
│   ├── src/
│   │   ├── App.tsx                 # Router & TanStack Query client
│   │   ├── components/layout/      # Sidebar, Header, AppLayout
│   │   ├── components/ui/          # Reusable Card, Badge, Button, Dialog
│   │   ├── pages/                  # Overview, Customers, Orders, AI, Comms
│   │   ├── services/api.ts         # Typed Axios client
│   │   └── types/crm.ts            # Frontend TypeScript types
├── docs/                           # Architectural diagrams and plans
├── PLAN.md                         # Phased 4-hour execution roadmap
├── ARCHITECTURE.md                 # System architecture with Mermaid diagrams
├── API.md                          # Complete RESTful API specification
├── ASSUMPTIONS.md                  # Domain and design decisions
└── AI_USAGE.md                     # Transparent AI collaboration log
```

---

## 7. Automated Test Verification

Run tests from the repository root:
```bash
npm run test
```

Test suite coverage:
1. `GET /api/health`: Health status and mock mode reporting.
2. `WooCommerce sync idempotency`: Repeated syncs do not duplicate customer or order records.
3. `Guest checkout reconciliation`: Guest orders linked via email without ID collisions.
4. `Multi-tenant isolation`: Strict verification that Tenant B cannot access Tenant A data.
5. `Customer directory search`: Live search by customer name, email, or phone.
6. `Order details and line items`: Ordered product itemization and price calculations.
7. `Communication lifecycle`: Transitions from `draft` to `approved` with operator audit trail.
8. `FlowAI customer insights`: Strict schema validation on grounded metrics.
9. `FlowAI retention scan`: Autonomous detection of churning customer opportunities.
10. `Webhook signature verification`: HMAC-SHA256 signature validation with timing-safe comparison.

---

## 8. License

MIT License. Developed for Kilowott Placement Hackathon.
