package com.smartify.support.controller;

import com.smartify.support.config.JwtService;
import com.smartify.support.config.LoginRateLimiter;
import com.smartify.support.dto.request.CustomerLoginRequest;
import com.smartify.support.dto.request.CustomerRegisterRequest;
import com.smartify.support.dto.response.CustomerAuthResponse;
import com.smartify.support.model.Customer;
import com.smartify.support.service.CustomerService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

/**
 * Customer (shop) auth -- deliberately separate from AuthController's agent/admin flow. See
 * CustomerService's class-level note: customers authenticate manually here rather than through
 * AuthenticationManager, since that's already single-wired to the agent UserDetailsService.
 */
@RestController
@RequestMapping("/api/shop/auth")
@RequiredArgsConstructor
public class CustomerAuthController {

    private final CustomerService customerService;
    private final JwtService jwtService;
    private final LoginRateLimiter loginRateLimiter;

    @PostMapping("/register")
    public ResponseEntity<CustomerAuthResponse> register(@Valid @RequestBody CustomerRegisterRequest request) {
        Customer customer = customerService.register(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(toAuthResponse(customer));
    }

    @PostMapping("/login")
    public ResponseEntity<CustomerAuthResponse> login(@Valid @RequestBody CustomerLoginRequest request,
                                                        HttpServletRequest httpRequest) {
        String key = LoginRateLimiter.keyFor(clientIp(httpRequest), request.getEmail());
        loginRateLimiter.checkNotBlocked(key);

        Customer customer;
        try {
            customer = customerService.authenticate(request.getEmail(), request.getPassword());
        } catch (BadCredentialsException ex) {
            loginRateLimiter.recordFailure(key);
            throw ex;
        }
        loginRateLimiter.recordSuccess(key);

        return ResponseEntity.ok(toAuthResponse(customer));
    }

    private CustomerAuthResponse toAuthResponse(Customer customer) {
        String token = jwtService.generateToken(customer.getId().toString(), Map.of(
                "email", customer.getEmail(),
                "principalType", "CUSTOMER"));
        return CustomerAuthResponse.builder()
                .token(token)
                .customerId(customer.getId())
                .email(customer.getEmail())
                .displayName(customer.getDisplayName())
                .build();
    }

    private String clientIp(HttpServletRequest request) {
        String forwardedFor = request.getHeader("X-Forwarded-For");
        if (forwardedFor != null && !forwardedFor.isBlank()) {
            return forwardedFor.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }
}
