-- Replaces the demo bot flow's graph with a fuller example that exercises every
-- node type (welcomeMessage, intentClassification, textBlock, apiCall,
-- aiResponse, quickReplies, directToAgent) and demonstrates branching via edge
-- conditions, so there's something real to look at and edit in the Chatbot
-- Builder. Keeps node ids n1/n2 stable since the demo conversation seeded by
-- V2 (id 00000000-0000-0000-0000-000000000040) references bot_flow_id
-- 00000000-0000-0000-0000-000000000020 with current_node_id = 'n2'; changing
-- those ids out from under it would break that conversation's next turn.
-- Status is reset to DRAFT so Publish must be clicked deliberately after review.
UPDATE bot_flow
SET
    status = 'DRAFT',
    version = version + 1,
    graph_json = '{
        "startNodeId": "n1",
        "nodes": [
            {"id": "n1", "type": "welcomeMessage", "position": {"x": 0, "y": 200},
             "data": {"config": {"type": "welcomeMessage", "text": "Hi there! Welcome to Smartify Support. How can I help you today?"}}},
            {"id": "n2", "type": "intentClassification", "position": {"x": 280, "y": 200},
             "data": {"config": {"type": "intentClassification", "intents": ["sales_inquiry", "technical_support", "billing_issue"]}}},
            {"id": "n3", "type": "textBlock", "position": {"x": 600, "y": 0},
             "data": {"config": {"type": "textBlock", "text": "Our plans start at $29/mo for Starter, $99/mo for Growth, and custom pricing for Enterprise."}}},
            {"id": "n4", "type": "apiCall", "position": {"x": 600, "y": 200},
             "data": {"config": {"type": "apiCall", "url": "/internal/kb/technical-support", "method": "GET"}}},
            {"id": "n8", "type": "directToAgent", "position": {"x": 600, "y": 420},
             "data": {"config": {"type": "directToAgent", "reason": "billing_dispute"}}},
            {"id": "n7", "type": "aiResponse", "position": {"x": 900, "y": 200},
             "data": {"config": {"type": "aiResponse", "promptTemplate": "answer_with_rag"}}},
            {"id": "n5", "type": "quickReplies", "position": {"x": 1200, "y": 100},
             "data": {"config": {"type": "quickReplies", "text": "Was this helpful?", "options": ["Yes", "No, escalate"]}}},
            {"id": "n6", "type": "directToAgent", "position": {"x": 1500, "y": 100},
             "data": {"config": {"type": "directToAgent", "reason": "user_requested"}}}
        ],
        "edges": [
            {"id": "e1", "source": "n1", "target": "n2"},
            {"id": "e2", "source": "n2", "target": "n3", "condition": {"intent": "sales_inquiry"}},
            {"id": "e3", "source": "n2", "target": "n4", "condition": {"intent": "technical_support"}},
            {"id": "e4", "source": "n2", "target": "n8", "condition": {"intent": "billing_issue"}},
            {"id": "e5", "source": "n3", "target": "n5"},
            {"id": "e6", "source": "n4", "target": "n7"},
            {"id": "e7", "source": "n7", "target": "n5"},
            {"id": "e8", "source": "n5", "target": "n2", "condition": {"quickReply": "Yes"}},
            {"id": "e9", "source": "n5", "target": "n6", "condition": {"quickReply": "No, escalate"}}
        ]
    }'::jsonb,
    updated_at = now()
WHERE id = '00000000-0000-0000-0000-000000000020';
