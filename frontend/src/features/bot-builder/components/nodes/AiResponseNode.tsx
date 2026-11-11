import type { NodeProps } from '@xyflow/react';
import { BotIcon } from '@/components/icons/Icons';
import { BaseNode } from './BaseNode';
import type { FlowCanvasNode } from '../../store/flowBuilderStore';

export function AiResponseNode({ data, selected }: NodeProps<FlowCanvasNode>) {
  return (
    <BaseNode
      icon={<BotIcon size={13} />}
      color="linear-gradient(135deg, #a855f7, #7e22ce)"
      label="AI Response"
      config={data.config}
      selected={selected}
    />
  );
}
