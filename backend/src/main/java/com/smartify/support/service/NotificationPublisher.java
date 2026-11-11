package com.smartify.support.service;

import com.smartify.support.dto.response.AlertDto;
import com.smartify.support.dto.response.ConversationSummaryDto;
import com.smartify.support.dto.response.MessageDto;
import com.smartify.support.dto.ws.AlertEvent;
import com.smartify.support.dto.ws.InboxUpdateEvent;
import com.smartify.support.dto.ws.MetricsUpdateEvent;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Component;

import java.util.UUID;

/**
 * Thin wrapper around {@link SimpMessagingTemplate} that centralizes the STOMP topic
 * naming conventions used across the app.
 */
@Component
@RequiredArgsConstructor
public class NotificationPublisher {

    private final SimpMessagingTemplate messagingTemplate;

    public void publishInboxUpdate(UUID teamId, ConversationSummaryDto conversation, MessageDto message) {
        InboxUpdateEvent event = InboxUpdateEvent.builder()
                .eventType("MESSAGE_CREATED")
                .conversation(conversation)
                .message(message)
                .build();
        messagingTemplate.convertAndSend("/topic/inbox/" + teamId, event);
    }

    public void publishConversationUpdate(UUID conversationId, MessageDto message) {
        messagingTemplate.convertAndSend("/topic/conversations/" + conversationId, message);
    }

    public void publishMetricsUpdate(UUID teamId, String metricType, double value) {
        MetricsUpdateEvent event = MetricsUpdateEvent.builder()
                .metricType(metricType)
                .value(value)
                .build();
        messagingTemplate.convertAndSend("/topic/metrics/" + teamId, event);
    }

    public void publishAlert(UUID teamId, AlertDto alert) {
        AlertEvent event = AlertEvent.builder().alert(alert).build();
        messagingTemplate.convertAndSend("/topic/alerts/" + teamId, event);
    }
}
