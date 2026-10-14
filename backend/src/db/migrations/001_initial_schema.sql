-- ============================================================================
-- FlowCRM Database Schema Migration (PostgreSQL / Supabase compatible)
-- 001_initial_schema.sql
-- ============================================================================

-- Enable UUID extension if not already present
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. organisations
CREATE TABLE IF NOT EXISTS organisations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. organisation_members
CREATE TABLE IF NOT EXISTS organisation_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organisation_id UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
    user_id VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'member', -- 'owner', 'admin', 'member'
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(organisation_id, user_id)
);

-- 3. integrations
CREATE TABLE IF NOT EXISTS integrations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organisation_id UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
    provider VARCHAR(50) NOT NULL DEFAULT 'woocommerce',
    store_url TEXT NOT NULL,
    encrypted_credentials JSONB NOT NULL DEFAULT '{}'::jsonb,
    connection_status VARCHAR(50) NOT NULL DEFAULT 'disconnected', -- 'connected', 'disconnected', 'error', 'demo'
    last_sync_at TIMESTAMPTZ NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(organisation_id, provider)
);

-- 4. customers
CREATE TABLE IF NOT EXISTS customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organisation_id UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
    external_customer_id BIGINT NULL,
    first_name VARCHAR(150) NOT NULL DEFAULT '',
    last_name VARCHAR(150) NOT NULL DEFAULT '',
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(100) NULL,
    billing_address JSONB NOT NULL DEFAULT '{}'::jsonb,
    shipping_address JSONB NOT NULL DEFAULT '{}'::jsonb,
    total_orders INTEGER NOT NULL DEFAULT 0,
    total_spent DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    currency VARCHAR(10) NOT NULL DEFAULT 'USD',
    segment VARCHAR(50) NOT NULL DEFAULT 'new', -- 'new', 'repeat', 'high_value', 'inactive'
    is_guest BOOLEAN NOT NULL DEFAULT FALSE,
    last_order_at TIMESTAMPTZ NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Partial unique constraint: unique external_customer_id per organization if present
CREATE UNIQUE INDEX IF NOT EXISTS idx_customers_org_external_id 
    ON customers (organisation_id, external_customer_id) 
    WHERE external_customer_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_customers_org_email 
    ON customers (organisation_id, email);

CREATE INDEX IF NOT EXISTS idx_customers_org_segment 
    ON customers (organisation_id, segment);

CREATE INDEX IF NOT EXISTS idx_customers_org_total_spent 
    ON customers (organisation_id, total_spent DESC);

-- 5. orders
CREATE TABLE IF NOT EXISTS orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organisation_id UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
    external_order_id BIGINT NOT NULL,
    customer_id UUID NULL REFERENCES customers(id) ON DELETE SET NULL,
    order_number VARCHAR(100) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'pending', -- 'pending', 'processing', 'on-hold', 'completed', 'cancelled', 'refunded', 'failed'
    currency VARCHAR(10) NOT NULL DEFAULT 'USD',
    total_amount DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    payment_method VARCHAR(100) NOT NULL DEFAULT 'unknown',
    placed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(organisation_id, external_order_id)
);

CREATE INDEX IF NOT EXISTS idx_orders_org_customer 
    ON orders (organisation_id, customer_id);

CREATE INDEX IF NOT EXISTS idx_orders_org_placed_at 
    ON orders (organisation_id, placed_at DESC);

CREATE INDEX IF NOT EXISTS idx_orders_org_status 
    ON orders (organisation_id, status);

-- 6. order_items
CREATE TABLE IF NOT EXISTS order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    external_product_id BIGINT NULL,
    product_name VARCHAR(255) NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    unit_price DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    total_price DECIMAL(12, 2) NOT NULL DEFAULT 0.00
);

CREATE INDEX IF NOT EXISTS idx_order_items_order_id 
    ON order_items (order_id);

-- 7. communications
CREATE TABLE IF NOT EXISTS communications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organisation_id UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    order_id UUID NULL REFERENCES orders(id) ON DELETE SET NULL,
    channel VARCHAR(50) NOT NULL DEFAULT 'email', -- 'email', 'sms', 'note'
    purpose VARCHAR(100) NOT NULL DEFAULT 'general', -- 'order_followup', 'thank_you', 'customer_reengagement', 'support_response'
    subject VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'draft', -- 'draft', 'pending_approval', 'approved', 'sent', 'failed'
    generated_by_ai BOOLEAN NOT NULL DEFAULT FALSE,
    approved_by VARCHAR(255) NULL,
    approved_at TIMESTAMPTZ NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_comms_org_customer 
    ON communications (organisation_id, customer_id);

CREATE INDEX IF NOT EXISTS idx_comms_org_status 
    ON communications (organisation_id, status);

-- 8. customer_notes
CREATE TABLE IF NOT EXISTS customer_notes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organisation_id UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    author_id VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notes_customer 
    ON customer_notes (customer_id);

-- 9. activity_logs
CREATE TABLE IF NOT EXISTS activity_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organisation_id UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
    actor_id VARCHAR(255) NOT NULL,
    entity_type VARCHAR(50) NOT NULL, -- 'customer', 'order', 'communication', 'sync', 'integration'
    entity_id VARCHAR(255) NOT NULL,
    action VARCHAR(100) NOT NULL, -- 'created', 'updated', 'synced', 'approved', 'sent'
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_activity_org_created 
    ON activity_logs (organisation_id, created_at DESC);

-- 10. sync_logs
CREATE TABLE IF NOT EXISTS sync_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organisation_id UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
    integration_id UUID NULL REFERENCES integrations(id) ON DELETE SET NULL,
    sync_type VARCHAR(50) NOT NULL DEFAULT 'full', -- 'full', 'customers', 'orders', 'webhook'
    status VARCHAR(50) NOT NULL DEFAULT 'in_progress', -- 'in_progress', 'completed', 'failed'
    records_processed INTEGER NOT NULL DEFAULT 0,
    error_message TEXT NULL,
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ NULL
);

CREATE INDEX IF NOT EXISTS idx_sync_logs_org 
    ON sync_logs (organisation_id, started_at DESC);
