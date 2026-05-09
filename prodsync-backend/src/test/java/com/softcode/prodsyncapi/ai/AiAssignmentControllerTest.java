package com.softcode.prodsyncapi.ai;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.softcode.prodsyncapi.ai.dto.AssignmentRequestDto;
import com.softcode.prodsyncapi.ai.dto.AssignmentResponseDto;
import com.softcode.prodsyncapi.repository.UserRepository;
import com.softcode.prodsyncapi.security.CustomUserDetailsService;
import com.softcode.prodsyncapi.security.JwtService;
import com.softcode.prodsyncapi.security.SecurityConfig;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(AiAssignmentController.class)
@Import(SecurityConfig.class)
class AiAssignmentControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean private TaskAssignmentService    taskAssignmentService;
    @MockBean private JwtService               jwtService;
    @MockBean private CustomUserDetailsService customUserDetailsService;
    @MockBean private UserRepository           userRepository;
    @MockBean private PasswordEncoder          passwordEncoder;

    private AssignmentRequestDto validRequest() {
        return new AssignmentRequestDto("Implementar login OAuth", "DESARROLLO", 8.0, 5);
    }

    @Test
    void assignTask_shouldReturn401_whenNotAuthenticated() throws Exception {
        mockMvc.perform(post("/api/ai/assign-task")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(validRequest())))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @WithMockUser
    void assignTask_shouldReturn200_withRecommendations() throws Exception {
        AssignmentResponseDto response = new AssignmentResponseDto(List.of(
                new AssignmentResponseDto.RecommendationDto(1L, "Dev One", 92, "Especialista en DESARROLLO")
        ));
        when(taskAssignmentService.assignTask(any())).thenReturn(response);

        mockMvc.perform(post("/api/ai/assign-task")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(validRequest())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.recomendaciones[0].nombre").value("Dev One"))
                .andExpect(jsonPath("$.recomendaciones[0].puntuacion").value(92));
    }

    @Test
    @WithMockUser
    void assignTask_shouldReturn400_whenDescripcionIsBlank() throws Exception {
        AssignmentRequestDto badRequest = new AssignmentRequestDto("", "DESARROLLO", 8.0, 5);

        mockMvc.perform(post("/api/ai/assign-task")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(badRequest)))
                .andExpect(status().isBadRequest());
    }

    @Test
    @WithMockUser
    void assignTask_shouldReturn503_whenApiKeyNotConfigured() throws Exception {
        when(taskAssignmentService.assignTask(any()))
                .thenThrow(new IllegalStateException("ANTHROPIC_API_KEY no configurada en el servidor"));

        mockMvc.perform(post("/api/ai/assign-task")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(validRequest())))
                .andExpect(status().isServiceUnavailable())
                .andExpect(jsonPath("$.error").value("ANTHROPIC_API_KEY no configurada en el servidor"));
    }

    @Test
    @WithMockUser
    void assignTask_shouldReturn500_whenUnexpectedErrorOccurs() throws Exception {
        when(taskAssignmentService.assignTask(any()))
                .thenThrow(new RuntimeException("Connection timeout"));

        mockMvc.perform(post("/api/ai/assign-task")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(validRequest())))
                .andExpect(status().isInternalServerError())
                .andExpect(jsonPath("$.error").exists());
    }

    @Test
    @WithMockUser
    void assignTask_shouldReturnEmptyRecommendations_whenNoProfiles() throws Exception {
        AssignmentResponseDto emptyResponse = new AssignmentResponseDto(List.of());
        when(taskAssignmentService.assignTask(any())).thenReturn(emptyResponse);

        mockMvc.perform(post("/api/ai/assign-task")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(validRequest())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.recomendaciones").isArray())
                .andExpect(jsonPath("$.recomendaciones").isEmpty());
    }
}
