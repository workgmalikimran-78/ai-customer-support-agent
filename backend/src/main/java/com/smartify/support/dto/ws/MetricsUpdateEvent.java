package com.smartify.support.dto.ws;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class MetricsUpdateEvent {

    private String metricType;
    private double value;
}
