# FlowCRM — Architectural Assumptions & Design Decisions

This document outlines the core technical assumptions and architectural decisions made during the design and implementation of FlowCRM.

---

## 1. Multi-Tenancy & Data Model

- **Organization Scoping**: All CRM records (customers, orders, communications, notes, integrations) belong strictly to an `organisation_id`. In an enterprise B2B SaaS context, multiple store operators or franchisees must never access another store's proprietary customer data or transaction histories.
- **Role Hierarchy**: Roles are defined as `owner`, `admin`, and `member`. Any member can view directory records and compose drafts, but only authorized users can approve customer-facing communications.

---

## 2. WooCommerce Integration & Data Authority

- **WooCommerce as Source of Truth**: For external entity state (such as Order Status or Customer billing addresses), WooCommerce is the authoritative upstream source of truth. FlowCRM avoids local mutations that falsely claim an external WooCommerce order status has changed.
- **Guest Checkout Orders**: In WooCommerce stores, customers frequently place orders as guests (`customer_id = 0`). FlowCRM reconciles guest orders by matching the billing email address. If no customer exists with that email, FlowCRM creates a guest customer record flagged with `is_guest = true`, preventing order orphan issues while maintaining data integrity.
- **Idempotency**: Synchronisation operations use upsert logic based on `(organisation_id, external_customer_id)` and `(organisation_id, external_order_id)` unique constraints. Repeated sync runs never duplicate records.
- **Currency Handling**: Monetary amounts are stored as exact decimal values with source currency codes (e.g., `USD`, `EUR`) preserved on orders and customer aggregates.

---

## 3. Database Persistence Strategy

- **Relational PostgreSQL Schema**: The production schema adheres to standard PostgreSQL with 10 tables, foreign key constraints, JSONB attributes, and indexes on frequently queried columns.
- **Zero-Dependency Local Engine**: To guarantee 100% runnable evaluation out-of-the-box (even without pre-provisioned cloud Supabase credentials or Docker engines), the repository layer seamlessly falls back to an embedded SQLite engine with identical relational tables and behavior.

---

## 4. FlowAI Principles & Guardrails

- **Zero Hallucination Grounding**: FlowAI generates insights and behavioral summaries strictly from structured customer metrics (purchase frequency, interval in days, total spend, recent order lines). It does not speculate or fabricate customer preferences or demographic information.
- **Mandatory Human-in-the-Loop**: Customer communications strictly adhere to the draft-and-approval lifecycle (`draft` → `pending_approval` → `approved` → `sent`). The AI retention agent formulates suggested messages, but human approval is mandatory before any communication is dispatched.
- **Resilient Fallback**: If external LLM API keys (Gemini) are absent or third-party networks time out, FlowAI utilizes a deterministic grounded heuristic intelligence engine, guaranteeing uninterrupted CRM operation.
