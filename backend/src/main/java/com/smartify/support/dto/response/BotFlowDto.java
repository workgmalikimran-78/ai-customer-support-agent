package com.smartify.support.dto.response;

import lombok.Builder;
import lombok.Data;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;

@Data
@Builder
public class BotFlowDto {

    private UUID id;
    private String name;
    private String description;
    private String status;
    private int version;
    private Map<String, Object> graphJson;
    private Instant createdAt;
    private Instant updatedAt;
}
