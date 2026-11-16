-- The Settings page (frontend/src/pages/SettingsPage.tsx) has always called
-- GET/PUT /api/teams/{teamId}/settings, but no backend storage for it ever
-- existed -- team only had (id, name, created_at). Add it as a JSONB blob
-- (same pattern as bot_flow.graph_json) rather than individual columns,
-- since the shape is a single opaque settings object owned entirely by the
-- frontend's WorkspaceSettings type, not something other backend code reads.
ALTER TABLE team ADD COLUMN settings_json JSONB;

UPDATE team
SET settings_json = jsonb_build_object(
    'workspaceName', name,
    'supportEmail', 'support@smartify.demo',
    'timezone', 'UTC',
    'channels', jsonb_build_object(
        'webchat', true,
        'whatsapp', true,
        'facebook', true,
        'browser', true
    ),
    'apiKey', 'demo-' || replace(id::text, '-', '')
)
WHERE settings_json IS NULL;

ALTER TABLE team ALTER COLUMN settings_json SET NOT NULL;
