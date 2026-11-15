package com.smartify.support.controller;

import com.smartify.support.config.CustomerPrincipal;
import org.springframework.security.authentication.InsufficientAuthenticationException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

/**
 * Resolves the currently authenticated customer from the SecurityContext (set by
 * CustomerJwtAuthFilter). Mirrors AuthenticatedUserResolver's shape for the agent side.
 */
@Component
public class CustomerPrincipalResolver {

    public CustomerPrincipal currentCustomer() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !(authentication.getPrincipal() instanceof CustomerPrincipal principal)) {
            throw new InsufficientAuthenticationException("No authenticated customer in context");
        }
        return principal;
    }

    /** Returns null instead of throwing -- for endpoints like webchat that work anonymously
     * too, where an authenticated customer is an optional enhancement, not a requirement. */
    public CustomerPrincipal currentCustomerOrNull() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.getPrincipal() instanceof CustomerPrincipal principal) {
            return principal;
        }
        return null;
    }
}
