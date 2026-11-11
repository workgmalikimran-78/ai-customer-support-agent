# Data Model

Postgres (owned by `backend/`) is the system of record. The Python `app/` service owns no database — it reads/writes these shapes only in transit, over the API described in [api-contracts.md](api-contracts.md).

| Entity | Key fields |
|---|---|
| `Channel` | `type` (WEB_CHAT / WHATSAPP / FACEBOOK_MESSENGER), `displayName`, `config` (JSONB), `isActive` |
| `Contact` | `channelId` FK, `externalId`, `displayName`, `avatarUrl`, `email`, `phone`, `metadata` (JSONB) |
| `Conversation` | `contactId` FK, `channelId` FK, `assignedUserId` FK (nullable), `botFlowId` FK (nullable), `status` (OPEN/PENDING/RESOLVED/ESCALATED), `currentNodeId`, `sessionVariables` (JSONB), `unreadCount`, `lastMessagePreview`, `lastMessageAt`, `sentimentScore` |
| `Message` | `conversationId` FK, `sender` (CUSTOMER/AI/AGENT/SYSTEM), `content`, `attachmentUrl`, `nodeId`, `metadata` (JSONB) |
| `BotFlow` | `name`, `description`, `status` (DRAFT/PUBLISHED/ARCHIVED), `version`, `graphJson` (JSONB — React Flow `{nodes, edges, startNodeId}`) |
| `AnalyticsSnapshot` | `metricType`, `value`, `targetValue`, `bucketTimestamp`, `granularity` (MINUTE/HOUR/DAY), `dimensions` (JSONB) |
| `Alert` | `type`, `severity` (INFO/WARNING/CRITICAL), `message`, `occurredAt`, `isRead`, `metadata` (JSONB) |
| `User` | `teamId` FK, `email`, `passwordHash`, `displayName`, `role` (ADMIN/MANAGER/AGENT), `isActive` |
| `Team` | `name` |

Notable indexes: `conversation(status, last_message_at)`, `message(conversation_id, created_at)`, `analytics_snapshot(metric_type, bucket_timestamp)`, unique `contact(channel_id, external_id)`.

Schema source of truth: [`backend/src/main/resources/db/migration/V1__init_schema.sql`](../backend/src/main/resources/db/migration/V1__init_schema.sql).
