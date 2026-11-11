package com.smartify.support.repository;

import com.smartify.support.model.Contact;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface ContactRepository extends JpaRepository<Contact, UUID> {

    Optional<Contact> findByChannelIdAndExternalId(UUID channelId, String externalId);
}
