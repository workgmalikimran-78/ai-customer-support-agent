package com.smartify.support.config;

import java.util.UUID;

/**
 * Lightweight principal for the customer (shop) auth flow. Not a Spring Security UserDetails --
 * customers don't go through AuthenticationManager/DaoAuthenticationProvider (see
 * CustomerService's class-level note), so there's no need to fit this into that contract.
 */
public record CustomerPrincipal(UUID customerId, String email) {
}
