package com.smartify.support.controller;

import com.smartify.support.config.JwtService;
import com.smartify.support.dto.request.LoginRequest;
import com.smartify.support.dto.request.RegisterRequest;
import com.smartify.support.dto.response.AuthResponse;
import com.smartify.support.model.User;
import com.smartify.support.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthenticationManager authenticationManager;
    private final UserService userService;
    private final JwtService jwtService;

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(resolveUserId(request.getEmail()), request.getPassword()));

        User user = userService.getUserByEmail(request.getEmail());
        String token = jwtService.generateToken(user.getId().toString(), Map.of(
                "email", user.getEmail(),
                "role", user.getRole().name()));

        return ResponseEntity.ok(AuthResponse.builder()
                .token(token)
                .userId(user.getId())
                .email(user.getEmail())
                .displayName(user.getDisplayName())
                .role(user.getRole().name())
                .build());
    }

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest request) {
        User user = userService.register(request);
        String token = jwtService.generateToken(user.getId().toString(), Map.of(
                "email", user.getEmail(),
                "role", user.getRole().name()));

        return ResponseEntity.status(HttpStatus.CREATED).body(AuthResponse.builder()
                .token(token)
                .userId(user.getId())
                .email(user.getEmail())
                .displayName(user.getDisplayName())
                .role(user.getRole().name())
                .build());
    }

    /**
     * AuthenticationManager with our DaoAuthenticationProvider resolves principal via
     * UserDetailsService#loadUserByUsername(email), so we authenticate by email directly;
     * the resolved "username" there is used purely to drive the password check.
     */
    private String resolveUserId(String email) {
        return email;
    }
}
