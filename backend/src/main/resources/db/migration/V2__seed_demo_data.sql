-- Seed demo data: one team, one admin user, a few channels, a demo contact/conversation/
-- message thread, and the reference bot flow shared with the Python and React agents.

-- Demo team
INSERT INTO team (id, name, created_at)
VALUES ('00000000-0000-0000-0000-000000000001', 'Smartify Demo Team', now());

-- Demo admin user. Password is "password123" (BCrypt-hashed below).
INSERT INTO app_user (id, team_id, email, password_hash, display_name, role, is_active, created_at, updated_at)
VALUES (
    '00000000-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000001',
    'admin@smartify.demo',
    '$2a$10$yOTfutbKl/Ovs2TPjoURkeG0lv.nWMQuSwCRpVWwOnndmIc9WZeAu',
    'Demo Admin',
    'ADMIN',
    TRUE,
    now(),
    now()
);

-- Channels
INSERT INTO channel (id, type, display_name, config, is_active, created_at, updated_at)
VALUES
    ('00000000-0000-0000-0000-000000000010', 'WEB_CHAT', 'Web Chat Widget', '{}'::jsonb, TRUE, now(), now()),
    ('00000000-0000-0000-0000-000000000011', 'WHATSAPP', 'WhatsApp Business', '{}'::jsonb, TRUE, now(), now()),
    ('00000000-0000-0000-0000-000000000012', 'FACEBOOK_MESSENGER', 'Facebook Messenger', '{}'::jsonb, TRUE, now(), now());

-- Sample bot flow matching the reference example shared across the Python/React agents.
INSERT INTO bot_flow (id, name, description, status, version, graph_json, created_at, updated_at)
VALUES (
    '00000000-0000-0000-0000-000000000020',
    'Sales & Support Triage',
    'Welcomes the customer, classifies intent, and routes to pricing info or technical support with an escalation fallback.',
    'PUBLISHED',
    1,
    '{
        "startNodeId": "n1",
        "nodes": [
            {"id": "n1", "type": "welcomeMessage", "position": {"x": 0, "y": 0},
             "data": {"config": {"type": "welcomeMessage", "text": "Hi there! How can I help you today?"}}},
            {"id": "n2", "type": "intentClassification", "position": {"x": 250, "y": 0},
             "data": {"config": {"type": "intentClassification", "intents": ["sales_inquiry", "technical_support"]}}},
            {"id": "n3", "type": "textBlock", "position": {"x": 500, "y": -100},
             "data": {"config": {"type": "textBlock", "text": "Here is our pricing..."}}},
            {"id": "n4", "type": "apiCall", "position": {"x": 500, "y": 100},
             "data": {"config": {"type": "apiCall", "url": "/internal/kb/technical-support", "method": "GET"}}},
            {"id": "n5", "type": "quickReplies", "position": {"x": 750, "y": 0},
             "data": {"config": {"type": "quickReplies", "text": "Was this helpful?", "options": ["Yes", "No, escalate"]}}},
            {"id": "n6", "type": "directToAgent", "position": {"x": 1000, "y": 0},
             "data": {"config": {"type": "directToAgent", "reason": "user_requested"}}}
        ],
        "edges": [
            {"id": "e1", "source": "n1", "target": "n2"},
            {"id": "e2", "source": "n2", "target": "n3", "condition": {"intent": "sales_inquiry"}},
            {"id": "e3", "source": "n2", "target": "n4", "condition": {"intent": "technical_support"}},
            {"id": "e4", "source": "n4", "target": "n5"},
            {"id": "e5", "source": "n5", "target": "n6", "condition": {"quickReply": "No, escalate"}}
        ]
    }'::jsonb,
    now(),
    now()
);

-- Demo contacts
INSERT INTO contact (id, channel_id, external_id, display_name, avatar_url, email, phone, metadata, created_at, updated_at)
VALUES
    (
        '00000000-0000-0000-0000-000000000030',
        '00000000-0000-0000-0000-000000000010',
        'web-visitor-1001',
        'Jordan Lee',
        NULL,
        'jordan.lee@example.com',
        NULL,
        '{}'::jsonb,
        now(),
        now()
    ),
    (
        '00000000-0000-0000-0000-000000000031',
        '00000000-0000-0000-0000-000000000011',
        'whatsapp-5551234567',
        'Amara Okafor',
        NULL,
        NULL,
        '+15551234567',
        '{}'::jsonb,
        now(),
        now()
    );

-- Demo conversations
INSERT INTO conversation (
    id, contact_id, channel_id, assigned_user_id, bot_flow_id, status, current_node_id,
    session_variables, unread_count, last_message_preview, last_message_at, sentiment_score,
    created_at, updated_at
)
VALUES
    (
        '00000000-0000-0000-0000-000000000040',
        '00000000-0000-0000-0000-000000000030',
        '00000000-0000-0000-0000-000000000010',
        NULL,
        '00000000-0000-0000-0000-000000000020',
        'OPEN',
        'n2',
        '{}'::jsonb,
        1,
        'Hi, I would like to know more about your pricing plans.',
        now() - interval '5 minutes',
        0.4,
        now() - interval '10 minutes',
        now() - interval '5 minutes'
    ),
    (
        '00000000-0000-0000-0000-000000000041',
        '00000000-0000-0000-0000-000000000031',
        '00000000-0000-0000-0000-000000000011',
        '00000000-0000-0000-0000-000000000002',
        NULL,
        'ESCALATED',
        NULL,
        '{}'::jsonb,
        2,
        'My last order has not arrived and I need a refund.',
        now() - interval '2 minutes',
        -0.6,
        now() - interval '30 minutes',
        now() - interval '2 minutes'
    );

-- Demo messages
INSERT INTO message (id, conversation_id, sender, content, attachment_url, node_id, metadata, created_at)
VALUES
    (
        '00000000-0000-0000-0000-000000000050',
        '00000000-0000-0000-0000-000000000040',
        'CUSTOMER',
        'Hi, I would like to know more about your pricing plans.',
        NULL,
        NULL,
        NULL,
        now() - interval '10 minutes'
    ),
    (
        '00000000-0000-0000-0000-000000000051',
        '00000000-0000-0000-0000-000000000040',
        'AI',
        'Hi there! How can I help you today?',
        NULL,
        'n1',
        NULL,
        now() - interval '9 minutes'
    ),
    (
        '00000000-0000-0000-0000-000000000052',
        '00000000-0000-0000-0000-000000000040',
        'CUSTOMER',
        'I am interested in the enterprise plan.',
        NULL,
        NULL,
        NULL,
        now() - interval '5 minutes'
    ),
    (
        '00000000-0000-0000-0000-000000000060',
        '00000000-0000-0000-0000-000000000041',
        'CUSTOMER',
        'My last order has not arrived and I need a refund.',
        NULL,
        NULL,
        NULL,
        now() - interval '30 minutes'
    ),
    (
        '00000000-0000-0000-0000-000000000061',
        '00000000-0000-0000-0000-000000000041',
        'SYSTEM',
        'Conversation escalated to a human agent.',
        NULL,
        NULL,
        NULL,
        now() - interval '28 minutes'
    ),
    (
        '00000000-0000-0000-0000-000000000062',
        '00000000-0000-0000-0000-000000000041',
        'AGENT',
        'I am sorry to hear that - let me look into your order right away.',
        NULL,
        NULL,
        NULL,
        now() - interval '2 minutes'
    );
