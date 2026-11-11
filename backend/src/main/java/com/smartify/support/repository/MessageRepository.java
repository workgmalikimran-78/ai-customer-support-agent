package com.smartify.support.repository;

import com.smartify.support.model.Message;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public interface MessageRepository extends JpaRepository<Message, UUID> {

    List<Message> findByConversationIdOrderByCreatedAtDesc(UUID conversationId, Pageable pageable);

    @Query("""
            select m from Message m
            where m.conversationId = :conversationId
              and (:before is null or m.createdAt < :before)
            order by m.createdAt desc
            """)
    List<Message> findBefore(@Param("conversationId") UUID conversationId,
                              @Param("before") Instant before,
                              Pageable pageable);

    List<Message> findTop20ByConversationIdOrderByCreatedAtDesc(UUID conversationId);

    long countByConversationIdAndSenderAndContentContainingIgnoreCaseAndCreatedAtAfter(
            UUID conversationId, com.smartify.support.model.enums.MessageSender sender, String keyword, Instant after);

    long countBySenderAndContentContainingIgnoreCaseAndCreatedAtAfter(
            com.smartify.support.model.enums.MessageSender sender, String keyword, Instant after);
}
