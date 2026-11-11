package com.smartify.support.repository;

import com.smartify.support.model.Channel;
import com.smartify.support.model.enums.ChannelType;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface ChannelRepository extends JpaRepository<Channel, UUID> {

    Optional<Channel> findFirstByType(ChannelType type);
}
