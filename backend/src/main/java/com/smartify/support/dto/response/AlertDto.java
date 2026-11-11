package com.smartify.support.dto.response;

import lombok.Builder;
import lombok.Data;

import java.time.Instant;
import java.util.UUID;

@Data
@Builder
public class AlertDto {

    private UUID id;
    private String type;
    private String severity;
    private String message;
    private Instant occurredAt;
    private boolean isRead;
}
