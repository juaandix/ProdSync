package com.softcode.projcodeapi.auth;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.softcode.projcodeapi.repository.UserRepository;
import com.softcode.projcodeapi.security.CustomUserDetailsService;
import com.softcode.projcodeapi.security.JwtService;
import com.softcode.projcodeapi.security.SecurityConfig;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(AuthController.class)
@Import(SecurityConfig.class)
class AuthControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private UserRepository userRepository;

    @MockBean
    private PasswordEncoder passwordEncoder;

    @MockBean
    private AuthenticationManager authenticationManager;

    @MockBean
    private JwtService jwtService;

    @MockBean
    private CustomUserDetailsService customUserDetailsService;

    @Test
    void register_shouldCreateUser_whenRequestIsValid() throws Exception {
        // Arrange
        RegisterRequest registerRequest = new RegisterRequest("testuser", "password123", "test@example.com", "Test User", "ACTIVE", "USER");
        
        when(userRepository.existsByUsername(registerRequest.getUsername())).thenReturn(false);
        when(passwordEncoder.encode(registerRequest.getPassword())).thenReturn("encodedPassword");
        
        // Act & Assert
        mockMvc.perform(post("/api/auth/register")
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(registerRequest)))
                .andExpect(status().isOk())
                .andExpect(content().string("Usuario creado"));
    }

    @Test
    void register_shouldReturnConflict_whenUsernameExists() throws Exception {
        // Arrange
        RegisterRequest registerRequest = new RegisterRequest("existinguser", "password123", "test@example.com", "Test User", "ACTIVE", "USER");
        
        when(userRepository.existsByUsername(registerRequest.getUsername())).thenReturn(true);
        
        // Act & Assert
        mockMvc.perform(post("/api/auth/register")
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(registerRequest)))
                .andExpect(status().isConflict());
    }

    @Test
    void login_shouldReturnToken_whenCredentialsAreValid() throws Exception {
        // Arrange
        AuthRequest authRequest = new AuthRequest();
        authRequest.username = "testuser";
        authRequest.password = "password";
        String dummyToken = "dummy.jwt.token";
        
        when(authenticationManager.authenticate(any())).thenReturn(null);
        when(jwtService.generateToken(authRequest.username)).thenReturn(dummyToken);

        // Act & Assert
        mockMvc.perform(post("/api/auth/login")
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(authRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").value(dummyToken));
    }

    @Test
    void login_shouldReturnUnauthorized_whenCredentialsAreInvalid() throws Exception {
        // Arrange
        AuthRequest authRequest = new AuthRequest();
        authRequest.username = "wronguser";
        authRequest.password = "wrongpassword";

        when(authenticationManager.authenticate(any())).thenThrow(new BadCredentialsException("Invalid credentials"));

        // Act & Assert
        mockMvc.perform(post("/api/auth/login")
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(authRequest)))
                .andExpect(status().isUnauthorized());
    }
}
