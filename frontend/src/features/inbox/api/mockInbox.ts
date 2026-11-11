import type { Conversation, Message } from '../types/inbox';

const now = Date.now();
const minutesAgo = (m: number) => new Date(now - m * 60 * 1000).toISOString();

export const MOCK_CONVERSATIONS: Conversation[] = [
  {
    id: 'conv-1',
    contactName: 'Sarah Jennings',
    channel: 'webchat',
    lastMessagePreview: "I still haven't received my refund for order #4521...",
    lastMessageAt: minutesAgo(3),
    unreadCount: 2,
    status: 'open',
  },
  {
    id: 'conv-2',
    contactName: 'Marcus Lee',
    channel: 'whatsapp',
    lastMessagePreview: 'Thanks, that solved it! Appreciate the quick help 🙌',
    lastMessageAt: minutesAgo(12),
    unreadCount: 0,
    status: 'resolved',
  },
  {
    id: 'conv-3',
    contactName: 'Priya Natarajan',
    channel: 'facebook',
    lastMessagePreview: 'Do you offer a discount for annual billing on the Pro plan?',
    lastMessageAt: minutesAgo(26),
    unreadCount: 1,
    status: 'pending',
  },
  {
    id: 'conv-4',
    contactName: 'Diego Fernandez',
    channel: 'browser',
    lastMessagePreview: "The dashboard keeps throwing a 500 error when I try to export...",
    lastMessageAt: minutesAgo(41),
    unreadCount: 0,
    status: 'open',
  },
  {
    id: 'conv-5',
    contactName: 'Amelia Clarke',
    channel: 'webchat',
    lastMessagePreview: 'Can someone walk me through setting up SSO for our workspace?',
    lastMessageAt: minutesAgo(58),
    unreadCount: 3,
    status: 'open',
  },
  {
    id: 'conv-6',
    contactName: 'Tomasz Kowalski',
    channel: 'whatsapp',
    lastMessagePreview: 'Perfect, that is exactly what I needed, thank you!',
    lastMessageAt: minutesAgo(95),
    unreadCount: 0,
    status: 'resolved',
  },
  {
    id: 'conv-7',
    contactName: 'Grace Okafor',
    channel: 'facebook',
    lastMessagePreview: 'Is there a mobile app for the customer portal yet?',
    lastMessageAt: minutesAgo(140),
    unreadCount: 0,
    status: 'pending',
  },
];

export const MOCK_MESSAGES: Record<string, Message[]> = {
  'conv-1': [
    {
      id: 'm-1',
      conversationId: 'conv-1',
      sender: 'customer',
      text: 'Hi, I placed an order last week (#4521) and requested a refund 5 days ago.',
      sentAt: minutesAgo(20),
    },
    {
      id: 'm-2',
      conversationId: 'conv-1',
      sender: 'ai',
      text: "Hi Sarah, I'm sorry for the delay! Let me check the status of your refund right now.",
      sentAt: minutesAgo(19),
    },
    {
      id: 'm-3',
      conversationId: 'conv-1',
      sender: 'ai',
      text: 'I can see the refund was approved on our end and should post within 3-5 business days. I understand that is frustrating given the wait already — want me to escalate this to a live agent for a faster resolution?',
      sentAt: minutesAgo(18),
    },
    {
      id: 'm-4',
      conversationId: 'conv-1',
      sender: 'customer',
      text: "I still haven't received my refund for order #4521, it's been almost a week now.",
      sentAt: minutesAgo(3),
    },
  ],
  'conv-2': [
    {
      id: 'm-5',
      conversationId: 'conv-2',
      sender: 'customer',
      text: 'My integration webhook stopped firing after the last update.',
      sentAt: minutesAgo(20),
    },
    {
      id: 'm-6',
      conversationId: 'conv-2',
      sender: 'ai',
      text: 'Thanks for flagging that! Could you confirm which webhook endpoint is affected?',
      sentAt: minutesAgo(18),
    },
    {
      id: 'm-7',
      conversationId: 'conv-2',
      sender: 'customer',
      text: 'The /conversations/updated one.',
      sentAt: minutesAgo(15),
    },
    {
      id: 'm-8',
      conversationId: 'conv-2',
      sender: 'ai',
      text: 'Found it — there was a signing key rotation. I just re-issued your webhook secret, it should resume working now.',
      sentAt: minutesAgo(13),
    },
    {
      id: 'm-9',
      conversationId: 'conv-2',
      sender: 'customer',
      text: 'Thanks, that solved it! Appreciate the quick help 🙌',
      sentAt: minutesAgo(12),
    },
  ],
};

function defaultThreadFor(conversation: Conversation): Message[] {
  return [
    {
      id: `${conversation.id}-m1`,
      conversationId: conversation.id,
      sender: 'customer',
      text: conversation.lastMessagePreview,
      sentAt: conversation.lastMessageAt,
    },
    {
      id: `${conversation.id}-m2`,
      conversationId: conversation.id,
      sender: 'ai',
      text: "Thanks for reaching out! I'm looking into this for you now.",
      sentAt: conversation.lastMessageAt,
    },
  ];
}

export function getMockMessages(conversationId: string): Message[] {
  if (MOCK_MESSAGES[conversationId]) return MOCK_MESSAGES[conversationId];
  const conv = MOCK_CONVERSATIONS.find((c) => c.id === conversationId);
  return conv ? defaultThreadFor(conv) : [];
}
