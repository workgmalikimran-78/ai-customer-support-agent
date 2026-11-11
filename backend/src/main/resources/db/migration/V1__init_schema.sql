-- Smartify support platform initial schema

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE team (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE app_user (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id UUID NOT NULL REFERENCES team(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    display_name VARCHAR(255) NOT NULL,
    avatar_url VARCHAR(1024),
    role VARCHAR(32) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_app_user_email UNIQUE (email)
);

CREATE INDEX idx_app_user_team_id ON app_user(team_id);

CREATE TABLE channel (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type VARCHAR(32) NOT NULL,
    display_name VARCHAR(255) NOT NULL,
    config JSONB,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE contact (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    channel_id UUID NOT NULL REFERENCES channel(id) ON DELETE CASCADE,
    external_id VARCHAR(255) NOT NULL,
    display_name VARCHAR(255),
    avatar_url VARCHAR(1024),
    email VARCHAR(255),
    phone VARCHAR(64),
    metadata JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_contact_channel_external UNIQUE (channel_id, external_id)
);

CREATE TABLE bot_flow (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(32) NOT NULL,
    version INT NOT NULL DEFAULT 1,
    graph_json JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE conversation (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contact_id UUID NOT NULL REFERENCES contact(id) ON DELETE CASCADE,
    channel_id UUID NOT NULL REFERENCES channel(id) ON DELETE CASCADE,
    assigned_user_id UUID REFERENCES app_user(id) ON DELETE SET NULL,
    bot_flow_id UUID REFERENCES bot_flow(id) ON DELETE SET NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'OPEN',
    current_node_id VARCHAR(255),
    session_variables JSONB,
    unread_count INT NOT NULL DEFAULT 0,
    last_message_preview VARCHAR(512),
    last_message_at TIMESTAMPTZ,
    sentiment_score DOUBLE PRECISION,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_conversation_status_last_message_at ON conversation(status, last_message_at);
CREATE INDEX idx_conversation_contact_id ON conversation(contact_id);
CREATE INDEX idx_conversation_channel_id ON conversation(channel_id);
CREATE INDEX idx_conversation_assigned_user_id ON conversation(assigned_user_id);

CREATE TABLE message (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES conversation(id) ON DELETE CASCADE,
    sender VARCHAR(32) NOT NULL,
    content TEXT NOT NULL,
    attachment_url VARCHAR(1024),
    node_id VARCHAR(255),
    metadata JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_message_conversation_id_created_at ON message(conversation_id, created_at);

CREATE TABLE analytics_snapshot (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    metric_type VARCHAR(64) NOT NULL,
    value DOUBLE PRECISION NOT NULL,
    target_value DOUBLE PRECISION,
    bucket_timestamp TIMESTAMPTZ NOT NULL,
    granularity VARCHAR(16) NOT NULL,
    dimensions JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_analytics_snapshot_metric_type_bucket_timestamp ON analytics_snapshot(metric_type, bucket_timestamp);

CREATE TABLE alert (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id UUID NOT NULL REFERENCES team(id) ON DELETE CASCADE,
    type VARCHAR(64) NOT NULL,
    severity VARCHAR(16) NOT NULL,
    message TEXT NOT NULL,
    occurred_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    metadata JSONB
);

CREATE INDEX idx_alert_team_id_occurred_at ON alert(team_id, occurred_at);
