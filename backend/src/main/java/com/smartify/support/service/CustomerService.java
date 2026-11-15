package com.smartify.support.service;

import com.smartify.support.dto.request.CustomerRegisterRequest;
import com.smartify.support.exception.ResourceNotFoundException;
import com.smartify.support.model.Customer;
import com.smartify.support.repository.CustomerRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

/**
 * Customers authenticate separately from agents/admins (see CustomerJwtAuthFilter) -- this
 * class deliberately does not implement UserDetailsService. That interface is already wired
 * single-bean into SecurityConfig's DaoAuthenticationProvider for the agent login flow; adding
 * a second UserDetailsService bean would make that wiring ambiguous. CustomerAuthController
 * authenticates manually against this service and issues JWTs directly instead.
 */
@Service
@RequiredArgsConstructor
public class CustomerService {

    private final CustomerRepository customerRepository;
    private final PasswordEncoder passwordEncoder;

    @Transactional
    public Customer register(CustomerRegisterRequest request) {
        if (customerRepository.existsByEmail(request.getEmail())) {
            throw new IllegalArgumentException("A customer with that email already exists");
        }
        Customer customer = Customer.builder()
                .email(request.getEmail())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .displayName(request.getDisplayName())
                .phone(request.getPhone())
                .isActive(true)
                .build();
        return customerRepository.save(customer);
    }

    public Customer authenticate(String email, String rawPassword) {
        Customer customer = customerRepository.findByEmail(email)
                .orElseThrow(() -> new BadCredentialsException("Invalid email or password"));
        if (!customer.isActive() || !passwordEncoder.matches(rawPassword, customer.getPasswordHash())) {
            throw new BadCredentialsException("Invalid email or password");
        }
        return customer;
    }

    public Customer getById(UUID id) {
        return customerRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("No customer with id " + id));
    }
}
