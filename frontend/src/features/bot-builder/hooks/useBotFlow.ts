import { useCallback, useEffect, useRef } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  DEFAULT_FLOW_ID,
  fetchBotFlow,
  publishBotFlow,
  saveBotFlow,
  validateBotFlow,
  type FlowValidationError,
} from '../api/botFlowApi';
import { useFlowBuilderStore } from '../store/flowBuilderStore';
import type { BotFlow, BotFlowEdge, BotFlowNode } from '../types/botFlow';
import type { FlowCanvasEdge, FlowCanvasNode } from '../store/flowBuilderStore';

export class FlowValidationFailedError extends Error {
  constructor(public errors: FlowValidationError[]) {
    super('Bot flow failed validation');
    this.name = 'FlowValidationFailedError';
  }
}

function toCanvasNodes(nodes: BotFlowNode[]): FlowCanvasNode[] {
  return nodes.map((node) => ({
    id: node.id,
    type: node.type,
    position: node.position,
    data: node.data,
  }));
}

function conditionLabel(condition?: Record<string, unknown>): string | undefined {
  if (!condition) return undefined;
  const [key, value] = Object.entries(condition)[0] ?? [];
  return key ? `${key}: ${String(value)}` : undefined;
}

function toCanvasEdges(edges: BotFlowEdge[]): FlowCanvasEdge[] {
  return edges.map((edge) => ({
    id: edge.id,
    source: edge.source,
    target: edge.target,
    data: edge.condition ? { condition: edge.condition } : undefined,
    label: conditionLabel(edge.condition),
  }));
}

function toWireNodes(nodes: FlowCanvasNode[]): BotFlowNode[] {
  return nodes.map((node) => ({
    id: node.id,
    type: node.type!,
    position: node.position,
    data: node.data,
  }));
}

function toWireEdges(edges: FlowCanvasEdge[]): BotFlowEdge[] {
  return edges.map((edge) => ({
    id: edge.id,
    source: edge.source,
    target: edge.target,
    condition: edge.data?.condition,
  }));
}

/**
 * Loads a bot flow on mount into the Zustand `flowBuilderStore`, and
 * exposes `save`/`publish` actions that persist the current canvas state
 * through `GET/PUT/POST /api/bot-flows` (see `botFlowApi.ts`).
 */
export function useBotFlow(flowId: string = DEFAULT_FLOW_ID) {
  const queryClient = useQueryClient();
  const setFlow = useFlowBuilderStore((s) => s.setFlow);
  const markClean = useFlowBuilderStore((s) => s.markClean);
  const hasHydrated = useRef(false);

  const query = useQuery({
    queryKey: ['bot-flow', flowId],
    queryFn: () => fetchBotFlow(flowId),
    staleTime: 60_000,
  });

  useEffect(() => {
    if (query.data && !hasHydrated.current) {
      setFlow(
        toCanvasNodes(query.data.nodes),
        toCanvasEdges(query.data.edges),
        query.data.startNodeId,
      );
      hasHydrated.current = true;
    }
  }, [query.data, setFlow]);

  const buildCurrentFlow = useCallback((): BotFlow => {
    const { nodes, edges, startNodeId } = useFlowBuilderStore.getState();
    return {
      id: flowId,
      nodes: toWireNodes(nodes),
      edges: toWireEdges(edges),
      startNodeId: startNodeId ?? nodes[0]?.id ?? '',
    };
  }, [flowId]);

  const saveMutation = useMutation({
    mutationFn: () => saveBotFlow(buildCurrentFlow()),
    onSuccess: (data) => {
      queryClient.setQueryData(['bot-flow', flowId], data);
      markClean();
    },
  });

  const publishMutation = useMutation({
    mutationFn: async () => {
      const flow = buildCurrentFlow();
      const result = await validateBotFlow(flow);
      if (!result.valid) {
        throw new FlowValidationFailedError(result.errors);
      }
      await saveBotFlow(flow);
      return publishBotFlow(flow);
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['bot-flow', flowId], data);
      markClean();
    },
  });

  const validationErrors =
    publishMutation.error instanceof FlowValidationFailedError
      ? publishMutation.error.errors
      : null;

  return {
    flow: query.data,
    isLoading: query.isLoading,
    error: query.error,
    save: saveMutation.mutate,
    isSaving: saveMutation.isPending,
    publish: publishMutation.mutate,
    isPublishing: publishMutation.isPending,
    publishError: publishMutation.error,
    validationErrors,
  };
}
