package com.smartify.support.controller;

import com.smartify.support.dto.request.InviteTeamMemberRequest;
import com.smartify.support.dto.response.UserDto;
import com.smartify.support.model.User;
import com.smartify.support.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/team")
@RequiredArgsConstructor
public class TeamController {

    private final UserService userService;
    private final AuthenticatedUserResolver authenticatedUserResolver;

    @GetMapping
    public ResponseEntity<List<UserDto>> list() {
        User currentUser = authenticatedUserResolver.currentUser();
        return ResponseEntity.ok(userService.listTeam(currentUser.getTeamId()));
    }

    @PostMapping("/invite")
    public ResponseEntity<UserDto> invite(@Valid @RequestBody InviteTeamMemberRequest request) {
        User currentUser = authenticatedUserResolver.currentUser();
        User invited = userService.invite(currentUser.getTeamId(), request);
        return ResponseEntity.status(HttpStatus.CREATED).body(userService.toDto(invited));
    }
}
