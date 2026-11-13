package com.smartify.support.config;

import com.smartify.support.exception.LoginRateLimitExceededException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * In-memory brute-force guard for /api/auth/login, keyed by client IP + email so a shared
 * NAT IP doesn't lock out every account behind it. Single-instance only (no shared state across
 * backend replicas) -- acceptable for this scaffold's single-node deployment; a multi-instance
 * deployment would need to move this to Redis (already used by ai-service, see docker-compose.yml).
 */
@Component
public class LoginRateLimiter {

    private record Attempt(int failureCount, Instant firstFailureAt, Instant blockedUntil) {
    }

    private final Map<String, Attempt> attempts = new ConcurrentHashMap<>();
    private final int maxAttempts;
    private final Duration window;
    private final Duration lockout;

    public LoginRateLimiter(
            @Value("${app.security.login-rate-limit.max-attempts:5}") int maxAttempts,
            @Value("${app.security.login-rate-limit.window-minutes:15}") long windowMinutes,
            @Value("${app.security.login-rate-limit.lockout-minutes:15}") long lockoutMinutes) {
        this.maxAttempts = maxAttempts;
        this.window = Duration.ofMinutes(windowMinutes);
        this.lockout = Duration.ofMinutes(lockoutMinutes);
    }

    public static String keyFor(String clientIp, String email) {
        return clientIp + "|" + email.toLowerCase();
    }

    public void checkNotBlocked(String key) {
        Attempt attempt = attempts.get(key);
        if (attempt == null || attempt.blockedUntil() == null) {
            return;
        }
        Instant now = Instant.now();
        if (now.isBefore(attempt.blockedUntil())) {
            throw new LoginRateLimitExceededException(Duration.between(now, attempt.blockedUntil()).getSeconds());
        }
        attempts.remove(key, attempt);
    }

    public void recordFailure(String key) {
        attempts.compute(key, (k, existing) -> {
            Instant now = Instant.now();
            boolean staleWindow = existing != null
                    && existing.blockedUntil() == null
                    && now.isAfter(existing.firstFailureAt().plus(window));
            boolean startNewWindow = existing == null || staleWindow;
            int newCount = startNewWindow ? 1 : existing.failureCount() + 1;
            Instant firstFailureAt = startNewWindow ? now : existing.firstFailureAt();
            Instant blockedUntil = newCount >= maxAttempts ? now.plus(lockout) : null;
            return new Attempt(newCount, firstFailureAt, blockedUntil);
        });
    }

    public void recordSuccess(String key) {
        attempts.remove(key);
    }

    @Scheduled(fixedRate = 300_000)
    void evictExpiredEntries() {
        Instant now = Instant.now();
        attempts.entrySet().removeIf(entry -> {
            Attempt a = entry.getValue();
            return a.blockedUntil() != null ? now.isAfter(a.blockedUntil()) : now.isAfter(a.firstFailureAt().plus(window));
        });
    }
}
