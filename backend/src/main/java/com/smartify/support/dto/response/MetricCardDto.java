package com.smartify.support.dto.response;

import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class MetricCardDto {

    private double current;
    private Double target;
    private Double peak;
    private List<MetricSeriesPointDto> series;
}
