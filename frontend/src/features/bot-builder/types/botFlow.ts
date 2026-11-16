/**
 * Shared bot-flow JSON shape. This MUST stay in sync field-for-field with
 * what the Python (FastAPI) and Java (Spring Boot) services expect:
 *
 *   {
 *     nodes: [{ id, type, position: { x, y }, data: { config: {...} } }],
 *     edges: [{ id, source, target, condition? }],
 *     startNodeId
 *   }
 *
 * Do not rename these fields.
 */

export type BotNodeType =
  | 'welcomeMessage'
  | 'intentClassification'
  | 'textBlock'
  | 'quickReplies'
  | 'apiCall'
  | 'aiResponse'
  | 'directToAgent';

export interface BotNodePosition {
  x: number;
  y: number;
}

export interface BotNodeConfig {
  /** Discriminator the Python flow engine's Pydantic union keys on — must
   * equal the parent node's `type`, or `/v1/flows/execute` will reject it. */
  type?: BotNodeType;
  label?: string;
  text?: string;
  intents?: string[];
  options?: string[];
  url?: string;
  method?: string;
  headers?: Record<string, string>;
  body?: Record<string, unknown>;
  timeoutSeconds?: number;
  promptTemplate?: string;
  reason?: string;
  [key: string]: unknown;
}

export interface BotNodeData {
  config: BotNodeConfig;
  /** Render-only hint set by `BotFlowCanvas` from `startNodeId`, never part of the
   * wire format -- `toWireNodes`/the store never set this field themselves. */
  isStart?: boolean;
  /** Index signature so this shape satisfies React Flow's `Node<T>` constraint
   * (`T extends Record<string, unknown>`) without losing the named `config` field. */
  [key: string]: unknown;
}

export interface BotFlowNode {
  id: string;
  type: BotNodeType;
  position: BotNodePosition;
  data: BotNodeData;
}

export interface BotFlowEdge {
  id: string;
  source: string;
  target: string;
  /** e.g. `{ intent: "sales_inquiry" }` or `{ quickReply: "Yes" }` — must be
   * an object, not a string, to match the Python engine's `Dict[str, Any]`. */
  condition?: Record<string, unknown>;
}

export interface BotFlow {
  id?: string;
  name?: string;
  nodes: BotFlowNode[];
  edges: BotFlowEdge[];
  startNodeId: string;
}

/**
 * `BotFlowNode`/`BotFlowEdge` above are the plain wire-format shape shared
 * with the backend. `FlowCanvasNode`/`FlowCanvasEdge` (declared in
 * `store/flowBuilderStore.ts` usage sites) are React Flow's own `Node`/`Edge`
 * generics parametrized with `BotNodeData`, used only for rendering —
 * they carry the same `id`/`type`/`position`/`data` fields so converting
 * between the two is a no-op cast, not a data transformation.
 */
