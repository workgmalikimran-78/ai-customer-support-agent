import type { NodeProps } from '@xyflow/react';
import { AnalyticsIcon } from '@/components/icons/Icons';
import { BaseNode } from './BaseNode';
import type { FlowCanvasNode } from '../../store/flowBuilderStore';

export function IntentClassificationNode({ data, selected }: NodeProps<FlowCanvasNode>) {
  return (
    <BaseNode
      icon={<AnalyticsIcon size={13} />}
      color="linear-gradient(135deg, #3b82f6, #1d4ed8)"
      label="Intent Classification"
      config={data.config}
      selected={selected}
    />
  );
}
