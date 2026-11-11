package com.smartify.support.config;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.lang.NonNull;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.HexFormat;

/**
 * Verifies an HMAC-SHA256 signature on inbound channel webhooks before they
 * reach {@code ChannelWebhookController}, so an attacker who can reach the
 * endpoint can't inject fake customer messages into arbitrary conversations.
 * <p>
 * Mirrors how real providers (Meta's X-Hub-Signature-256, Stripe, etc.) sign
 * webhook bodies: the sender computes HMAC-SHA256 over the raw request body
 * using a shared secret and sends it as {@code X-Webhook-Signature: sha256=<hex>}.
 */
@Slf4j
@Component
public class WebhookSignatureFilter extends OncePerRequestFilter {

    private static final String SIGNATURE_HEADER = "X-Webhook-Signature";
    private static final String SIGNATURE_PREFIX = "sha256=";
    private static final String HMAC_ALGORITHM = "HmacSHA256";

    private final String sharedSecret;

    public WebhookSignatureFilter(@Value("${webhook.shared-secret}") String sharedSecret) {
        this.sharedSecret = sharedSecret;
    }

    @Override
    protected void doFilterInternal(@NonNull HttpServletRequest request,
                                     @NonNull HttpServletResponse response,
                                     @NonNull FilterChain filterChain) throws ServletException, IOException {
        if (!request.getRequestURI().startsWith("/api/webhooks/")) {
            filterChain.doFilter(request, response);
            return;
        }

        byte[] body = request.getInputStream().readAllBytes();
        String signatureHeader = request.getHeader(SIGNATURE_HEADER);

        if (signatureHeader == null || !isValidSignature(body, signatureHeader)) {
            log.warn("Rejected webhook request to {} -- missing or invalid {} header",
                    request.getRequestURI(), SIGNATURE_HEADER);
            response.sendError(HttpServletResponse.SC_UNAUTHORIZED, "missing or invalid webhook signature");
            return;
        }

        filterChain.doFilter(new CachedBodyHttpServletRequest(request, body), response);
    }

    boolean isValidSignature(byte[] body, String signatureHeader) {
        String expected = SIGNATURE_PREFIX + hmacSha256Hex(body);
        // Constant-time comparison so this can't be used as a timing oracle.
        return MessageDigest.isEqual(
                expected.getBytes(StandardCharsets.UTF_8),
                signatureHeader.getBytes(StandardCharsets.UTF_8));
    }

    String hmacSha256Hex(byte[] body) {
        try {
            Mac mac = Mac.getInstance(HMAC_ALGORITHM);
            mac.init(new SecretKeySpec(sharedSecret.getBytes(StandardCharsets.UTF_8), HMAC_ALGORITHM));
            return HexFormat.of().formatHex(mac.doFinal(body));
        } catch (NoSuchAlgorithmException | java.security.InvalidKeyException e) {
            throw new IllegalStateException("Unable to compute webhook HMAC", e);
        }
    }
}
