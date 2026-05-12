package com.xingmeng.aiplatform.module.auth.security;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Base64;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Optional;

@Service
public class JwtService {
    private static final ObjectMapper OBJECT_MAPPER = new ObjectMapper();
    private final String secret;
    private final long expirationMinutes;

    public JwtService(
            @Value("${app.jwt.secret}") String secret,
            @Value("${app.jwt.expiration-minutes}") long expirationMinutes
    ) {
        this.secret = secret;
        this.expirationMinutes = expirationMinutes;
    }

    public String createToken(Long userId, String username) {
        try {
            Map<String, Object> header = Map.of("alg", "HS256", "typ", "JWT");
            Map<String, Object> payload = new LinkedHashMap<>();
            payload.put("sub", username);
            payload.put("uid", userId);
            payload.put("exp", Instant.now().plusSeconds(expirationMinutes * 60).getEpochSecond());
            String unsignedToken = base64Json(header) + "." + base64Json(payload);
            return unsignedToken + "." + sign(unsignedToken);
        } catch (Exception exception) {
            throw new IllegalStateException("Failed to create token", exception);
        }
    }

    public Optional<String> verifyAndGetUsername(String token) {
        try {
            String[] parts = token.split("\\.");
            if (parts.length != 3) {
                return Optional.empty();
            }
            String unsignedToken = parts[0] + "." + parts[1];
            if (!MessageDigestSafe.equals(sign(unsignedToken), parts[2])) {
                return Optional.empty();
            }
            byte[] payloadBytes = Base64.getUrlDecoder().decode(parts[1]);
            Map<String, Object> payload = OBJECT_MAPPER.readValue(payloadBytes, new TypeReference<>() {});
            Number expiresAt = (Number) payload.get("exp");
            if (expiresAt == null || expiresAt.longValue() < Instant.now().getEpochSecond()) {
                return Optional.empty();
            }
            return Optional.ofNullable((String) payload.get("sub"));
        } catch (Exception exception) {
            return Optional.empty();
        }
    }

    private String base64Json(Map<String, Object> value) throws Exception {
        byte[] json = OBJECT_MAPPER.writeValueAsBytes(value);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(json);
    }

    private String sign(String value) throws Exception {
        Mac mac = Mac.getInstance("HmacSHA256");
        mac.init(new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
        return Base64.getUrlEncoder().withoutPadding().encodeToString(mac.doFinal(value.getBytes(StandardCharsets.UTF_8)));
    }

    private static final class MessageDigestSafe {
        private MessageDigestSafe() {
        }

        private static boolean equals(String left, String right) {
            byte[] leftBytes = left.getBytes(StandardCharsets.UTF_8);
            byte[] rightBytes = right.getBytes(StandardCharsets.UTF_8);
            if (leftBytes.length != rightBytes.length) {
                return false;
            }
            int result = 0;
            for (int index = 0; index < leftBytes.length; index++) {
                result |= leftBytes[index] ^ rightBytes[index];
            }
            return result == 0;
        }
    }
}

