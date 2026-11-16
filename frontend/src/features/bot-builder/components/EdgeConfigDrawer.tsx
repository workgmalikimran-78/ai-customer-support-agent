import { useState } from 'react';
import { Button, Input, Select } from '@/components/ui';
import { useFlowBuilderStore, type FlowCanvasNode } from '../store/flowBuilderStore';
import styles from './NodeConfigDrawer.module.css';

const NO_CONDITION_VALUE = '__none__';

const NODE_TYPE_LABELS: Record<string, string> = {
  welcomeMessage: 'Welcome Message',
  intentClassification: 'Intent Classification',
  textBlock: 'Text Block',
  quickReplies: 'Quick Replies',
  apiCall: 'API Call',
  aiResponse: 'AI Response',
  directToAgent: 'Direct to Agent',
};

function nodeLabel(node: FlowCanvasNode | undefined, fallback: string) {
  return node?.data.config.label ?? (node?.type ? NODE_TYPE_LABELS[node.type] : undefined) ?? fallback;
}

/**
 * Side panel for editing the `condition` on the currently selected canvas edge.
 * Branching node types (intentClassification, quickReplies) get a dropdown of their
 * own declared values so the condition key/value always lines up with what the flow
 * engine actually compares against (see `_select_next_edge` in `app/workflows/flow_engine.py`).
 * Any other source type falls back to a free-form key/value condition.
 */
export function EdgeConfigDrawer() {
  const selectedEdgeId = useFlowBuilderStore((s) => s.selectedEdgeId);
  const edge = useFlowBuilderStore((s) => s.edges.find((e) => e.id === s.selectedEdgeId));
  const sourceNode = useFlowBuilderStore((s) => s.nodes.find((n) => n.id === edge?.source));
  const targetNode = useFlowBuilderStore((s) => s.nodes.find((n) => n.id === edge?.target));
  const updateEdgeCondition = useFlowBuilderStore((s) => s.updateEdgeCondition);
  const removeEdge = useFlowBuilderStore((s) => s.removeEdge);
  const setSelectedEdgeId = useFlowBuilderStore((s) => s.setSelectedEdgeId);

  const condition = edge?.data?.condition;
  const [customKey, setCustomKey] = useState(() => Object.keys(condition ?? {})[0] ?? '');
  const [customValue, setCustomValue] = useState(() =>
    customKey ? String(condition?.[customKey] ?? '') : '',
  );

  if (!selectedEdgeId || !edge) return null;

  const sourceType = sourceNode?.type;

  function clearCondition() {
    updateEdgeCondition(edge!.id, undefined);
  }

  if (sourceType === 'intentClassification' || sourceType === 'quickReplies') {
    const key = sourceType === 'intentClassification' ? 'intent' : 'quickReply';
    const values =
      sourceType === 'intentClassification'
        ? (sourceNode?.data.config.intents ?? [])
        : (sourceNode?.data.config.options ?? []);
    const currentValue = condition?.[key] != null ? String(condition[key]) : NO_CONDITION_VALUE;

    return (
      <div className={styles.drawer}>
        <DrawerHeader sourceNode={sourceNode} targetNode={targetNode} onClose={() => setSelectedEdgeId(null)} />
        <div className={styles.body}>
          <div className={styles.field}>
            <label className={styles.fieldLabel}>
              Take this path when {key} is…
            </label>
            <Select
              value={currentValue}
              options={[
                { value: NO_CONDITION_VALUE, label: 'No condition (default / fallback path)' },
                ...values.map((v) => ({ value: v, label: v })),
              ]}
              onChange={(e) => {
                const value = e.target.value;
                updateEdgeCondition(edge.id, value === NO_CONDITION_VALUE ? undefined : { [key]: value });
              }}
            />
            <span className={styles.hint}>
              Only one edge out of this node should be the default fallback — the engine checks
              conditioned edges first and falls back to the unconditioned one.
            </span>
          </div>
        </div>
        <DrawerFooter onDelete={() => removeEdge(edge.id)} />
      </div>
    );
  }

  return (
    <div className={styles.drawer}>
      <DrawerHeader sourceNode={sourceNode} targetNode={targetNode} onClose={() => setSelectedEdgeId(null)} />
      <div className={styles.body}>
        <div className={styles.field}>
          <label className={styles.fieldLabel}>Session variable</label>
          <Input
            value={customKey}
            onChange={(e) => setCustomKey(e.target.value)}
            placeholder="e.g. tier"
          />
        </div>
        <div className={styles.field}>
          <label className={styles.fieldLabel}>Equals</label>
          <Input
            value={customValue}
            onChange={(e) => setCustomValue(e.target.value)}
            placeholder="e.g. enterprise"
          />
        </div>
        <div className={styles.field}>
          <Button
            variant="secondary"
            size="sm"
            disabled={!customKey.trim()}
            onClick={() => updateEdgeCondition(edge.id, { [customKey.trim()]: customValue })}
          >
            Apply condition
          </Button>
          {condition && (
            <Button variant="ghost" size="sm" onClick={clearCondition}>
              Clear (make default path)
            </Button>
          )}
        </div>
        <span className={styles.hint}>
          Evaluated against session variables set earlier in the flow. Leave no condition on at
          most one outgoing edge to mark it the default/fallback path.
        </span>
      </div>
      <DrawerFooter onDelete={() => removeEdge(edge.id)} />
    </div>
  );
}

function DrawerHeader({
  sourceNode,
  targetNode,
  onClose,
}: {
  sourceNode: FlowCanvasNode | undefined;
  targetNode: FlowCanvasNode | undefined;
  onClose: () => void;
}) {
  return (
    <div className={styles.header}>
      <div>
        <div className={styles.subtitle}>Connection</div>
        <div className={styles.title}>
          {nodeLabel(sourceNode, 'Node')} → {nodeLabel(targetNode, 'Node')}
        </div>
      </div>
      <button type="button" className={styles.closeButton} onClick={onClose} aria-label="Close">
        ✕
      </button>
    </div>
  );
}

function DrawerFooter({ onDelete }: { onDelete: () => void }) {
  return (
    <div className={styles.footer}>
      <Button variant="danger" size="sm" onClick={onDelete}>
        Delete connection
      </Button>
    </div>
  );
}
