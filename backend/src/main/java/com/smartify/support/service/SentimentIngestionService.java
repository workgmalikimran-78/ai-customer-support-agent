package com.smartify.support.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.smartify.support.client.AiServiceClient;
import com.smartify.support.client.dto.SentimentRequest;
import com.smartify.support.client.dto.SentimentResponse;
import com.smartify.support.model.AnalyticsSnapshot;
import com.smartify.support.model.Conversation;
import com.smartify.support.model.enums.Granularity;
import com.smartify.support.repository.AnalyticsSnapshotRepository;
import com.smartify.support.repository.ConversationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;

/**
 * Calls the Python /v1/sentiment endpoint for inbound customer messages, updates
 * Conversation.sentimentScore and records a sentiment data point in AnalyticsSnapshot.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class SentimentIngestionService {

    private static final String METRIC_TYPE = "SENTIMENT";

    private final AiServiceClient aiServiceClient;
    private final ConversationRepository conversationRepository;
    private final AnalyticsSnapshotRepository analyticsSnapshotRepository;
    private final ObjectMapper objectMapper;

    @Async("webhookTaskExecutor")
    public void ingestAsync(UUID conversationId, String text) {
        try {
            ingest(conversationId, text);
        } catch (Exception e) {
            log.warn("Sentiment ingestion failed for conversation {}", conversationId, e);
        }
    }

    @Transactional
    public void ingest(UUID conversationId, String text) {
        if (text == null || text.isBlank()) {
            return;
        }

        SentimentRequest request = SentimentRequest.builder()
                .conversationId(conversationId.toString())
                .text(text)
                .build();

        SentimentResponse response = aiServiceClient.sentiment(request);

        conversationRepository.findById(conversationId).ifPresent(conversation -> {
            conversation.setSentimentScore(response.getScore());
            conversationRepository.save(conversation);
        });

        String dimensions = toJson(Map.of(
                "conversationId", conversationId.toString(),
                "label", response.getLabel(),
                "emoji", response.getEmoji()));

        AnalyticsSnapshot snapshot = AnalyticsSnapshot.builder()
                .metricType(METRIC_TYPE)
                .value(response.getScore())
                .bucketTimestamp(Instant.now())
                .granularity(Granularity.MINUTE)
                .dimensions(dimensions)
                .build();
        analyticsSnapshotRepository.save(snapshot);
    }

    private String toJson(Map<String, Object> value) {
        try {
            return objectMapper.writeValueAsString(value);
        } catch (Exception e) {
            return null;
        }
    }
}
