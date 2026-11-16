import type { NodeProps } from '@xyflow/react';
import { FilterIcon } from '@/components/icons/Icons';
import { BaseNode } from './BaseNode';
import type { FlowCanvasNode } from '../../store/flowBuilderStore';

export function QuickRepliesNode({ data, selected }: NodeProps<FlowCanvasNode>) {
  return (
    <BaseNode
      icon={<FilterIcon size={13} />}
      color="linear-gradient(135deg, #f59e0b, #b45309)"
      label="Quick Replies"
      config={data.config}
      selected={selected}
      isStart={data.isStart}
    />
  );
}
