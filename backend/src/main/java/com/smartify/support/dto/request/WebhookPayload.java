package com.smartify.support.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class WebhookPayload {

    @NotBlank
    private String externalId;

    private String displayName;

    @NotBlank
    private String text;
}
