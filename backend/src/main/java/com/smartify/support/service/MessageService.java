package com.smartify.support.service;

import com.smartify.support.dto.response.MessageDto;
import com.smartify.support.model.Message;
import com.smartify.support.model.enums.MessageSender;
import com.smartify.support.repository.MessageRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.Comparator;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class MessageService {

    private final MessageRepository messageRepository;

    @Transactional
    public Message save(UUID conversationId, MessageSender sender, String content, String attachmentUrl,
                         String nodeId, String metadata) {
        Message message = Message.builder()
                .conversationId(conversationId)
                .sender(sender)
                .content(content)
                .attachmentUrl(attachmentUrl)
                .nodeId(nodeId)
                .metadata(metadata)
                .build();
        return messageRepository.save(message);
    }

    public List<Message> listForConversation(UUID conversationId, Instant before, int limit) {
        int pageSize = limit > 0 ? limit : 50;
        PageRequest pageRequest = PageRequest.of(0, pageSize, Sort.by("createdAt").descending());
        // Branching here (rather than a "before is null or ..." clause in the query) sidesteps
        // a Hibernate/pgjdbc quirk where a null Instant bind parameter gets sent with an
        // unresolvable type, and Postgres rejects the resulting cast ("cannot cast type bytea
        // to timestamp with time zone").
        List<Message> messages = before == null
                ? messageRepository.findByConversationIdOrderByCreatedAtDesc(conversationId, pageRequest)
                : messageRepository.findBefore(conversationId, before, pageRequest);
        return messages.stream()
                .sorted(Comparator.comparing(Message::getCreatedAt))
                .collect(Collectors.toList());
    }

    public List<Message> lastNForConversation(UUID conversationId, int n) {
        List<Message> messages = messageRepository.findTop20ByConversationIdOrderByCreatedAtDesc(conversationId);
        List<Message> limited = messages.size() > n ? messages.subList(0, n) : messages;
        return limited.stream()
                .sorted(Comparator.comparing(Message::getCreatedAt))
                .collect(Collectors.toList());
    }

    public MessageDto toDto(Message message) {
        return MessageDto.builder()
                .id(message.getId())
                .conversationId(message.getConversationId())
                .sender(message.getSender().name())
                .content(message.getContent())
                .attachmentUrl(message.getAttachmentUrl())
                .nodeId(message.getNodeId())
                .metadata(message.getMetadata())
                .createdAt(message.getCreatedAt())
                .build();
    }
}
