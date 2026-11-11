import httpClient from '@/api/httpClient';
import type { Conversation, Message } from '../types/inbox';
import { getMockMessages, MOCK_CONVERSATIONS } from './mockInbox';

export async function fetchConversations(teamId: string): Promise<Conversation[]> {
  try {
    const { data } = await httpClient.get<Conversation[]>(`/api/teams/${teamId}/conversations`);
    return data;
  } catch (err) {
    console.warn('[inboxApi] fetchConversations falling back to mock data:', err);
    return structuredClone(MOCK_CONVERSATIONS);
  }
}

export async function fetchMessages(conversationId: string): Promise<Message[]> {
  try {
    const { data } = await httpClient.get<Message[]>(
      `/api/conversations/${conversationId}/messages`,
    );
    return data;
  } catch (err) {
    console.warn('[inboxApi] fetchMessages falling back to mock data:', err);
    return structuredClone(getMockMessages(conversationId));
  }
}

export async function sendMessage(conversationId: string, text: string): Promise<Message> {
  try {
    const { data } = await httpClient.post<Message>(
      `/api/conversations/${conversationId}/messages`,
      { text },
    );
    return data;
  } catch (err) {
    console.warn('[inboxApi] sendMessage falling back to local echo:', err);
    return {
      id: `local-${Date.now()}`,
      conversationId,
      sender: 'agent',
      text,
      sentAt: new Date().toISOString(),
    };
  }
}
