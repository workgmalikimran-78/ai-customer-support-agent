package com.smartify.support.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.smartify.support.dto.request.CreateBotFlowRequest;
import com.smartify.support.dto.request.UpdateBotFlowRequest;
import com.smartify.support.dto.response.BotFlowDto;
import com.smartify.support.exception.ResourceNotFoundException;
import com.smartify.support.model.BotFlow;
import com.smartify.support.model.enums.BotFlowStatus;
import com.smartify.support.repository.BotFlowRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class BotFlowService {

    private final BotFlowRepository botFlowRepository;
    private final ObjectMapper objectMapper;

    public List<BotFlowDto> listAll() {
        return botFlowRepository.findAll().stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    public BotFlow getById(UUID id) {
        return botFlowRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Bot flow not found: " + id));
    }

    @Transactional
    public BotFlow create(CreateBotFlowRequest request) {
        BotFlow botFlow = BotFlow.builder()
                .name(request.getName())
                .description(request.getDescription())
                .status(BotFlowStatus.DRAFT)
                .version(1)
                .graphJson(writeJson(request.getGraphJson()))
                .build();
        return botFlowRepository.save(botFlow);
    }

    @Transactional
    public BotFlow update(UUID id, UpdateBotFlowRequest request) {
        BotFlow botFlow = getById(id);
        if (request.getName() != null) {
            botFlow.setName(request.getName());
        }
        if (request.getDescription() != null) {
            botFlow.setDescription(request.getDescription());
        }
        if (request.getGraphJson() != null) {
            botFlow.setGraphJson(writeJson(request.getGraphJson()));
            botFlow.setVersion(botFlow.getVersion() + 1);
        }
        return botFlowRepository.save(botFlow);
    }

    @Transactional
    public BotFlow publish(UUID id) {
        BotFlow botFlow = getById(id);
        botFlow.setStatus(BotFlowStatus.PUBLISHED);
        return botFlowRepository.save(botFlow);
    }

    public BotFlowDto toDto(BotFlow botFlow) {
        return BotFlowDto.builder()
                .id(botFlow.getId())
                .name(botFlow.getName())
                .description(botFlow.getDescription())
                .status(botFlow.getStatus().name())
                .version(botFlow.getVersion())
                .graphJson(parseJson(botFlow.getGraphJson()))
                .createdAt(botFlow.getCreatedAt())
                .updatedAt(botFlow.getUpdatedAt())
                .build();
    }

    private String writeJson(Map<String, Object> value) {
        try {
            return objectMapper.writeValueAsString(value != null ? value : Collections.emptyMap());
        } catch (Exception e) {
            log.warn("Failed to serialize bot flow graphJson", e);
            return "{}";
        }
    }

    @SuppressWarnings("unchecked")
    private Map<String, Object> parseJson(String json) {
        if (json == null || json.isBlank()) {
            return Collections.emptyMap();
        }
        try {
            return objectMapper.readValue(json, Map.class);
        } catch (Exception e) {
            log.warn("Failed to parse bot flow graphJson", e);
            return Collections.emptyMap();
        }
    }
}
