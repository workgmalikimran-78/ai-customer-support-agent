package com.smartify.support.repository;

import com.smartify.support.model.AnalyticsSnapshot;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public interface AnalyticsSnapshotRepository extends JpaRepository<AnalyticsSnapshot, UUID> {

    List<AnalyticsSnapshot> findByMetricTypeAndBucketTimestampAfterOrderByBucketTimestampAsc(
            String metricType, Instant after);
}
