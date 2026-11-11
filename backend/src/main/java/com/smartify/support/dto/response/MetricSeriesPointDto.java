package com.smartify.support.dto.response;

import lombok.Builder;
import lombok.Data;

import java.time.Instant;

@Data
@Builder
public class MetricSeriesPointDto {

    private Instant t;
    private double v;
}
