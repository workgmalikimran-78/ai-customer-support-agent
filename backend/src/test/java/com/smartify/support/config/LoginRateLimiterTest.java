package com.smartify.support.config;

import com.smartify.support.exception.LoginRateLimitExceededException;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class LoginRateLimiterTest {

    @Test
    void allowsAttemptsUnderTheThreshold() {
        LoginRateLimiter limiter = new LoginRateLimiter(3, 15, 15);
        String key = LoginRateLimiter.keyFor("127.0.0.1", "user@example.com");

        limiter.checkNotBlocked(key);
        limiter.recordFailure(key);
        limiter.checkNotBlocked(key);
        limiter.recordFailure(key);
        limiter.checkNotBlocked(key); // 2 failures, below the threshold of 3 -- must not throw
    }

    @Test
    void blocksAfterReachingMaxAttempts() {
        LoginRateLimiter limiter = new LoginRateLimiter(3, 15, 15);
        String key = LoginRateLimiter.keyFor("127.0.0.1", "user@example.com");

        limiter.recordFailure(key);
        limiter.recordFailure(key);
        limiter.recordFailure(key);

        assertThatThrownBy(() -> limiter.checkNotBlocked(key))
                .isInstanceOf(LoginRateLimitExceededException.class);
    }

    @Test
    void retryAfterSecondsIsPositiveWhileBlocked() {
        LoginRateLimiter limiter = new LoginRateLimiter(1, 15, 15);
        String key = LoginRateLimiter.keyFor("127.0.0.1", "user@example.com");

        limiter.recordFailure(key);

        assertThatThrownBy(() -> limiter.checkNotBlocked(key))
                .isInstanceOf(LoginRateLimitExceededException.class)
                .satisfies(ex -> assertThat(((LoginRateLimitExceededException) ex).getRetryAfterSeconds()).isGreaterThan(0));
    }

    @Test
    void successClearsFailureHistory() {
        LoginRateLimiter limiter = new LoginRateLimiter(2, 15, 15);
        String key = LoginRateLimiter.keyFor("127.0.0.1", "user@example.com");

        limiter.recordFailure(key);
        limiter.recordSuccess(key);
        limiter.recordFailure(key);

        limiter.checkNotBlocked(key); // only 1 failure since reset, should not throw
    }

    @Test
    void differentKeysAreTrackedIndependently() {
        LoginRateLimiter limiter = new LoginRateLimiter(1, 15, 15);
        String attackerKey = LoginRateLimiter.keyFor("10.0.0.1", "victim@example.com");
        String legitimateKey = LoginRateLimiter.keyFor("10.0.0.2", "victim@example.com");

        limiter.recordFailure(attackerKey);

        assertThatThrownBy(() -> limiter.checkNotBlocked(attackerKey))
                .isInstanceOf(LoginRateLimitExceededException.class);
        limiter.checkNotBlocked(legitimateKey); // different IP, not blocked
    }
}
