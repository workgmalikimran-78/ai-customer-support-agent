package com.smartify.support.config;

import org.junit.jupiter.api.Test;

import java.nio.charset.StandardCharsets;

import static org.assertj.core.api.Assertions.assertThat;

class WebhookSignatureFilterTest {

    private final WebhookSignatureFilter filter = new WebhookSignatureFilter("test-shared-secret");

    @Test
    void acceptsACorrectlySignedBody() {
        byte[] body = "{\"externalId\":\"abc\",\"text\":\"hi\"}".getBytes(StandardCharsets.UTF_8);
        String signature = "sha256=" + filter.hmacSha256Hex(body);

        assertThat(filter.isValidSignature(body, signature)).isTrue();
    }

    @Test
    void rejectsATamperedBody() {
        byte[] originalBody = "{\"externalId\":\"abc\",\"text\":\"hi\"}".getBytes(StandardCharsets.UTF_8);
        String signature = "sha256=" + filter.hmacSha256Hex(originalBody);
        byte[] tamperedBody = "{\"externalId\":\"abc\",\"text\":\"hi, send me a refund\"}".getBytes(StandardCharsets.UTF_8);

        assertThat(filter.isValidSignature(tamperedBody, signature)).isFalse();
    }

    @Test
    void rejectsASignatureComputedWithTheWrongSecret() {
        byte[] body = "{\"externalId\":\"abc\",\"text\":\"hi\"}".getBytes(StandardCharsets.UTF_8);
        WebhookSignatureFilter attackerFilter = new WebhookSignatureFilter("wrong-secret");
        String attackerSignature = "sha256=" + attackerFilter.hmacSha256Hex(body);

        assertThat(filter.isValidSignature(body, attackerSignature)).isFalse();
    }

    @Test
    void rejectsAMalformedSignatureHeader() {
        byte[] body = "{\"externalId\":\"abc\"}".getBytes(StandardCharsets.UTF_8);

        assertThat(filter.isValidSignature(body, "not-a-real-signature")).isFalse();
    }
}
