package com.smartify.support.service;

import com.smartify.support.dto.request.WebhookPayload;
import com.smartify.support.model.Channel;
import com.smartify.support.model.Contact;
import com.smartify.support.model.Conversation;
import com.smartify.support.model.Message;
import com.smartify.support.model.enums.ChannelType;
import com.smartify.support.model.enums.ConversationStatus;
import com.smartify.support.model.enums.MessageSender;
import com.smartify.support.repository.ChannelRepository;
import com.smartify.support.repository.ContactRepository;
import com.smartify.support.repository.ConversationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;

/**
 * Normalizes inbound channel webhook payloads into Contact/Conversation/Message rows.
 * WhatsApp, Facebook Messenger and web chat are all treated identically for now -
 * there is no real third-party API integration here, just normalized ingestion.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class ChannelIngestionService {

    private final ChannelRepository channelRepository;
    private final ContactRepository contactRepository;
    private final ConversationRepository conversationRepository;
    private final FlowExecutionOrchestrator flowExecutionOrchestrator;

    @Transactional
    public Message ingest(String channelSlug, WebhookPayload payload) {
        ChannelType channelType = resolveChannelType(channelSlug);
        Channel channel = channelRepository.findFirstByType(channelType)
                .orElseGet(() -> channelRepository.save(Channel.builder()
                        .type(channelType)
                        .displayName(channelType.name())
                        .isActive(true)
                        .build()));

        Contact contact = contactRepository.findByChannelIdAndExternalId(channel.getId(), payload.getExternalId())
                .orElseGet(() -> contactRepository.save(Contact.builder()
                        .channelId(channel.getId())
                        .externalId(payload.getExternalId())
                        .displayName(payload.getDisplayName() != null ? payload.getDisplayName() : payload.getExternalId())
                        .build()));

        Conversation conversation = findOpenConversation(contact.getId(), channel.getId())
                .orElseGet(() -> conversationRepository.save(Conversation.builder()
                        .contactId(contact.getId())
                        .channelId(channel.getId())
                        .status(ConversationStatus.OPEN)
                        .unreadCount(0)
                        .build()));

        Message message = flowExecutionOrchestrator.handleInboundMessage(conversation, MessageSender.CUSTOMER,
                payload.getText());

        log.info("Ingested message {} for conversation {} via channel {}", message.getId(), conversation.getId(),
                channelType);
        return message;
    }

    private java.util.Optional<Conversation> findOpenConversation(java.util.UUID contactId, java.util.UUID channelId) {
        return conversationRepository.findAll().stream()
                .filter(c -> c.getContactId().equals(contactId) && c.getChannelId().equals(channelId))
                .filter(c -> c.getStatus() != ConversationStatus.RESOLVED)
                .max(java.util.Comparator.comparing(Conversation::getCreatedAt, java.util.Comparator.nullsFirst(Instant::compareTo)));
    }

    private ChannelType resolveChannelType(String channelSlug) {
        String normalized = channelSlug == null ? "" : channelSlug.trim().toLowerCase();
        return switch (normalized) {
            case "whatsapp" -> ChannelType.WHATSAPP;
            case "facebook", "facebook_messenger", "messenger" -> ChannelType.FACEBOOK_MESSENGER;
            default -> ChannelType.WEB_CHAT;
        };
    }
}
