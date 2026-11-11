package com.smartify.support.dto.response;

import lombok.Builder;
import lombok.Data;

import java.time.Instant;
import java.util.UUID;

@Data
@Builder
public class MessageDto {

    private UUID id;
    private UUID conversationId;
    private String sender;
    private String content;
    private String attachmentUrl;
    private String nodeId;
    private String metadata;
    private Instant createdAt;
}
