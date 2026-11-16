import type { NodeProps } from '@xyflow/react';
import { InboxIcon } from '@/components/icons/Icons';
import { BaseNode } from './BaseNode';
import type { FlowCanvasNode } from '../../store/flowBuilderStore';

export function TextBlockNode({ data, selected }: NodeProps<FlowCanvasNode>) {
  return (
    <BaseNode
      icon={<InboxIcon size={13} />}
      color="linear-gradient(135deg, #64748b, #42495c)"
      label="Text Block"
      config={data.config}
      selected={selected}
      isStart={data.isStart}
    />
  );
}
