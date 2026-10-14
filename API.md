# FlowCRM — REST API Specification

FlowCRM exposes a structured RESTful API under the `/api/v1` namespace.

All requests accept and return `application/json`.
Authentication is passed via the `Authorization: Bearer <jwt>` header and tenant context via `X-Organisation-ID: <org_id>`.

---

## 1. Health & System Status

### `GET /api/health`
Returns system health, uptime, and integration mode.

**Response `200 OK`**:
```json
{
  "status": "ok",
  "service": "FlowCRM API",
  "timestamp": "2026-10-14T10:00:00.000Z",
  "uptime": 124.5,
  "mockMode": true
}
```

---

## 2. Authentication Module

### `POST /api/v1/auth/login`
Authenticates user and returns JWT token and organization context.

**Request**:
```json
{
  "email": "operator@flowcrm.store",
  "password": "optional_demo_password"
}
```

**Response `200 OK`**:
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "user_demo_01",
    "email": "operator@flowcrm.store",
    "role": "owner"
  },
  "organisation": {
    "id": "org_default_01",
    "name": "FlowCRM Flagship Store"
  }
}
```

### `GET /api/v1/auth/me`
Retrieves current user identity, active organization, and accessible organizations.

---

## 3. Customer Management Module

### `GET /api/v1/customers`
Retrieves paginated customer directory with search and segment filtering.

**Query Parameters**:
- `search` (string): Search query against first name, last name, email, phone.
- `segment` (enum): `new` | `repeat` | `high_value` | `inactive`.
- `sortBy` (enum): `created_at` | `total_spent` | `total_orders` | `last_order_at` | `first_name`.
- `sortOrder` (enum): `asc` | `desc`.
- `limit` (int, default 20).
- `offset` (int, default 0).

**Response `200 OK`**:
```json
{
  "customers": [
    {
      "id": "6a3f95b5-27a9-4509-a720-6395b0b30be7",
      "organisation_id": "org_default_01",
      "external_customer_id": 101,
      "first_name": "Elena",
      "last_name": "Rostova",
      "email": "elena.rostova@example.com",
      "phone": "+1 (206) 555-0192",
      "total_orders": 2,
      "total_spent": 765.00,
      "currency": "USD",
      "segment": "high_value",
      "is_guest": false,
      "last_order_at": "2026-10-10T09:30:00Z"
    }
  ],
  "total": 6,
  "limit": 20,
  "offset": 0
}
```

### `GET /api/v1/customers/:id`
Retrieves full Customer 360 profile, including contact details, addresses, order history, internal notes, and logged communications.

### `POST /api/v1/customers/:id/notes`
Adds an internal team note to the customer profile.

**Request**:
```json
{
  "content": "Customer requested expedited shipping on all future electronics orders."
}
```

### `DELETE /api/v1/customers/:id/notes/:noteId`
Deletes an internal customer note.

---

## 4. Order Tracking Module

### `GET /api/v1/orders`
Retrieves orders with customer cross-links and status filtering.

**Query Parameters**:
- `customerId` (string): Filter orders by specific customer.
- `status` (enum): `completed` | `processing` | `on-hold` | `refunded` | `cancelled` | `failed`.
- `search` (string): Search order number or customer name/email.
- `limit` (int), `offset` (int).

### `GET /api/v1/orders/:id`
Retrieves order details with itemized line items, unit prices, totals, and WooCommerce status reflection.

---

## 5. Communication Workflows Module

### `GET /api/v1/communications`
Retrieves communication feed with status and customer filters.

**Query Parameters**:
- `status` (enum): `draft` | `pending_approval` | `approved` | `sent` | `failed`.
- `customerId` (string).

### `POST /api/v1/communications`
Creates a communication record in `draft` or `pending_approval` status.

**Request**:
```json
{
  "customerId": "6a3f95b5-27a9-4509-a720-6395b0b30be7",
  "purpose": "thank_you",
  "subject": "Thank you for your recent order, Elena!",
  "message": "Dear Elena, thank you for your ongoing support of our store...",
  "status": "pending_approval",
  "generatedByAi": true
}
```

### `PATCH /api/v1/communications/:id/status`
Transitions a communication record through the approval lifecycle.

**Request**:
```json
{
  "status": "approved"
}
```

---

## 6. FlowAI — Customer Intelligence Assistant

### `POST /api/v1/ai/insights`
Generates grounded behavioral summary, churn risk diagnosis, and recommended operator action.

**Request**:
```json
{
  "customerId": "6a3f95b5-27a9-4509-a720-6395b0b30be7"
}
```

**Response `200 OK`**:
```json
{
  "summary": "Elena has completed 2 orders for a lifetime value of $765.00, with their last order placed 4 days ago.",
  "churnRisk": "low",
  "churnReason": "Customer purchased recently (4 days ago).",
  "recommendedAction": "Acknowledge VIP status and offer sneak peeks at upcoming catalog releases.",
  "keyMetrics": {
    "totalOrders": 2,
    "totalSpent": 765.00,
    "averageOrderValue": 382.50,
    "daysSinceLastOrder": 4,
    "segment": "high_value"
  }
}
```

### `POST /api/v1/ai/generate-communication`
Generates contextual personalized communication drafts grounded in customer history.

### `POST /api/v1/ai/retention-scan`
Executes autonomous heuristic retention scan across customer database. Identifies churning customers with diagnosis, tailored retention incentives, and auto-generated recovery drafts.

---

## 7. WooCommerce Integration

### `GET /api/v1/integrations/woocommerce/status`
Returns integration connection status, operating driver (`Live` or `Demo Mode`), store URL, and last sync timestamp.

### `POST /api/v1/integrations/woocommerce/test`
Validates WooCommerce REST API credentials.

### `POST /api/v1/integrations/woocommerce/settings`
Updates WooCommerce credentials or toggles `isMock` mode.

### `POST /api/v1/integrations/woocommerce/sync`
Triggers full idempotent synchronisation of customers, orders, and aggregate metric recalculations.

### `POST /api/v1/integrations/woocommerce/webhook`
Public webhook endpoint validating `X-WC-Webhook-Signature` HMAC-SHA256 headers. Processes `order.created`, `order.updated`, `customer.created`, and `customer.updated` idempotently.
