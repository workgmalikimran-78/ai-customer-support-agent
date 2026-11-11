package com.smartify.support.dto.request;

import com.smartify.support.model.enums.MessageSender;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class SendMessageRequest {

    @NotBlank
    private String content;

    private MessageSender sender = MessageSender.AGENT;

    private String attachmentUrl;
}
