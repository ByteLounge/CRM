# FlowCRM — Architecture Documentation

## 1. System Architecture Overview

FlowCRM is built as a production-oriented modular monolith. It provides a full-stack, multi-tenant B2B SaaS architecture designed specifically for WooCommerce store operators. It reconciles e-commerce transactional data with customer relationship management, deterministic segmentation, draft-and-approval communication workflows, and server-side artificial intelligence.

```mermaid
flowchart TD
    subgraph Client ["Frontend Single-Page App (React 18 + Vite)"]
        UI["Modern Enterprise UI (Tailwind CSS)"]
        Router["React Router v6"]
        QueryClient["TanStack Query (Cache & State)"]
        Views["Views: Overview, Customers, Orders, Comms, FlowAI, Integrations"]
    end

    subgraph Server ["Backend Application (Node.js + Express + TypeScript)"]
        ApiRouter["RESTful API Gateway (/api/v1/*)"]
        AuthMid["Auth & Tenant Isolation Middleware (JWT)"]
        ZodVal["Zod Request Validation Pipeline"]
        
        subgraph DomainModules ["Domain Modules"]
            CustMod["Customer Module (CRUD, Notes, Segments)"]
            OrdMod["Order Module (Items, Status reflection)"]
            CommMod["Communications Module (Draft & Approval Lifecycle)"]
            AnalyticsMod["Analytics Module (Aggregations, Trends)"]
            AIMod["FlowAI Module (Insights & Retention Agent)"]
        end

        subgraph IntegrationService ["WooCommerce Integration Service"]
            SyncEngine["Sync Engine & Ingestion Worker"]
            AdapterFactory["Adapter Driver Factory"]
            WCLive["WooCommerce REST v3 Adapter (HTTPS Basic Auth)"]
            WCMock["WooCommerce Mock Adapter (DEMO MODE)"]
            WebhookVerifier["HMAC-SHA256 Webhook Verifier"]
        end

        Repo["Database Repository Layer (UUIDs, JSONB, Aggregates)"]
    end

    subgraph Persistence ["Persistence Layer"]
        PG["PostgreSQL / Supabase (Primary)"]
        SQLite["Embedded SQLite (Local / Offline Fallback)"]
    end

    subgraph ExternalServices ["External Cloud Services"]
        WooStore["WooCommerce Store (Remote REST API v3)"]
        GeminiAPI["Google Gemini LLM (Server-side only)"]
    end

    UI --> Router
    Router --> Views
    Views --> QueryClient
    QueryClient -->|HTTP / JSON| ApiRouter

    ApiRouter --> ZodVal
    ZodVal --> AuthMid
    AuthMid --> DomainModules
    AuthMid --> IntegrationService

    DomainModules --> Repo
    IntegrationService --> Repo
    IntegrationService --> AdapterFactory
    AdapterFactory --> WCLive
    AdapterFactory --> WCMock

    WCLive -.->|REST / HTTPS| WooStore
    WooStore -.->|Webhooks| WebhookVerifier
    WebhookVerifier --> SyncEngine
    AIMod -.->|Server-side REST| GeminiAPI

    Repo --> PG
    Repo --> SQLite
```

---

## 2. Multi-Tenant Organization Isolation

Every CRM entity belongs strictly to an `organisation_id`:
- Authentication tokens (Supabase JWT or developer JWT) carry the user's `userId`, `email`, and `orgId`.
- The `requireAuth` middleware verifies the token and validates that the user is an active member of `organisation_members` for the target organization.
- Cross-tenant queries are blocked at the repository layer where every database query requires `WHERE organisation_id = $1`.
- Requests attempting to read or write data belonging to another tenant fail with HTTP 401/403.

---

## 3. Relational Database Design

The schema is composed of 10 relational tables:

```mermaid
erDiagram
    ORGANISATIONS ||--o{ ORGANISATION_MEMBERS : has
    ORGANISATIONS ||--o{ INTEGRATIONS : configures
    ORGANISATIONS ||--o{ CUSTOMERS : owns
    ORGANISATIONS ||--o{ ORDERS : records
    ORGANISATIONS ||--o{ COMMUNICATIONS : dispatches
    ORGANISATIONS ||--o{ CUSTOMER_NOTES : stores
    ORGANISATIONS ||--o{ ACTIVITY_LOGS : records
    ORGANISATIONS ||--o{ SYNC_LOGS : tracks

    CUSTOMERS ||--o{ ORDERS : places
    CUSTOMERS ||--o{ COMMUNICATIONS : receives
    CUSTOMERS ||--o{ CUSTOMER_NOTES : annotates

    ORDERS ||--o{ ORDER_ITEMS : contains
    ORDERS ||--o{ COMMUNICATIONS : references

    ORGANISATIONS {
        uuid id PK
        varchar name
        timestamptz created_at
        timestamptz updated_at
    }

    CUSTOMERS {
        uuid id PK
        uuid organisation_id FK
        bigint external_customer_id
        varchar first_name
        varchar last_name
        varchar email
        varchar phone
        jsonb billing_address
        jsonb shipping_address
        int total_orders
        decimal total_spent
        varchar currency
        varchar segment
        boolean is_guest
        timestamptz last_order_at
    }

    ORDERS {
        uuid id PK
        uuid organisation_id FK
        bigint external_order_id
        uuid customer_id FK
        varchar order_number
        varchar status
        varchar currency
        decimal total_amount
        varchar payment_method
        timestamptz placed_at
    }

    ORDER_ITEMS {
        uuid id PK
        uuid order_id FK
        bigint external_product_id
        varchar product_name
        int quantity
        decimal unit_price
        decimal total_price
    }

    COMMUNICATIONS {
        uuid id PK
        uuid organisation_id FK
        uuid customer_id FK
        uuid order_id FK
        varchar channel
        varchar purpose
        varchar subject
        text message
        varchar status
        boolean generated_by_ai
        varchar approved_by
        timestamptz approved_at
    }
```

---

## 4. WooCommerce Integration Engine

### Dual-Mode Architecture
1. **Live REST API v3 Adapter (`WooCommerceRestAdapter`)**:
   - Communicates over authenticated HTTPS with `/wp-json/wc/v3/customers` and `/wp-json/wc/v3/orders`.
   - Handles pagination via `page` and `per_page` query parameters and `X-WP-Total` response headers.
   - Resilient retry on HTTP 429 (Rate Limiting).
2. **Mock Adapter (`WooCommerceMockAdapter` [DEMO MODE])**:
   - Zero-dependency realistic mock store that generates real e-commerce line items, varying order statuses, repeat customers, churn risks, and guest checkouts.
   - Matches the official WooCommerce REST API v3 schema.

### Ingestion & Idempotent Upsert Workflow
```mermaid
sequenceDiagram
    autonumber
    actor Operator as CRM Operator
    participant UI as FlowCRM Frontend
    participant API as WooCommerce Service
    participant Adapter as WooCommerce Adapter
    participant Repo as Database Repository

    Operator->>UI: Click "Sync WooCommerce"
    UI->>API: POST /api/v1/integrations/woocommerce/sync
    API->>Repo: Create sync_log (status: in_progress)
    
    API->>Adapter: fetchCustomers(page, perPage)
    Adapter-->>API: WC Customers Array
    API->>Repo: Upsert customers (match by external_id or email)
    
    API->>Adapter: fetchOrders(page, perPage)
    Adapter-->>API: WC Orders Array
    loop Each Order
        API->>Repo: Match customer by WC ID or billing email
        alt Customer Exists
            API->>Repo: Link order to customer
        else Guest Checkout
            API->>Repo: Create guest customer profile (is_guest: true)
        end
        API->>Repo: Upsert order & replace order_items
        API->>Repo: Recalculate customer aggregate metrics & segment
    end

    API->>Repo: Update integration last_sync_at & sync_log completed
    API-->>UI: Return counts: { customersSynced, ordersSynced }
    UI-->>Operator: Display success notification
```

---

## 5. FlowAI — Customer Intelligence Assistant

The AI architecture enforces strict business rules:
- **Server-side execution only**: Credentials never reach the browser.
- **Strictly Grounded**: Summaries are generated exclusively from verified purchase frequencies, intervals, and monetary values.
- **Human-in-the-Loop**: Generated drafts require explicit operator approval before transition to `approved` or `sent`.
- **Heuristic Fallback**: Operates reliably even without third-party API keys.

```mermaid
flowchart TD
    Trigger["Operator or Autonomous Scan Trigger"] --> FetchData["Fetch Customer Purchase Data & Metrics"]
    FetchData --> Heuristic["Deterministic Metrics (Days Inactive, LTV, AOV)"]
    Heuristic --> LLMChoice{"Gemini API Key Available?"}
    LLMChoice -- Yes --> GeminiCall["Gemini 1.5 Flash (Structured JSON prompt)"]
    LLMChoice -- No --> DeterministicEngine["Deterministic Grounded Intelligence Engine"]
    GeminiCall --> ZodParse["Zod Schema Validation"]
    DeterministicEngine --> ZodParse
    ZodParse --> HumanApproval["Presented in CRM for Operator Review & Approval"]
    HumanApproval --> Saved["Persisted with Audit Trail in communications"]
```
