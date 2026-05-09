package com.softcode.prodsyncapi.security;

import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;

import static org.junit.jupiter.api.Assertions.*;

class JwtServiceTest {

    private JwtService jwtService;
    private static final String SECRET = "my-super-secret-key-that-is-at-least-32-chars-long!";
    private static final long EXPIRATION_MS = 3600000; // 1 hour

    @BeforeEach
    void setUp() {
        jwtService = new JwtService(SECRET, EXPIRATION_MS);
    }

    @Test
    void generateToken_shouldReturnNonNullToken() {
        String token = jwtService.generateToken("testuser");
        assertNotNull(token);
        assertFalse(token.isBlank());
    }

    @Test
    void extractUsername_shouldReturnCorrectUsername() {
        String token = jwtService.generateToken("testuser");
        String username = jwtService.extractUsername(token);
        assertEquals("testuser", username);
    }

    @Test
    void isValid_shouldReturnTrue_forValidToken() {
        String token = jwtService.generateToken("testuser");
        assertTrue(jwtService.isValid(token));
    }

    @Test
    void isValid_shouldReturnFalse_forInvalidToken() {
        assertFalse(jwtService.isValid("invalid.token.here"));
    }

    @Test
    void isValid_shouldReturnFalse_forExpiredToken() {
        // Create a service with 0ms expiration
        JwtService expiredService = new JwtService(SECRET, 0);
        String token = expiredService.generateToken("testuser");
        assertFalse(expiredService.isValid(token));
    }

    @Test
    void isValid_shouldReturnFalse_forTokenSignedWithDifferentKey() {
        // Generate token with a different secret
        String otherSecret = "another-secret-key-that-is-also-at-least-32-chars!!";
        SecretKey otherKey = Keys.hmacShaKeyFor(otherSecret.getBytes(StandardCharsets.UTF_8));
        String token = Jwts.builder()
                .subject("testuser")
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + 3600000))
                .signWith(otherKey)
                .compact();

        assertFalse(jwtService.isValid(token));
    }
}
