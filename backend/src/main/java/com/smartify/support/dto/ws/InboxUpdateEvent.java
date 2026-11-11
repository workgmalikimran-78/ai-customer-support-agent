package com.smartify.support.dto.ws;

import com.smartify.support.dto.response.ConversationSummaryDto;
import com.smartify.support.dto.response.MessageDto;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class InboxUpdateEvent {

    private String eventType;
    private ConversationSummaryDto conversation;
    private MessageDto message;
}
