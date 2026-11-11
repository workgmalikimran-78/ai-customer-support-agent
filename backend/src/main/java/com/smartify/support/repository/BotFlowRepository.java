package com.smartify.support.repository;

import com.smartify.support.model.BotFlow;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface BotFlowRepository extends JpaRepository<BotFlow, UUID> {
}
