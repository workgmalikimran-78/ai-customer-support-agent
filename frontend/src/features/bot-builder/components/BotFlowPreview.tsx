import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Background, BackgroundVariant, ReactFlow } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { DEFAULT_FLOW_ID, fetchBotFlow } from '../api/botFlowApi';
import { toCanvasEdges, toCanvasNodes } from '../hooks/useBotFlow';
import { botFlowNodeTypes } from './nodes';
import styles from './BotFlowPreview.module.css';

/**
 * Read-only glance at the published bot flow for the Dashboard. Deliberately
 * does not use the editable BotFlowCanvas/useBotFlow/flowBuilderStore combo --
 * that store is shared globally, so loading into it here could either show a
 * blank canvas (never hydrated) or clobber unsaved edits if the real builder
 * is open elsewhere. This fetches and converts independently instead.
 */
export function BotFlowPreview() {
  const { data, isLoading } = useQuery({
    queryKey: ['bot-flow', DEFAULT_FLOW_ID],
    queryFn: () => fetchBotFlow(DEFAULT_FLOW_ID),
    staleTime: 60_000,
  });

  const nodes = useMemo(() => (data ? toCanvasNodes(data.nodes) : []), [data]);
  const edges = useMemo(() => (data ? toCanvasEdges(data.edges) : []), [data]);
  const nodeTypes = useMemo(() => botFlowNodeTypes, []);

  if (isLoading) {
    return <div className={styles.loading}>Loading flow…</div>;
  }

  return (
    <div className={styles.previewWrap}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable={false}
        panOnDrag
        zoomOnScroll
        proOptions={{ hideAttribution: true }}
        fitView
        colorMode="dark"
      >
        <Background variant={BackgroundVariant.Dots} color="#3a3156" gap={18} size={1} />
      </ReactFlow>
    </div>
  );
}
