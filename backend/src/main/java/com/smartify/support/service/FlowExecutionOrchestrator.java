package com.smartify.support.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.smartify.support.client.AiServiceClient;
import com.smartify.support.client.dto.AiChatRequest;
import com.smartify.support.client.dto.AiChatResponse;
import com.smartify.support.client.dto.ChatHistoryEntry;
import com.smartify.support.client.dto.FlowExecuteRequest;
import com.smartify.support.client.dto.FlowExecuteResponse;
import com.smartify.support.model.BotFlow;
import com.smartify.support.model.Conversation;
import com.smartify.support.model.Message;
import com.smartify.support.model.enums.ConversationStatus;
import com.smartify.support.model.enums.MessageSender;
import com.smartify.support.repository.BotFlowRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * The key integration piece between this service and the Python AI service.
 * <p>
 * When a new customer message arrives on a conversation:
 * <ol>
 *     <li>If the conversation has an active bot flow and is not escalated, the flow graph is
 *     executed via the Python {@code /v1/flows/execute} endpoint.</li>
 *     <li>Otherwise, plain chat mode is used via {@code /v1/chat}.</li>
 * </ol>
 * Either path updates the conversation's last-message metadata, triggers async sentiment
 * ingestion, and pushes the new messages out over the relevant WebSocket topics.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class FlowExecutionOrchestrator {

    private static final int HISTORY_SIZE = 10;

    private final BotFlowRepository botFlowRepository;
    private final MessageService messageService;
    private final ConversationService conversationService;
    private final AiServiceClient aiServiceClient;
    private final NotificationPublisher notificationPublisher;
    private final SentimentIngestionService sentimentIngestionService;
    private final OrderService orderService;
    private final ObjectMapper objectMapper;

    @Transactional
    public Message handleInboundMessage(Conversation conversation, MessageSender inboundSender, String text) {
        Message inboundMessage = messageService.save(conversation.getId(), inboundSender, text, null, null, null);
        conversationService.touchLastMessage(conversation, inboundMessage, true);

        Message outboundMessage;
        if (conversation.getBotFlowId() != null && conversation.getStatus() != ConversationStatus.ESCALATED) {
            outboundMessage = executeFlow(conversation, text);
        } else {
            outboundMessage = plainChat(conversation, text);
        }

        if (outboundMessage != null) {
            conversationService.touchLastMessage(conversation, outboundMessage, false);
        }

        publishUpdates(conversation, inboundMessage, outboundMessage);

        if (inboundSender == MessageSender.CUSTOMER) {
            sentimentIngestionService.ingestAsync(conversation.getId(), text);
        }

        return inboundMessage;
    }

    private Message executeFlow(Conversation conversation, String incomingMessage) {
        BotFlow botFlow = botFlowRepository.findById(conversation.getBotFlowId()).orElse(null);
        if (botFlow == null) {
            log.warn("Conversation {} references missing bot flow {}", conversation.getId(), conversation.getBotFlowId());
            return plainChat(conversation, incomingMessage);
        }

        Map<String, Object> graphJson = parseJsonToMap(botFlow.getGraphJson());
        Map<String, Object> sessionVariables = parseJsonToMap(conversation.getSessionVariables());

        FlowExecuteRequest request = FlowExecuteRequest.builder()
                .flowId(botFlow.getId().toString())
                .graphJson(graphJson)
                .currentNodeId(conversation.getCurrentNodeId())
                .sessionVariables(sessionVariables)
                .incomingMessage(incomingMessage)
                .build();

        FlowExecuteResponse response = aiServiceClient.executeFlow(request);

        String replyText = response.getOutput() != null ? response.getOutput().getText() : null;
        String metadata = buildFlowOutputMetadata(response);

        Message outboundMessage = null;
        if (replyText != null && !replyText.isBlank()) {
            outboundMessage = messageService.save(conversation.getId(), MessageSender.AI, replyText, null,
                    response.getNextNodeId(), metadata);
        }

        conversation.setCurrentNodeId(response.getNextNodeId());
        conversation.setSessionVariables(writeJson(response.getSessionVariables()));

        if (response.isEscalate()) {
            conversation.setStatus(ConversationStatus.ESCALATED);
            conversation.setBotFlowId(null);
            // assignedUserId is intentionally left null so a human agent can claim it.
        }
        conversationService.save(conversation);

        return outboundMessage;
    }

    private Message plainChat(Conversation conversation, String incomingMessage) {
        List<ChatHistoryEntry> history = messageService.lastNForConversation(conversation.getId(), HISTORY_SIZE)
                .stream()
                .map(m -> ChatHistoryEntry.builder()
                        .sender(m.getSender().name())
                        .content(m.getContent())
                        .build())
                .collect(Collectors.toList());

        String orderContext = conversation.getCustomerId() != null
                ? orderService.buildOrderContextSummary(conversation.getCustomerId())
                : null;

        AiChatRequest request = AiChatRequest.builder()
                .conversationId(conversation.getId().toString())
                .contactId(conversation.getContactId().toString())
                .message(incomingMessage)
                .history(history)
                .flowContext(null)
                .orderContext(orderContext)
                .build();

        AiChatResponse response = aiServiceClient.chat(request);

        Message outboundMessage = null;
        if (response.getReply() != null && !response.getReply().isBlank()) {
            outboundMessage = messageService.save(conversation.getId(), MessageSender.AI, response.getReply(), null,
                    null, null);
        }

        if (response.isShouldEscalate()) {
            conversation.setStatus(ConversationStatus.ESCALATED);
        }
        conversationService.save(conversation);

        return outboundMessage;
    }

    private void publishUpdates(Conversation conversation, Message inboundMessage, Message outboundMessage) {
        UUID teamId = resolveTeamId(conversation);
        var summary = conversationService.toSummaryDto(conversation);

        notificationPublisher.publishInboxUpdate(teamId, summary, messageService.toDto(inboundMessage));
        notificationPublisher.publishConversationUpdate(conversation.getId(), messageService.toDto(inboundMessage));

        if (outboundMessage != null) {
            notificationPublisher.publishInboxUpdate(teamId, summary, messageService.toDto(outboundMessage));
            notificationPublisher.publishConversationUpdate(conversation.getId(), messageService.toDto(outboundMessage));
        }
    }

    private UUID resolveTeamId(Conversation conversation) {
        // Conversations aren't directly scoped to a team in the schema; assigned agent's team
        // is the natural owner. Fall back to a stable placeholder topic when unassigned so the
        // event is still broadcast somewhere predictable for unauthenticated/demo scenarios.
        return conversation.getAssignedUserId() != null ? conversation.getAssignedUserId() : conversation.getId();
    }

    private Map<String, Object> parseJsonToMap(String json) {
        if (json == null || json.isBlank()) {
            return new HashMap<>();
        }
        try {
            return objectMapper.readValue(json, Map.class);
        } catch (JsonProcessingException e) {
            log.warn("Failed to parse JSON column, defaulting to empty map", e);
            return new HashMap<>();
        }
    }

    private String writeJson(Map<String, Object> value) {
        if (value == null) {
            return "{}";
        }
        try {
            return objectMapper.writeValueAsString(value);
        } catch (JsonProcessingException e) {
            log.warn("Failed to serialize session variables", e);
            return "{}";
        }
    }

    private String buildFlowOutputMetadata(FlowExecuteResponse response) {
        if (response.getOutput() == null) {
            return null;
        }
        Map<String, Object> metadata = new HashMap<>();
        metadata.put("quickReplies", response.getOutput().getQuickReplies() != null
                ? response.getOutput().getQuickReplies() : Collections.emptyList());
        metadata.put("apiResult", response.getOutput().getApiResult());
        metadata.put("nodeType", response.getNodeType());
        metadata.put("isTerminal", response.isTerminal());
        try {
            return objectMapper.writeValueAsString(metadata);
        } catch (JsonProcessingException e) {
            log.warn("Failed to serialize flow output metadata", e);
            return null;
        }
    }
}
