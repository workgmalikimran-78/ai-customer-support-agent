package com.smartify.support.controller;

import com.smartify.support.dto.request.AssignConversationRequest;
import com.smartify.support.dto.request.SendMessageRequest;
import com.smartify.support.dto.response.ConversationSummaryDto;
import com.smartify.support.dto.response.MessageDto;
import com.smartify.support.dto.response.PagedResponse;
import com.smartify.support.model.Conversation;
import com.smartify.support.model.Message;
import com.smartify.support.model.enums.ConversationStatus;
import com.smartify.support.model.enums.MessageSender;
import com.smartify.support.service.ConversationService;
import com.smartify.support.service.FlowExecutionOrchestrator;
import com.smartify.support.service.MessageService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.UUID;

@RestController
@RequestMapping("/api/conversations")
@RequiredArgsConstructor
public class ConversationController {

    private final ConversationService conversationService;
    private final MessageService messageService;
    private final FlowExecutionOrchestrator flowExecutionOrchestrator;

    @GetMapping
    public ResponseEntity<PagedResponse<ConversationSummaryDto>> list(
            @RequestParam(required = false) ConversationStatus status,
            @RequestParam(required = false) UUID channel,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(conversationService.search(status, channel, search, page, size));
    }

    @GetMapping("/{id}/messages")
    public ResponseEntity<java.util.List<MessageDto>> getMessages(
            @PathVariable UUID id,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant before,
            @RequestParam(defaultValue = "50") int limit) {
        return ResponseEntity.ok(conversationService.getMessages(id, before, limit));
    }

    @PostMapping("/{id}/messages")
    public ResponseEntity<MessageDto> sendMessage(@PathVariable UUID id,
                                                   @Valid @RequestBody SendMessageRequest request) {
        Conversation conversation = conversationService.getById(id);
        MessageSender sender = request.getSender() != null ? request.getSender() : MessageSender.AGENT;

        Message saved;
        if (sender == MessageSender.CUSTOMER) {
            // Customer-originated send re-enters the flow/chat orchestration pipeline.
            saved = flowExecutionOrchestrator.handleInboundMessage(conversation, sender, request.getContent());
        } else {
            saved = messageService.save(id, sender, request.getContent(), request.getAttachmentUrl(), null, null);
            conversationService.touchLastMessage(conversation, saved, false);
        }

        return ResponseEntity.status(HttpStatus.CREATED).body(messageService.toDto(saved));
    }

    @PostMapping("/{id}/assign")
    public ResponseEntity<ConversationSummaryDto> assign(@PathVariable UUID id,
                                                           @Valid @RequestBody AssignConversationRequest request) {
        Conversation conversation = conversationService.assign(id, request.getUserId());
        return ResponseEntity.ok(conversationService.toSummaryDto(conversation));
    }
}
