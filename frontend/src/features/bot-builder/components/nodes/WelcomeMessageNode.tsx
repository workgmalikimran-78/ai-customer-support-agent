import type { NodeProps } from '@xyflow/react';
import { BotIcon } from '@/components/icons/Icons';
import { BaseNode } from './BaseNode';
import type { FlowCanvasNode } from '../../store/flowBuilderStore';

export function WelcomeMessageNode({ data, selected }: NodeProps<FlowCanvasNode>) {
  return (
    <BaseNode
      icon={<BotIcon size={13} />}
      color="linear-gradient(135deg, #8b5cf6, #6d28d9)"
      label="Welcome Message"
      config={data.config}
      selected={selected}
      showTarget={false}
    />
  );
}
