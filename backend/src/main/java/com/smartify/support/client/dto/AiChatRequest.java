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
}
