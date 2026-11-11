package com.smartify.support.service;

import com.smartify.support.dto.response.AlertDto;
import com.smartify.support.model.Alert;
import com.smartify.support.model.enums.AlertSeverity;
import com.smartify.support.model.enums.MessageSender;
import com.smartify.support.repository.AlertRepository;
import com.smartify.support.repository.MessageRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Simple rule-based alerting: if the count of customer messages containing a configurable
 * keyword (e.g. "refund") in the last N minutes crosses a threshold, insert an Alert row
 * and publish it over the team's alerts WebSocket topic.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class AlertService {

    private final AlertRepository alertRepository;
    private final MessageRepository messageRepository;
    private final NotificationPublisher notificationPublisher;

    @Value("${alerts.keyword:refund}")
    private String keyword;

    @Value("${alerts.window-minutes:15}")
    private int windowMinutes;

    @Value("${alerts.threshold:5}")
    private int threshold;

    @Transactional
    public void evaluateKeywordAlert(UUID teamId) {
        Instant since = Instant.now().minus(windowMinutes, ChronoUnit.MINUTES);
        long matches = messageRepository.countBySenderAndContentContainingIgnoreCaseAndCreatedAtAfter(
                MessageSender.CUSTOMER, keyword, since);

        if (matches >= threshold) {
            Alert alert = Alert.builder()
                    .type("KEYWORD_SPIKE")
                    .severity(AlertSeverity.WARNING)
                    .message(String.format("'%s' mentioned %d times in the last %d minutes", keyword, matches, windowMinutes))
                    .occurredAt(Instant.now())
                    .isRead(false)
                    .teamId(teamId)
                    .build();
            Alert saved = alertRepository.save(alert);
            notificationPublisher.publishAlert(teamId, toDto(saved));
        }
    }

    public List<AlertDto> list(UUID teamId, boolean unreadOnly) {
        List<Alert> alerts = unreadOnly
                ? alertRepository.findByTeamIdAndIsReadFalseOrderByOccurredAtDesc(teamId)
                : alertRepository.findByTeamIdOrderByOccurredAtDesc(teamId);
        return alerts.stream().map(this::toDto).collect(Collectors.toList());
    }

    private AlertDto toDto(Alert alert) {
        return AlertDto.builder()
                .id(alert.getId())
                .type(alert.getType())
                .severity(alert.getSeverity().name())
                .message(alert.getMessage())
                .occurredAt(alert.getOccurredAt())
                .isRead(alert.isRead())
                .build();
    }
}
