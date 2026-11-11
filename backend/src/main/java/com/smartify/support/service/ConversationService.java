package com.smartify.support.service;

import com.smartify.support.dto.response.ConversationSummaryDto;
import com.smartify.support.dto.response.MessageDto;
import com.smartify.support.dto.response.PagedResponse;
import com.smartify.support.exception.ResourceNotFoundException;
import com.smartify.support.model.Channel;
import com.smartify.support.model.Contact;
import com.smartify.support.model.Conversation;
import com.smartify.support.model.Message;
import com.smartify.support.model.enums.ConversationStatus;
import com.smartify.support.model.enums.MessageSender;
import com.smartify.support.repository.ChannelRepository;
import com.smartify.support.repository.ContactRepository;
import com.smartify.support.repository.ConversationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ConversationService {

    private static final int DEFAULT_PREVIEW_LENGTH = 140;

    private final ConversationRepository conversationRepository;
    private final ContactRepository contactRepository;
    private final ChannelRepository channelRepository;
    private final MessageService messageService;

    public PagedResponse<ConversationSummaryDto> search(ConversationStatus status, UUID channelId, String search,
                                                          int page, int size) {
        PageRequest pageRequest = PageRequest.of(Math.max(page, 0), size > 0 ? size : 20,
                Sort.by("lastMessageAt").descending());
        Page<Conversation> result = conversationRepository.search(status, channelId, search, pageRequest);

        List<ConversationSummaryDto> dtos = result.getContent().stream()
                .map(this::toSummaryDto)
                .collect(Collectors.toList());

        return PagedResponse.<ConversationSummaryDto>builder()
                .items(dtos)
                .page(result.getNumber())
                .size(result.getSize())
                .totalElements(result.getTotalElements())
                .totalPages(result.getTotalPages())
                .build();
    }

    public Conversation getById(UUID id) {
        return conversationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Conversation not found: " + id));
    }

    public List<MessageDto> getMessages(UUID conversationId, Instant before, int limit) {
        // Validate the conversation exists so callers get a 404 instead of an empty list.
        getById(conversationId);
        return messageService.listForConversation(conversationId, before, limit).stream()
                .map(messageService::toDto)
                .collect(Collectors.toList());
    }

    @Transactional
    public Conversation assign(UUID conversationId, UUID userId) {
        Conversation conversation = getById(conversationId);
        conversation.setAssignedUserId(userId);
        if (conversation.getStatus() == ConversationStatus.OPEN) {
            conversation.setStatus(ConversationStatus.PENDING);
        }
        return conversationRepository.save(conversation);
    }

    @Transactional
    public void touchLastMessage(Conversation conversation, Message message, boolean incrementUnread) {
        conversation.setLastMessageAt(message.getCreatedAt() != null ? message.getCreatedAt() : Instant.now());
        conversation.setLastMessagePreview(truncate(message.getContent()));
        if (incrementUnread) {
            conversation.setUnreadCount(conversation.getUnreadCount() + 1);
        }
        conversationRepository.save(conversation);
    }

    @Transactional
    public Conversation save(Conversation conversation) {
        return conversationRepository.save(conversation);
    }

    public ConversationSummaryDto toSummaryDto(Conversation conversation) {
        Contact contact = contactRepository.findById(conversation.getContactId()).orElse(null);
        Channel channel = channelRepository.findById(conversation.getChannelId()).orElse(null);

        return ConversationSummaryDto.builder()
                .id(conversation.getId())
                .contactId(conversation.getContactId())
                .contactDisplayName(contact != null ? contact.getDisplayName() : null)
                .contactAvatarUrl(contact != null ? contact.getAvatarUrl() : null)
                .channelId(conversation.getChannelId())
                .channelType(channel != null ? channel.getType().name() : null)
                .assignedUserId(conversation.getAssignedUserId())
                .status(conversation.getStatus().name())
                .unreadCount(conversation.getUnreadCount())
                .lastMessagePreview(conversation.getLastMessagePreview())
                .lastMessageAt(conversation.getLastMessageAt())
                .sentimentScore(conversation.getSentimentScore())
                .build();
    }

    private String truncate(String content) {
        if (content == null) {
            return null;
        }
        return content.length() > DEFAULT_PREVIEW_LENGTH
                ? content.substring(0, DEFAULT_PREVIEW_LENGTH) + "..."
                : content;
    }
}
