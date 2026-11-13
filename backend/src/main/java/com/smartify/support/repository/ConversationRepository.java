package com.smartify.support.repository;

import com.smartify.support.model.Conversation;
import com.smartify.support.model.enums.ConversationStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.UUID;

public interface ConversationRepository extends JpaRepository<Conversation, UUID> {

    @Query("""
            select c from Conversation c
            where (:status is null or c.status = :status)
              and (:channelId is null or c.channelId = :channelId)
              and (:search is null or lower(c.lastMessagePreview) like lower(concat('%', cast(:search as string), '%')))
            order by c.lastMessageAt desc nulls last
            """)
    Page<Conversation> search(@Param("status") ConversationStatus status,
                               @Param("channelId") UUID channelId,
                               @Param("search") String search,
                               Pageable pageable);

    long countByStatus(ConversationStatus status);
}
