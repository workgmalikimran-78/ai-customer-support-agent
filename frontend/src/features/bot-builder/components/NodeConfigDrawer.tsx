import { Button, Input, Select } from '@/components/ui';
import { useFlowBuilderStore } from '../store/flowBuilderStore';
import type { BotNodeConfig } from '../types/botFlow';
import styles from './NodeConfigDrawer.module.css';

const NODE_TYPE_LABELS: Record<string, string> = {
  welcomeMessage: 'Welcome Message',
  intentClassification: 'Intent Classification',
  textBlock: 'Text Block',
  quickReplies: 'Quick Replies',
  apiCall: 'API Call',
  aiResponse: 'AI Response',
  directToAgent: 'Direct to Agent',
};

const METHOD_OPTIONS = ['GET', 'POST', 'PUT', 'DELETE'].map((m) => ({ value: m, label: m }));

function toCsv(values?: string[]): string {
  return values?.join(', ') ?? '';
}

function fromCsv(value: string): string[] {
  return value
    .split(',')
    .map((v) => v.trim())
    .filter(Boolean);
}

/**
 * Side panel for editing the strongly-typed `config` of the currently
 * selected canvas node. Field names written here must match the Python
 * flow engine's discriminated union (`app/workflows/flow_schema.py`)
 * exactly, since this is the only UI surface that produces node config.
 */
export function NodeConfigDrawer() {
  const selectedNodeId = useFlowBuilderStore((s) => s.selectedNodeId);
  const node = useFlowBuilderStore((s) => s.nodes.find((n) => n.id === s.selectedNodeId));
  const isStartNode = useFlowBuilderStore((s) => s.startNodeId === s.selectedNodeId);
  const updateNodeConfig = useFlowBuilderStore((s) => s.updateNodeConfig);
  const setSelectedNodeId = useFlowBuilderStore((s) => s.setSelectedNodeId);
  const setStartNodeId = useFlowBuilderStore((s) => s.setStartNodeId);
  const removeNode = useFlowBuilderStore((s) => s.removeNode);

  if (!selectedNodeId || !node) return null;

  const config = node.data.config;
  const type = node.type ?? config.type;

  const set = (patch: Partial<BotNodeConfig>) => updateNodeConfig(node.id, patch);

  return (
    <div className={styles.drawer}>
      <div className={styles.header}>
        <div>
          <div className={styles.subtitle}>{type ? NODE_TYPE_LABELS[type] : 'Node'}</div>
          <div className={styles.title}>Edit node</div>
        </div>
        <button
          type="button"
          className={styles.closeButton}
          onClick={() => setSelectedNodeId(null)}
          aria-label="Close"
        >
          ✕
        </button>
      </div>

      <div className={styles.body}>
        {isStartNode ? (
          <span className={styles.hint}>This is the flow's start node.</span>
        ) : (
          <Button variant="secondary" size="sm" onClick={() => setStartNodeId(node.id)}>
            Set as start node
          </Button>
        )}

        <Input
          label="Label"
          value={config.label ?? ''}
          onChange={(e) => set({ label: e.target.value })}
        />

        {(type === 'welcomeMessage' || type === 'textBlock') && (
          <div className={styles.field}>
            <label className={styles.fieldLabel}>Text</label>
            <textarea
              className={styles.textarea}
              value={config.text ?? ''}
              onChange={(e) => set({ text: e.target.value })}
            />
          </div>
        )}

        {type === 'intentClassification' && (
          <div className={styles.field}>
            <label className={styles.fieldLabel}>Intents (comma-separated)</label>
            <Input
              value={toCsv(config.intents)}
              onChange={(e) => set({ intents: fromCsv(e.target.value) })}
              placeholder="sales_inquiry, technical_support"
            />
            <span className={styles.hint}>
              Outgoing edges should set a condition like {'{ intent: "sales_inquiry" }'}.
            </span>
          </div>
        )}

        {type === 'quickReplies' && (
          <>
            <div className={styles.field}>
              <label className={styles.fieldLabel}>Prompt text</label>
              <textarea
                className={styles.textarea}
                value={config.text ?? ''}
                onChange={(e) => set({ text: e.target.value })}
              />
            </div>
            <div className={styles.field}>
              <label className={styles.fieldLabel}>Options (comma-separated)</label>
              <Input
                value={toCsv(config.options)}
                onChange={(e) => set({ options: fromCsv(e.target.value) })}
                placeholder="Yes, No, I need a human"
              />
            </div>
          </>
        )}

        {type === 'apiCall' && (
          <>
            <Input
              label="URL"
              value={config.url ?? ''}
              onChange={(e) => set({ url: e.target.value })}
            />
            <Select
              label="Method"
              options={METHOD_OPTIONS}
              value={config.method ?? 'GET'}
              onChange={(e) => set({ method: e.target.value })}
            />
          </>
        )}

        {type === 'aiResponse' && (
          <div className={styles.field}>
            <label className={styles.fieldLabel}>Prompt template</label>
            <textarea
              className={styles.textarea}
              value={config.promptTemplate ?? ''}
              onChange={(e) => set({ promptTemplate: e.target.value })}
            />
          </div>
        )}

        {type === 'directToAgent' && (
          <Input
            label="Escalation reason"
            value={config.reason ?? ''}
            onChange={(e) => set({ reason: e.target.value })}
          />
        )}
      </div>

      <div className={styles.footer}>
        <Button variant="secondary" size="sm" onClick={() => setSelectedNodeId(null)}>
          Done
        </Button>
        <Button variant="danger" size="sm" onClick={() => removeNode(node.id)}>
          Delete node
        </Button>
      </div>
    </div>
  );
}
