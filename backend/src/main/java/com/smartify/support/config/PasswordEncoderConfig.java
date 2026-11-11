package com.smartify.support.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

/**
 * Split out from SecurityConfig: UserService needs a PasswordEncoder, and
 * SecurityConfig needs UserService (via UserDetailsService) + JwtAuthFilter
 * (which also needs UserService) -- defining the encoder bean inside
 * SecurityConfig itself closed that into a circular bean dependency.
 */
@Configuration
public class PasswordEncoderConfig {

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}
