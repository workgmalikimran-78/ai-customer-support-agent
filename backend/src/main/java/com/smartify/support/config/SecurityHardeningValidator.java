package com.smartify.support.config;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;
import java.util.Set;

/**
 * Refuses to start the app if critical secrets are still unset or match a
 * known local-dev placeholder, when {@code app.security.require-strong-secrets}
 * is true. That flag defaults to false so local/docker-compose dev keeps
 * working with the convenience defaults in application.yml -- set
 * REQUIRE_STRONG_SECRETS=true for any deployment reachable outside localhost.
 */
@Slf4j
@Component
public class SecurityHardeningValidator implements ApplicationRunner {

    private static final int MIN_SECRET_LENGTH = 32;

    private static final Set<String> KNOWN_PLACEHOLDER_SECRETS = Set.of(
            "dev-only-secret-change-me",
            "dev-shared-secret",
            "dev-webhook-secret-change-me");

    private final boolean requireStrongSecrets;
    private final String jwtSecret;
    private final String aiServiceApiKey;
    private final String webhookSharedSecret;

    public SecurityHardeningValidator(
            @Value("${app.security.require-strong-secrets:false}") boolean requireStrongSecrets,
            @Value("${jwt.secret}") String jwtSecret,
            @Value("${ai-service.api-key:}") String aiServiceApiKey,
            @Value("${webhook.shared-secret}") String webhookSharedSecret) {
        this.requireStrongSecrets = requireStrongSecrets;
        this.jwtSecret = jwtSecret;
        this.aiServiceApiKey = aiServiceApiKey;
        this.webhookSharedSecret = webhookSharedSecret;
    }

    @Override
    public void run(ApplicationArguments args) {
        if (!requireStrongSecrets) {
            log.info("app.security.require-strong-secrets=false -- skipping secret strength checks "
                    + "(expected for local/docker-compose dev; set REQUIRE_STRONG_SECRETS=true for any "
                    + "deployment reachable outside localhost)");
            return;
        }

        List<String> problems = new ArrayList<>();
        if (isWeak(jwtSecret)) {
            problems.add("jwt.secret (env JWT_SECRET)");
        }
        if (isWeak(aiServiceApiKey)) {
            problems.add("ai-service.api-key (env AI_SERVICE_API_KEY)");
        }
        if (isWeak(webhookSharedSecret)) {
            problems.add("webhook.shared-secret (env WEBHOOK_SHARED_SECRET)");
        }

        if (!problems.isEmpty()) {
            throw new IllegalStateException(
                    "Refusing to start with REQUIRE_STRONG_SECRETS=true: the following secrets are "
                            + "unset, shorter than " + MIN_SECRET_LENGTH + " characters, or still a known "
                            + "placeholder value: " + problems
                            + ". Provide real secret values via environment variables, or set "
                            + "REQUIRE_STRONG_SECRETS=false only for local development.");
        }
    }

    private boolean isWeak(String secret) {
        return secret == null
                || secret.isBlank()
                || secret.length() < MIN_SECRET_LENGTH
                || KNOWN_PLACEHOLDER_SECRETS.contains(secret);
    }
}
