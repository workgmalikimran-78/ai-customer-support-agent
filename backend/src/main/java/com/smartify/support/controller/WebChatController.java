package com.smartify.support.controller;

import com.smartify.support.config.CustomerPrincipal;
import com.smartify.support.dto.request.WebhookPayload;
import com.smartify.support.dto.response.MessageDto;
import com.smartify.support.dto.response.WebChatMessageResponse;
import com.smartify.support.model.Message;
import com.smartify.support.service.ChannelIngestionService;
import com.smartify.support.service.MessageService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Public (unauthenticated) endpoint for the customer-facing web chat widget.
 * <p>
 * Unlike {@link ChannelWebhookController}, this isn't signature-verified -- it's called
 * directly by our own frontend, not a third-party channel provider, so the HMAC scheme
 * (which protects against spoofed provider callbacks) doesn't apply here. Knowledge of a
 * conversationId acts as the de facto capability token for reading that conversation's
 * history; this is a demo widget, not a production-hardened support channel (see
 * docs/security-notes.md for what's considered out of scope).
 */
@RestController
@RequestMapping("/api/webchat")
@RequiredArgsConstructor
public class WebChatController {

    private final ChannelIngestionService channelIngestionService;
    private final MessageService messageService;
    private final CustomerPrincipalResolver customerPrincipalResolver;

    @PostMapping("/messages")
    public ResponseEntity<WebChatMessageResponse> send(@Valid @RequestBody WebhookPayload payload) {
        CustomerPrincipal customer = customerPrincipalResolver.currentCustomerOrNull();
        UUID customerId = customer != null ? customer.customerId() : null;
        Message message = ingestWithRetry(payload, customerId);
        return ResponseEntity.ok(WebChatMessageResponse.builder()
                .conversationId(message.getConversationId())
                .message(messageService.toDto(message))
                .build());
    }

    /** Two requests for the same contact (channelId, externalId) arriving close together --
     * e.g. two browser tabs on the same logged-in customer -- can both miss the
     * find-existing-contact check and both try to insert, since neither has committed yet
     * when the other reads. The loser hits ChannelIngestionService's unique constraint and
     * its whole transaction rolls back cleanly; retrying once picks up the winner's now-visible
     * row instead of failing the request. */
    private Message ingestWithRetry(WebhookPayload payload, UUID customerId) {
        try {
            return channelIngestionService.ingest("webchat", payload, customerId);
        } catch (DataIntegrityViolationException e) {
            return channelIngestionService.ingest("webchat", payload, customerId);
        }
    }

    @GetMapping("/conversations/{conversationId}/messages")
    public ResponseEntity<List<MessageDto>> getMessages(@PathVariable UUID conversationId) {
        List<MessageDto> messages = messageService.listForConversation(conversationId, null, 50).stream()
                .map(messageService::toDto)
                .collect(Collectors.toList());
        return ResponseEntity.ok(messages);
    }
}
