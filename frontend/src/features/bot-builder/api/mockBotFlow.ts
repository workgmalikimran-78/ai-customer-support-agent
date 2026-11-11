import type { BotFlow } from '../types/botFlow';

export const DEFAULT_FLOW_ID = 'flow-default-1';

/**
 * Mirrors the sample flow seeded in the Spring Boot backend
 * (`V2__seed_demo_data.sql`) and the Python test fixture
 * (`tests/fixtures/sample_flow_graph.json`) so the three services agree
 * on what "the" default flow looks like. Field names must match
 * `app/workflows/flow_schema.py` exactly (`url` not `endpoint`,
 * `promptTemplate` not `prompt`, `intents`, `reason`, and a `type`
 * discriminator on every node's config).
 */
export const MOCK_BOT_FLOW: BotFlow = {
  id: DEFAULT_FLOW_ID,
  name: 'Default Support Flow',
  startNodeId: 'welcome-1',
  nodes: [
    {
      id: 'welcome-1',
      type: 'welcomeMessage',
      position: { x: 40, y: 180 },
      data: {
        config: {
          type: 'welcomeMessage',
          label: 'Welcome Message',
          text: "Hi there! 👋 I'm Smartify AI. How can I help you today?",
        },
      },
    },
    {
      id: 'intent-1',
      type: 'intentClassification',
      position: { x: 360, y: 180 },
      data: {
        config: {
          type: 'intentClassification',
          label: 'Intent Classification',
          intents: ['sales_inquiry', 'technical_support'],
        },
      },
    },
    {
      id: 'sales-1',
      type: 'textBlock',
      position: { x: 680, y: 40 },
      data: {
        config: {
          type: 'textBlock',
          label: 'Sales Inquiry',
          text: 'Great! Let me help you with pricing and plans.',
        },
      },
    },
    {
      id: 'pricing-1',
      type: 'apiCall',
      position: { x: 1000, y: 40 },
      data: {
        config: {
          type: 'apiCall',
          label: 'Show Pricing',
          url: '/api/pricing/plans',
          method: 'GET',
        },
      },
    },
    {
      id: 'support-1',
      type: 'textBlock',
      position: { x: 680, y: 260 },
      data: {
        config: {
          type: 'textBlock',
          label: 'Technical Support',
          text: 'Sorry to hear that! Let me pull up some troubleshooting steps.',
        },
      },
    },
    {
      id: 'troubleshoot-1',
      type: 'aiResponse',
      position: { x: 1000, y: 260 },
      data: {
        config: {
          type: 'aiResponse',
          label: 'Troubleshooting Guide',
          promptTemplate: 'Generate step-by-step troubleshooting guidance for the reported issue.',
        },
      },
    },
    {
      id: 'agent-1',
      type: 'directToAgent',
      position: { x: 680, y: 420 },
      data: {
        config: {
          type: 'directToAgent',
          label: 'Direct to Agent',
          reason: 'user_requested',
        },
      },
    },
  ],
  edges: [
    { id: 'e-welcome-intent', source: 'welcome-1', target: 'intent-1' },
    {
      id: 'e-intent-sales',
      source: 'intent-1',
      target: 'sales-1',
      condition: { intent: 'sales_inquiry' },
    },
    {
      id: 'e-intent-support',
      source: 'intent-1',
      target: 'support-1',
      condition: { intent: 'technical_support' },
    },
    { id: 'e-sales-pricing', source: 'sales-1', target: 'pricing-1' },
    { id: 'e-support-troubleshoot', source: 'support-1', target: 'troubleshoot-1' },
  ],
};
