package com.smartify.support.repository;

import com.smartify.support.model.Alert;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface AlertRepository extends JpaRepository<Alert, UUID> {

    List<Alert> findByTeamIdOrderByOccurredAtDesc(UUID teamId);

    List<Alert> findByTeamIdAndIsReadFalseOrderByOccurredAtDesc(UUID teamId);
}
