export type Channel = 'webchat' | 'whatsapp' | 'facebook' | 'browser';

export type ConversationStatus = 'open' | 'pending' | 'resolved';

export interface Conversation {
  id: string;
  contactName: string;
  channel: Channel;
  avatarUrl?: string;
  lastMessagePreview: string;
  lastMessageAt: string; // ISO
  unreadCount: number;
  status: ConversationStatus;
}

export type MessageSender = 'customer' | 'ai' | 'agent';

export interface Message {
  id: string;
  conversationId: string;
  sender: MessageSender;
  text: string;
  sentAt: string; // ISO
}
