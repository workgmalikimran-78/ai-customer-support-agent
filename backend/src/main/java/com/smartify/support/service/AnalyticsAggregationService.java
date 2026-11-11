package com.smartify.support.service;

import com.smartify.support.model.AnalyticsSnapshot;
import com.smartify.support.model.enums.ConversationStatus;
import com.smartify.support.model.enums.Granularity;
import com.smartify.support.repository.AnalyticsSnapshotRepository;
import com.smartify.support.repository.ConversationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;

/**
 * Periodically aggregates counts from Conversation/Message tables into AnalyticsSnapshot rows,
 * one per metric type, so the analytics dashboard has recent time-series data to chart.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class AnalyticsAggregationService {

    public static final String METRIC_ACTIVE_SESSIONS = "ACTIVE_SESSIONS";
    public static final String METRIC_RESOLUTION_RATE = "RESOLUTION_RATE";
    public static final String METRIC_AVG_RESPONSE_TIME = "AVG_RESPONSE_TIME";

    private final ConversationRepository conversationRepository;
    private final AnalyticsSnapshotRepository analyticsSnapshotRepository;

    @Scheduled(fixedRateString = "${analytics.aggregation.fixed-rate-ms:300000}")
    @Transactional
    public void aggregate() {
        try {
            Instant now = Instant.now();
            recordActiveSessions(now);
            recordResolutionRate(now);
            recordAvgResponseTimePlaceholder(now);
        } catch (Exception e) {
            log.warn("Analytics aggregation run failed", e);
        }
    }

    private void recordActiveSessions(Instant now) {
        long open = conversationRepository.countByStatus(ConversationStatus.OPEN);
        long pending = conversationRepository.countByStatus(ConversationStatus.PENDING);
        long escalated = conversationRepository.countByStatus(ConversationStatus.ESCALATED);
        long activeSessions = open + pending + escalated;

        analyticsSnapshotRepository.save(AnalyticsSnapshot.builder()
                .metricType(METRIC_ACTIVE_SESSIONS)
                .value(activeSessions)
                .bucketTimestamp(now)
                .granularity(Granularity.MINUTE)
                .build());
    }

    private void recordResolutionRate(Instant now) {
        long resolved = conversationRepository.countByStatus(ConversationStatus.RESOLVED);
        long total = conversationRepository.count();
        double rate = total == 0 ? 0.0 : (resolved * 100.0) / total;

        analyticsSnapshotRepository.save(AnalyticsSnapshot.builder()
                .metricType(METRIC_RESOLUTION_RATE)
                .value(rate)
                .targetValue(90.0)
                .bucketTimestamp(now)
                .granularity(Granularity.MINUTE)
                .build());
    }

    private void recordAvgResponseTimePlaceholder(Instant now) {
        // A full implementation would compute the average delta between a CUSTOMER message
        // and the next AI/AGENT reply. Kept simple here: record 0 when there isn't enough
        // data yet so the series always has a current data point for the dashboard.
        analyticsSnapshotRepository.save(AnalyticsSnapshot.builder()
                .metricType(METRIC_AVG_RESPONSE_TIME)
                .value(0.0)
                .bucketTimestamp(now)
                .granularity(Granularity.MINUTE)
                .build());
    }
}
