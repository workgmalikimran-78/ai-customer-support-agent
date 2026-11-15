export interface WebChatMessage {
  id: string;
  conversationId: string;
  sender: string; // CUSTOMER | AI | AGENT | SYSTEM (backend's raw enum name)
  content: string;
  createdAt: string;
}

export interface WebChatMessageResponse {
  conversationId: string;
  message: WebChatMessage;
}

export interface SendWebChatMessageInput {
  externalId: string;
  displayName?: string;
  text: string;
}
