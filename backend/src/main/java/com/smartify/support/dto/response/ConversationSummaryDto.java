package com.smartify.support.dto.response;

import lombok.Builder;
import lombok.Data;

import java.time.Instant;
import java.util.UUID;

@Data
@Builder
public class ConversationSummaryDto {

    private UUID id;
    private UUID contactId;
    private String contactDisplayName;
    private String contactAvatarUrl;
    private UUID channelId;
    private String channelType;
    private UUID assignedUserId;
    private String status;
    private int unreadCount;
    private String lastMessagePreview;
    private Instant lastMessageAt;
    private Double sentimentScore;
}
