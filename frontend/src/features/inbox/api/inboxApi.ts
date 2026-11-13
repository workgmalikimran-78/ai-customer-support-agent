import httpClient from '@/api/httpClient';
import type { Channel, Conversation, ConversationStatus, Message, MessageSender } from '../types/inbox';

interface ConversationSummaryDto {
  id: string;
  contactDisplayName: string;
  contactAvatarUrl: string | null;
  channelType: string;
  status: string;
  unreadCount: number;
  lastMessagePreview: string;
  lastMessageAt: string;
  sentimentScore: number | null;
}

interface PagedResponse<T> {
  items: T[];
}

interface MessageDto {
  id: string;
  conversationId: string;
  sender: string;
  content: string;
  createdAt: string;
}

const CHANNEL_FROM_BACKEND: Record<string, Channel> = {
  WEB_CHAT: 'webchat',
  WHATSAPP: 'whatsapp',
  FACEBOOK_MESSENGER: 'facebook',
};

const STATUS_FROM_BACKEND: Record<string, ConversationStatus> = {
  OPEN: 'open',
  PENDING: 'pending',
  RESOLVED: 'resolved',
  ESCALATED: 'open', // frontend has no distinct "escalated" state yet
};

const SENDER_FROM_BACKEND: Record<string, MessageSender> = {
  CUSTOMER: 'customer',
  AI: 'ai',
  AGENT: 'agent',
  SYSTEM: 'agent', // no distinct system-message styling yet
};

export function toConversation(dto: ConversationSummaryDto): Conversation {
  return {
    id: dto.id,
    contactName: dto.contactDisplayName,
    channel: CHANNEL_FROM_BACKEND[dto.channelType] ?? 'browser',
    avatarUrl: dto.contactAvatarUrl ?? undefined,
    lastMessagePreview: dto.lastMessagePreview,
    lastMessageAt: dto.lastMessageAt,
    unreadCount: dto.unreadCount,
    status: STATUS_FROM_BACKEND[dto.status] ?? 'open',
  };
}

export function toMessage(dto: MessageDto): Message {
  return {
    id: dto.id,
    conversationId: dto.conversationId,
    sender: SENDER_FROM_BACKEND[dto.sender] ?? 'agent',
    text: dto.content,
    sentAt: dto.createdAt,
  };
}

export async function fetchConversations(): Promise<Conversation[]> {
  const { data } = await httpClient.get<PagedResponse<ConversationSummaryDto>>('/api/conversations');
  return data.items.map(toConversation);
}

export async function fetchMessages(conversationId: string): Promise<Message[]> {
  const { data } = await httpClient.get<MessageDto[]>(`/api/conversations/${conversationId}/messages`);
  return data.map(toMessage);
}

export async function sendMessage(conversationId: string, text: string): Promise<Message> {
  const { data } = await httpClient.post<MessageDto>(
    `/api/conversations/${conversationId}/messages`,
    { content: text },
  );
  return toMessage(data);
}
