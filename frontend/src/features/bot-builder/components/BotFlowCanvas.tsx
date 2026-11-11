import { useCallback, useMemo } from 'react';
import {
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  ReactFlow,
  type Connection,
  type EdgeChange,
  type NodeChange,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useFlowBuilderStore } from '../store/flowBuilderStore';
import { botFlowNodeTypes } from './nodes';
import { AddElementMenu } from './AddElementMenu';
import { NodeConfigDrawer } from './NodeConfigDrawer';
import styles from './BotFlowCanvas.module.css';

export function BotFlowCanvas() {
  const nodes = useFlowBuilderStore((s) => s.nodes);
  const edges = useFlowBuilderStore((s) => s.edges);
  const onNodesChangeStore = useFlowBuilderStore((s) => s.onNodesChange);
  const onEdgesChangeStore = useFlowBuilderStore((s) => s.onEdgesChange);
  const onConnectStore = useFlowBuilderStore((s) => s.onConnect);
  const setSelectedNodeId = useFlowBuilderStore((s) => s.setSelectedNodeId);

  const nodeTypes = useMemo(() => botFlowNodeTypes, []);

  const handleNodesChange = useCallback(
    (changes: NodeChange[]) => onNodesChangeStore(changes as any),
    [onNodesChangeStore],
  );
  const handleEdgesChange = useCallback(
    (changes: EdgeChange[]) => onEdgesChangeStore(changes as any),
    [onEdgesChangeStore],
  );
  const handleConnect = useCallback(
    (connection: Connection) => onConnectStore(connection),
    [onConnectStore],
  );

  return (
    <div className={styles.canvasWrap}>
      <div className={styles.toolbar}>
        <AddElementMenu />
      </div>
      <NodeConfigDrawer />
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodesChange={handleNodesChange}
        onEdgesChange={handleEdgesChange}
        onConnect={handleConnect}
        onNodeClick={(_, node) => setSelectedNodeId(node.id)}
        onPaneClick={() => setSelectedNodeId(null)}
        defaultEdgeOptions={{ type: 'smoothstep', animated: false }}
        fitView
        colorMode="dark"
      >
        <Background variant={BackgroundVariant.Dots} color="#3a3156" gap={18} size={1} />
        <Controls showInteractive={false} />
        <MiniMap
          pannable
          zoomable
          style={{ background: '#171226', border: '1px solid rgba(139,92,246,0.2)' }}
          maskColor="rgba(15,11,26,0.6)"
          nodeColor="#8b5cf6"
        />
      </ReactFlow>
    </div>
  );
}
