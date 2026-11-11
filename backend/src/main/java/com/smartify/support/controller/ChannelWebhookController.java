package com.smartify.support.controller;

import com.smartify.support.dto.request.WebhookPayload;
import com.smartify.support.service.ChannelIngestionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
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
     */
    @PostMapping("/{channel}")
    public ResponseEntity<Void> receive(@PathVariable String channel, @Valid @RequestBody WebhookPayload payload) {
        channelIngestionService.ingest(channel, payload);
        return ResponseEntity.accepted().build();
    }
}
