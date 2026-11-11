package com.smartify.support.controller;

import com.smartify.support.model.User;
import com.smartify.support.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component;

import java.util.UUID;

/**
 * Resolves the currently authenticated user (JWT subject = user id) to a full User entity
 * so controllers can scope queries by team.
 */
@Component
@RequiredArgsConstructor
public class AuthenticatedUserResolver {

    private final UserService userService;

    public User currentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !(authentication.getPrincipal() instanceof UserDetails userDetails)) {
            throw new org.springframework.security.authentication.InsufficientAuthenticationException(
                    "No authenticated user in context");
        }
        UUID userId = UUID.fromString(userDetails.getUsername());
        return userService.getUserById(userId);
    }
}
