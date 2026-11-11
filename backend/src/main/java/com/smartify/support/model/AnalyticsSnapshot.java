package com.smartify.support.model;

import com.smartify.support.model.enums.Granularity;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "analytics_snapshot")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AnalyticsSnapshot {

    @Id
    @GeneratedValue
    private UUID id;

    @Column(name = "metric_type", nullable = false)
    private String metricType;

    @Column(nullable = false)
    private double value;

    @Column(name = "target_value")
    private Double targetValue;

    @Column(name = "bucket_timestamp", nullable = false)
    private Instant bucketTimestamp;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Granularity granularity;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb")
    private String dimensions;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = Instant.now();
        }
    }
}
