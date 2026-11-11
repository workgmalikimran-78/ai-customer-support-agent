package com.smartify.support.controller;

import com.smartify.support.dto.response.AnalyticsMetricsResponse;
import com.smartify.support.dto.response.MetricCardDto;
import com.smartify.support.dto.response.MetricSeriesPointDto;
import com.smartify.support.model.AnalyticsSnapshot;
import com.smartify.support.repository.AnalyticsSnapshotRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.OptionalDouble;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/analytics")
@RequiredArgsConstructor
public class AnalyticsController {

    private static final Pattern RANGE_PATTERN = Pattern.compile("^(\\d+)([hmd])$");

    private final AnalyticsSnapshotRepository analyticsSnapshotRepository;

    @GetMapping("/metrics")
    public AnalyticsMetricsResponse metrics(@RequestParam(defaultValue = "24h") String range) {
        Instant since = Instant.now().minus(parseRange(range));

        return AnalyticsMetricsResponse.builder()
                .activeSessions(buildCard("ACTIVE_SESSIONS", since))
                .resolutionRate(buildCard("RESOLUTION_RATE", since))
                .avgResponseTime(buildCard("AVG_RESPONSE_TIME", since))
                .sentiment(buildCard("SENTIMENT", since))
                .build();
    }

    private MetricCardDto buildCard(String metricType, Instant since) {
        List<AnalyticsSnapshot> snapshots = analyticsSnapshotRepository
                .findByMetricTypeAndBucketTimestampAfterOrderByBucketTimestampAsc(metricType, since);

        List<MetricSeriesPointDto> series = snapshots.stream()
                .map(s -> MetricSeriesPointDto.builder().t(s.getBucketTimestamp()).v(s.getValue()).build())
                .collect(Collectors.toList());

        double current = snapshots.isEmpty() ? 0.0 : snapshots.get(snapshots.size() - 1).getValue();
        Double target = snapshots.isEmpty() ? null : snapshots.get(snapshots.size() - 1).getTargetValue();
        OptionalDouble peak = snapshots.stream().mapToDouble(AnalyticsSnapshot::getValue).max();

        return MetricCardDto.builder()
                .current(current)
                .target(target)
                .peak(peak.isPresent() ? peak.getAsDouble() : null)
                .series(series)
                .build();
    }

    private Duration parseRange(String range) {
        Matcher matcher = RANGE_PATTERN.matcher(range == null ? "" : range.trim());
        if (!matcher.matches()) {
            return Duration.ofHours(24);
        }
        long amount = Long.parseLong(matcher.group(1));
        String unit = matcher.group(2);
        return switch (unit) {
            case "h" -> Duration.ofHours(amount);
            case "d" -> Duration.ofDays(amount);
            case "m" -> Duration.ofMinutes(amount);
            default -> Duration.ofHours(24);
        };
    }
}
