import type { ReactElement } from 'react';
import { Dropdown } from '@/components/ui/Dropdown';
import { Button } from '@/components/ui/Button';
import { BotIcon, FilterIcon, InboxIcon, PlusIcon, SettingsIcon } from '@/components/icons/Icons';
import { useFlowBuilderStore } from '../store/flowBuilderStore';
import type { BotNodeType } from '../types/botFlow';

const ADDABLE_ELEMENTS: { type: BotNodeType; label: string; icon: ReactElement }[] = [
  { type: 'textBlock', label: 'Text Block', icon: <InboxIcon size={14} /> },
  { type: 'quickReplies', label: 'Quick Replies', icon: <FilterIcon size={14} /> },
  { type: 'apiCall', label: 'API Call', icon: <SettingsIcon size={14} /> },
  { type: 'aiResponse', label: 'AI Response', icon: <BotIcon size={14} /> },
];

export function AddElementMenu() {
  const addNode = useFlowBuilderStore((s) => s.addNode);

  return (
    <Dropdown
      align="right"
      trigger={
        <Button variant="primary" size="sm" leftIcon={<PlusIcon size={14} />}>
          Add element
        </Button>
      }
      items={ADDABLE_ELEMENTS.map((el) => ({
        key: el.type,
        label: el.label,
        icon: el.icon,
        onSelect: () => addNode(el.type),
      }))}
    />
  );
}
