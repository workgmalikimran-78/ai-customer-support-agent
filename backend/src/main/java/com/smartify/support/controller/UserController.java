package com.smartify.support.controller;

import com.smartify.support.dto.request.UpdateUserRoleRequest;
import com.smartify.support.dto.response.UserDto;
import com.smartify.support.model.User;
import com.smartify.support.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @PatchMapping("/{id}/role")
    public ResponseEntity<UserDto> updateRole(@PathVariable UUID id, @Valid @RequestBody UpdateUserRoleRequest request) {
        User updated = userService.updateRole(id, request.getRole());
        return ResponseEntity.ok(userService.toDto(updated));
    }
}
