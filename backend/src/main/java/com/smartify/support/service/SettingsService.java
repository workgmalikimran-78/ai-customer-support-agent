package com.smartify.support.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.smartify.support.dto.response.WorkspaceSettingsDto;
import com.smartify.support.exception.ResourceNotFoundException;
import com.smartify.support.model.Team;
import com.smartify.support.repository.TeamRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class SettingsService {

    private final TeamRepository teamRepository;
    private final ObjectMapper objectMapper;

    public WorkspaceSettingsDto getSettings(UUID teamId) {
        Team team = getTeam(teamId);
        return parseJson(team.getSettingsJson());
    }

    @Transactional
    public WorkspaceSettingsDto updateSettings(UUID teamId, WorkspaceSettingsDto settings) {
        Team team = getTeam(teamId);
        team.setSettingsJson(writeJson(settings));
        teamRepository.save(team);
        return settings;
    }

    private Team getTeam(UUID teamId) {
        return teamRepository.findById(teamId)
                .orElseThrow(() -> new ResourceNotFoundException("Team not found: " + teamId));
    }

    private String writeJson(WorkspaceSettingsDto settings) {
        try {
            return objectMapper.writeValueAsString(settings);
        } catch (Exception e) {
            log.warn("Failed to serialize workspace settings", e);
            return "{}";
        }
    }

    private WorkspaceSettingsDto parseJson(String json) {
        if (json == null || json.isBlank()) {
            return WorkspaceSettingsDto.builder().build();
        }
        try {
            return objectMapper.readValue(json, WorkspaceSettingsDto.class);
        } catch (Exception e) {
            log.warn("Failed to parse workspace settings, returning defaults", e);
            return WorkspaceSettingsDto.builder().build();
        }
    }
}
