import { create } from 'zustand';
import type { Connection, Edge, EdgeChange, Node, NodeChange } from '@xyflow/react';
import { applyEdgeChanges, applyNodeChanges } from '@xyflow/react';
import type { BotNodeConfig, BotNodeData, BotNodeType } from '../types/botFlow';

/** React Flow's `Node`/`Edge` generics, parametrized with our bot-flow data shape. */
export type FlowCanvasNode = Node<BotNodeData, BotNodeType>;
export type FlowCanvasEdge = Edge<{ condition?: Record<string, unknown> }>;

let idCounter = 1;
function nextId(prefix: string) {
  idCounter += 1;
  return `${prefix}-${Date.now()}-${idCounter}`;
}

interface FlowBuilderState {
  nodes: FlowCanvasNode[];
  edges: FlowCanvasEdge[];
  startNodeId: string | null;
  selectedNodeId: string | null;
  isDirty: boolean;

  setFlow: (nodes: FlowCanvasNode[], edges: FlowCanvasEdge[], startNodeId: string) => void;
  onNodesChange: (changes: NodeChange<FlowCanvasNode>[]) => void;
  onEdgesChange: (changes: EdgeChange<FlowCanvasEdge>[]) => void;
  onConnect: (connection: Connection) => void;
  addNode: (type: BotNodeType, position?: { x: number; y: number }) => string;
  updateNodeConfig: (nodeId: string, config: Partial<BotNodeConfig>) => void;
  removeNode: (nodeId: string) => void;
  setSelectedNodeId: (nodeId: string | null) => void;
  markClean: () => void;
}

const NODE_LABELS: Record<BotNodeType, string> = {
  welcomeMessage: 'Welcome Message',
  intentClassification: 'Intent Classification',
  textBlock: 'Text Block',
  quickReplies: 'Quick Replies',
  apiCall: 'API Call',
  aiResponse: 'AI Response',
  directToAgent: 'Direct to Agent',
};

/** Required fields per type so a freshly-added node already validates
 * against the Python engine's strict Pydantic discriminated union —
 * see `app/workflows/flow_schema.py`. */
function defaultConfigFor(type: BotNodeType): BotNodeConfig {
  const base: BotNodeConfig = { type, label: NODE_LABELS[type] };
  switch (type) {
    case 'welcomeMessage':
    case 'textBlock':
      return { ...base, text: 'New message' };
    case 'intentClassification':
      return { ...base, intents: ['sales_inquiry', 'technical_support'] };
    case 'quickReplies':
      return { ...base, text: 'Did that answer your question?', options: ['Yes', 'No'] };
    case 'apiCall':
      return { ...base, url: 'https://example.com/api', method: 'GET' };
    case 'aiResponse':
      return { ...base, promptTemplate: 'answer_with_rag' };
    case 'directToAgent':
      return { ...base, reason: 'user_requested' };
    default:
      return base;
  }
}

export const useFlowBuilderStore = create<FlowBuilderState>((set, get) => ({
  nodes: [],
  edges: [],
  startNodeId: null,
  selectedNodeId: null,
  isDirty: false,

  setFlow: (nodes, edges, startNodeId) =>
    set({ nodes, edges, startNodeId, isDirty: false, selectedNodeId: null }),

  onNodesChange: (changes) => {
    set((state) => ({
      nodes: applyNodeChanges(changes, state.nodes),
      isDirty: true,
    }));
  },

  onEdgesChange: (changes) => {
    set((state) => ({
      edges: applyEdgeChanges(changes, state.edges),
      isDirty: true,
    }));
  },

  onConnect: (connection) => {
    if (!connection.source || !connection.target) return;
    const newEdge: FlowCanvasEdge = {
      id: nextId('edge'),
      source: connection.source,
      target: connection.target,
    };
    set((state) => ({ edges: [...state.edges, newEdge], isDirty: true }));
  },

  addNode: (type, position) => {
    const id = nextId('node');
    const existing = get().nodes;
    const basePosition = position ?? {
      x: 360 + (existing.length % 4) * 60,
      y: 520 + Math.floor(existing.length / 4) * 140,
    };
    const newNode: FlowCanvasNode = {
      id,
      type,
      position: basePosition,
      data: {
        config: defaultConfigFor(type),
      },
    };
    set((state) => ({ nodes: [...state.nodes, newNode], isDirty: true }));
    return id;
  },

  updateNodeConfig: (nodeId, config) => {
    set((state) => ({
      nodes: state.nodes.map((node) =>
        node.id === nodeId
          ? { ...node, data: { config: { ...node.data.config, ...config } } }
          : node,
      ),
      isDirty: true,
    }));
  },

  removeNode: (nodeId) => {
    set((state) => ({
      nodes: state.nodes.filter((node) => node.id !== nodeId),
      edges: state.edges.filter((edge) => edge.source !== nodeId && edge.target !== nodeId),
      selectedNodeId: state.selectedNodeId === nodeId ? null : state.selectedNodeId,
      isDirty: true,
    }));
  },

  setSelectedNodeId: (nodeId) => set({ selectedNodeId: nodeId }),

  markClean: () => set({ isDirty: false }),
}));
