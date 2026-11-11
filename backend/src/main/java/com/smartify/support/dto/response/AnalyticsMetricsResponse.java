package com.smartify.support.dto.response;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class AnalyticsMetricsResponse {

    private MetricCardDto activeSessions;
    private MetricCardDto resolutionRate;
    private MetricCardDto avgResponseTime;
    private MetricCardDto sentiment;
}
