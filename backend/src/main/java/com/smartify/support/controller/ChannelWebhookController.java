package com.smartify.support.controller;

import com.smartify.support.dto.request.WebhookPayload;
import com.smartify.support.service.ChannelIngestionService;
import io.swagger.v3.oas.annotations.Parameter;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/webhooks")
@RequiredArgsConstructor
public class ChannelWebhookController {

    private final ChannelIngestionService channelIngestionService;

    /**
     * Generic normalized inbound webhook. WhatsApp/Facebook Messenger/web chat are all
     * treated identically here - this is a stub normalization layer, no real third-party
     * provider API calls are made.
     * <p>
     * {@code signature} is declared here purely so Swagger UI renders an input field for it -
     * WebhookSignatureFilter already verified it against the raw body before this method runs,
     * and rejects the request with 401 long before Spring would bind this parameter.
     */
    @PostMapping("/{channel}")
    public ResponseEntity<Void> receive(
            @PathVariable String channel,
            @Valid @RequestBody WebhookPayload payload,
            @Parameter(description = "HMAC-SHA256 of the raw request body, hex-encoded and "
                    + "prefixed \"sha256=\", keyed by WEBHOOK_SHARED_SECRET.", required = true)
            @RequestHeader("X-Webhook-Signature") String signature) {
        ingestWithRetry(channel, payload);
        return ResponseEntity.accepted().build();
    }

    /** See WebChatController.ingestWithRetry for why this retry exists -- providers can also
     * redeliver the same webhook concurrently, hitting the same contact-insert race. */
    private void ingestWithRetry(String channel, WebhookPayload payload) {
        try {
            channelIngestionService.ingest(channel, payload);
        } catch (DataIntegrityViolationException e) {
            channelIngestionService.ingest(channel, payload);
        }
    }
}
