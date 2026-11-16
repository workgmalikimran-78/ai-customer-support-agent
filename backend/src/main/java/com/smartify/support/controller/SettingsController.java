package com.smartify.support.controller;

import com.smartify.support.dto.response.WorkspaceSettingsDto;
import com.smartify.support.model.User;
import com.smartify.support.service.SettingsService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * The {teamId} path segment matches the frontend's existing call shape but is
 * never trusted for authorization -- which team's settings this resolves to
 * is always derived from the authenticated user, same as TeamController,
 * so a user can never read/edit another team's settings by editing the URL.
 */
@RestController
@RequestMapping("/api/teams/{teamId}/settings")
@RequiredArgsConstructor
public class SettingsController {

    private final SettingsService settingsService;
    private final AuthenticatedUserResolver authenticatedUserResolver;

    @GetMapping
    public ResponseEntity<WorkspaceSettingsDto> get() {
        User currentUser = authenticatedUserResolver.currentUser();
        return ResponseEntity.ok(settingsService.getSettings(currentUser.getTeamId()));
    }

    @PutMapping
    public ResponseEntity<WorkspaceSettingsDto> update(@Valid @RequestBody WorkspaceSettingsDto request) {
        User currentUser = authenticatedUserResolver.currentUser();
        return ResponseEntity.ok(settingsService.updateSettings(currentUser.getTeamId(), request));
    }
}
