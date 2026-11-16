import type { NodeProps } from '@xyflow/react';
import { SettingsIcon } from '@/components/icons/Icons';
import { BaseNode } from './BaseNode';
import type { FlowCanvasNode } from '../../store/flowBuilderStore';

export function ApiCallNode({ data, selected }: NodeProps<FlowCanvasNode>) {
  return (
    <BaseNode
      icon={<SettingsIcon size={13} />}
      color="linear-gradient(135deg, #10b981, #047857)"
      label="API Call"
      config={data.config}
      selected={selected}
      isStart={data.isStart}
    />
  );
}
