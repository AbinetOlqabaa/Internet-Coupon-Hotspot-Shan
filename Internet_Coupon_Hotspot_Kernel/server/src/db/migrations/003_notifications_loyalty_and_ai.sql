-- Migration 003: Notifications, Customer Loyalty & AI Provider Registry
-- Completes PostgreSQL schema parity with server entity models and contracts.

-- 1. Multi-channel Notifications
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_id UUID NOT NULL REFERENCES owners(id) ON DELETE CASCADE,
    recipient_type VARCHAR(32) NOT NULL,
    recipient_id VARCHAR(128) NOT NULL,
    channel VARCHAR(32) NOT NULL,
    template VARCHAR(64) NOT NULL,
    title VARCHAR(128) NOT NULL,
    message VARCHAR(500) NOT NULL,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    status VARCHAR(32) NOT NULL DEFAULT 'pending',
    delivery_attempts INTEGER NOT NULL DEFAULT 0,
    max_attempts INTEGER NOT NULL DEFAULT 3,
    last_attempt_at TIMESTAMPTZ,
    delivered_at TIMESTAMPTZ,
    read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_owner_status ON notifications(owner_id, status);
CREATE INDEX IF NOT EXISTS idx_notifications_recipient ON notifications(recipient_id);

-- 2. Customer Loyalty Badges
CREATE TABLE IF NOT EXISTS loyalty_badges (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_id UUID NOT NULL REFERENCES owners(id) ON DELETE CASCADE,
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    badge_code VARCHAR(64) NOT NULL,
    name VARCHAR(128) NOT NULL,
    criteria_evidence JSONB NOT NULL DEFAULT '{}'::jsonb,
    awarded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_loyalty_badges_owner_cust ON loyalty_badges(owner_id, customer_id);

-- 3. Owner-Bounded Bonus Grants
CREATE TABLE IF NOT EXISTS bonus_grants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_id UUID NOT NULL REFERENCES owners(id) ON DELETE CASCADE,
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    bonus_type VARCHAR(32) NOT NULL,
    amount_units INTEGER NOT NULL CHECK (amount_units > 0),
    budget_deduction_minor INTEGER NOT NULL CHECK (budget_deduction_minor >= 0),
    currency VARCHAR(3) NOT NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'active',
    expires_at TIMESTAMPTZ NOT NULL,
    claimed_at TIMESTAMPTZ,
    audit_reason TEXT NOT NULL,
    created_by VARCHAR(128) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_bonus_grants_owner_cust ON bonus_grants(owner_id, customer_id);

-- 4. AI Provider Configurations & Privacy-Preserving Registry
CREATE TABLE IF NOT EXISTS ai_providers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_id UUID NOT NULL REFERENCES owners(id) ON DELETE CASCADE,
    provider VARCHAR(32) NOT NULL,
    model VARCHAR(128) NOT NULL,
    type VARCHAR(32) NOT NULL DEFAULT 'hosted',
    endpoint TEXT,
    api_key_encrypted TEXT,
    masked_key VARCHAR(64) NOT NULL DEFAULT 'none',
    capabilities JSONB NOT NULL DEFAULT '["chat", "summarization", "forecast", "anomalies"]'::jsonb,
    is_free_tier BOOLEAN NOT NULL DEFAULT TRUE,
    priority INTEGER NOT NULL DEFAULT 1,
    enabled BOOLEAN NOT NULL DEFAULT TRUE,
    timeout_ms INTEGER NOT NULL DEFAULT 8000,
    monthly_budget_cents INTEGER NOT NULL DEFAULT 0,
    current_spend_cents INTEGER NOT NULL DEFAULT 0,
    health VARCHAR(32) NOT NULL DEFAULT 'healthy',
    quota_evidence JSONB NOT NULL DEFAULT '{"source": "estimated"}'::jsonb,
    privacy_policy JSONB NOT NULL DEFAULT '{"allowTelemetry": true, "redactCustomerPii": true}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_providers_owner_prio ON ai_providers(owner_id, priority);
