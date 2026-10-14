# FlowCRM — AI-Assisted Development Log & Decisions

This document transparently records how artificial intelligence was utilized across planning, architecture, component design, implementation, debugging, and verification for FlowCRM.

---

## 1. Development Decisions & AI Collaboration Log

### Decision 1: Database Persistence Strategy for Hackathon Evaluation
- **Problem Encountered**: The challenge specification requires Supabase PostgreSQL and migrations, but local evaluation environments may not have active Docker daemons, pre-configured cloud Supabase credentials, or network connectivity during evaluation.
- **AI-Assisted Recommendation**: Implement an abstract Repository Layer with dual drivers: a PostgreSQL driver for live Supabase deployment and an embedded SQLite driver for offline local execution that initializes the relational schema automatically.
- **Chosen Solution**: Created `src/db/client.ts` with transparent database client abstraction supporting both PostgreSQL connection strings and local WAL-mode SQLite storage.
- **Reason for Choosing It**: Guarantees zero-friction evaluation; examiners can clone and run `npm run dev` immediately without cloud setup.
- **Verification Performed**: Verified through automated Vitest test suite executing full schema migrations and complex relational queries.

---

### Decision 2: Handling Positional Parameters Across SQLite & Postgres
- **Problem Encountered**: During automated test execution, the customer search query failed with `Too few parameter values were provided` when converting Postgres positional parameters (`$1, $2, ...`) into SQLite placeholders.
- **AI-Assisted Recommendation**: Rather than blindly replacing `$1` with anonymous `?` (which duplicates when the same parameter is reused in `OR` clauses), map `$1, $2` to named parameter objects (`@p1, @p2`) supported natively by SQLite.
- **Chosen Solution**: Updated `SQLiteDatabaseClient` to bind named parameters `@p1, @p2` using a mapped parameter object.
- **Reason for Choosing It**: Allows complex search clauses (e.g. `LOWER(first_name) LIKE $2 OR LOWER(last_name) LIKE $2`) to reuse parameters cleanly across both engines.
- **Verification Performed**: Automated test `Customer directory search should filter by name or email` passed immediately with 100% test suite pass rate.

---

### Decision 3: Reconciliation of WooCommerce Guest Checkouts
- **Problem Encountered**: WooCommerce orders placed by guest customers have `customer_id = 0`, which would violate foreign key constraints or orphan orders if only registered accounts were imported.
- **AI-Assisted Recommendation**: Match guest orders by billing email. If a customer account exists with that email, associate the order; if not, create a guest profile tagged with `is_guest: true`.
- **Chosen Solution**: Built email reconciliation in `WooCommerceService.upsertWcOrder`.
- **Reason for Choosing It**: Prevents order data loss, aggregates guest customer lifetime spend accurately, and keeps data clean.
- **Verification Performed**: Automated test `Guest checkout orders should create a guest customer without ID collision` verified the behavior.

---

### Decision 4: Deterministic Grounding & Safety for FlowAI
- **Problem Encountered**: LLMs can hallucinate customer behavior, invent previous purchases, or draft inappropriate customer promises.
- **AI-Assisted Recommendation**: Ground all AI prompts strictly in verified customer metrics (recency in days, monetary value, purchase count). Validate LLM responses with strict Zod schemas and require explicit human operator approval before any message can be marked as `approved` or `sent`.
- **Chosen Solution**: Implemented Zod response schemas (`customerInsightsResponseSchema`, `generateCommunicationResponseSchema`, `retentionOpportunitySchema`) and enforced draft-and-approval status lifecycle.
- **Reason for Choosing It**: Production B2B SaaS applications cannot permit unrestricted autonomous customer communication.
- **Verification Performed**: Tested schema adherence in Vitest and tested the interactive human approval buttons in the frontend UI.

---

## 2. Summary of AI Tools Used

| Phase | AI Role | Deliverables & Impact |
|---|---|---|
| **Phase 1: Planning** | System Architect | Generated `PLAN.md`, finalized MVP scope, designed 10 relational tables. |
| **Phase 2: Backend & Sync** | Backend Engineer | Scaffolding, TypeScript interfaces, WooCommerce Live & Mock adapters, sync engine. |
| **Phase 3: Frontend & UI** | Full-Stack UI/UX | Built responsive B2B SaaS dashboard, Recharts visualizations, Customer 360 profile, Order tracking drawer, FlowAI panel. |
| **Phase 4: Testing & Hardening** | QA Engineer | Generated Supertest & Vitest test suites, resolved parameter binding edge cases, verified production build. |
| **Phase 5: Documentation** | Technical Writer | Authored `README.md`, `ARCHITECTURE.md`, `API.md`, `ASSUMPTIONS.md`, `AI_USAGE.md`. |
