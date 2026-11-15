import httpClient from '@/api/httpClient';
import type { SendWebChatMessageInput, WebChatMessage, WebChatMessageResponse } from '../types/webchat';

export async function sendWebChatMessage(input: SendWebChatMessageInput): Promise<WebChatMessageResponse> {
  // Opt-in, additive only: if a shop customer is logged in (separate token, separate login
  // system -- see customerAuthStore.ts), attach it so the backend can attribute this
  // conversation to their account and ground chat answers in their real order history. The
  // anonymous path (no customer logged in) is completely unaffected -- no header is sent.
  const customerToken = localStorage.getItem('smartify_customer_token');
  const { data } = await httpClient.post<WebChatMessageResponse>('/api/webchat/messages', input, {
    headers: customerToken ? { Authorization: `Bearer ${customerToken}` } : undefined,
  });
  return data;
}

export async function fetchWebChatMessages(conversationId: string): Promise<WebChatMessage[]> {
  const { data } = await httpClient.get<WebChatMessage[]>(
    `/api/webchat/conversations/${conversationId}/messages`,
  );
  return data;
}
