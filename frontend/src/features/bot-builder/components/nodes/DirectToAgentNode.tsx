import type { NodeProps } from '@xyflow/react';
import { TeamIcon } from '@/components/icons/Icons';
import { BaseNode } from './BaseNode';
import type { FlowCanvasNode } from '../../store/flowBuilderStore';

export function DirectToAgentNode({ data, selected }: NodeProps<FlowCanvasNode>) {
  return (
    <BaseNode
      icon={<TeamIcon size={13} />}
      color="linear-gradient(135deg, #ef4444, #b91c1c)"
      label="Direct to Agent"
      config={data.config}
      selected={selected}
      showSource={false}
    />
  );
}
