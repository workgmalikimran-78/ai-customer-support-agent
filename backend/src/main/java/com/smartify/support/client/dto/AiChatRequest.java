package com.smartify.support.client.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AiChatRequest {

    private String conversationId;
    private String contactId;
    private String message;
    private List<ChatHistoryEntry> history;
    private FlowContext flowContext;
    // Pre-formatted summary of the logged-in customer's recent orders, for the agent to ground
    // "what's my order status" answers in -- null for anonymous conversations.
    private String orderContext;
}
