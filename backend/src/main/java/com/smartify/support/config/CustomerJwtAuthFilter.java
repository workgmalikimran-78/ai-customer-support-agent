package com.smartify.support.config;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.lang.NonNull;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;
import java.util.UUID;

/**
 * Parallel to JwtAuthFilter, for the customer (shop) principal type rather than the agent/admin
 * User model. A single shared JwtService issues tokens for both (it's generic), but resolving a
 * token's subject into a principal requires knowing which table it belongs to -- disambiguated
 * here via a "principalType" claim set at issuance time (CustomerAuthController sets "CUSTOMER";
 * AuthController sets "AGENT" symmetrically). Two small filters are simpler and safer than one
 * filter branching between two completely different lookup paths and exception types.
 * <p>
 * Runs on every request (including permitAll routes like /api/webchat/**) so that an optional
 * customer JWT on an otherwise-anonymous endpoint still gets resolved into the SecurityContext --
 * that's the mechanism WebChatController uses to attribute a conversation to a logged-in
 * customer without requiring login to use the widget at all.
 */
@Component
@RequiredArgsConstructor
public class CustomerJwtAuthFilter extends OncePerRequestFilter {

    private static final String PRINCIPAL_TYPE_CLAIM = "principalType";
    private static final String CUSTOMER_PRINCIPAL_TYPE = "CUSTOMER";

    private final JwtService jwtService;

    @Override
    protected void doFilterInternal(@NonNull HttpServletRequest request,
                                     @NonNull HttpServletResponse response,
                                     @NonNull FilterChain filterChain) throws ServletException, IOException {
        String authHeader = request.getHeader("Authorization");

        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            filterChain.doFilter(request, response);
            return;
        }

        String token = authHeader.substring(7);
        try {
            if (SecurityContextHolder.getContext().getAuthentication() == null && jwtService.isTokenValid(token)) {
                var claims = jwtService.extractAllClaims(token);
                if (CUSTOMER_PRINCIPAL_TYPE.equals(claims.get(PRINCIPAL_TYPE_CLAIM))) {
                    UUID customerId = UUID.fromString(claims.getSubject());
                    String email = claims.get("email", String.class);
                    CustomerPrincipal principal = new CustomerPrincipal(customerId, email);
                    UsernamePasswordAuthenticationToken authToken = new UsernamePasswordAuthenticationToken(
                            principal, null, List.of(new SimpleGrantedAuthority("ROLE_CUSTOMER")));
                    authToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                    SecurityContextHolder.getContext().setAuthentication(authToken);
                }
            }
        } catch (Exception ex) {
            // Invalid/expired/foreign token: leave request unauthenticated, Security (or the
            // calling controller, for permitAll routes) handles the anonymous case downstream.
            SecurityContextHolder.clearContext();
        }

        filterChain.doFilter(request, response);
    }
}
