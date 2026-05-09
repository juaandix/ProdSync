package com.softcode.prodsyncapi.ai;

import com.softcode.prodsyncapi.ai.dto.AssignmentRequestDto;
import com.softcode.prodsyncapi.ai.dto.AssignmentResponseDto;
import com.softcode.prodsyncapi.ai.dto.UserPerformanceDto;
import com.softcode.prodsyncapi.service.UserPerformanceService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class TaskAssignmentServiceTest {

    @Mock private UserPerformanceService userPerformanceService;
    @Mock private ClaudeService          claudeService;

    @InjectMocks
    private TaskAssignmentService taskAssignmentService;

    @Test
    void assignTask_shouldReturnEmptyList_whenNoProfilesExist() throws Exception {
        when(userPerformanceService.getUserPerformanceProfiles()).thenReturn(List.of());

        AssignmentRequestDto request = new AssignmentRequestDto("Some task", "DESARROLLO", 4.0, 2);
        AssignmentResponseDto result = taskAssignmentService.assignTask(request);

        assertNotNull(result);
        assertTrue(result.getRecomendaciones().isEmpty());
        verifyNoInteractions(claudeService);
    }

    @Test
    void assignTask_shouldCallClaudeService_whenProfilesExist() throws Exception {
        List<UserPerformanceDto> profiles = List.of(
                new UserPerformanceDto(1L, "Dev One", Map.of("DESARROLLO", 0.9),
                        5.0, 0.8, 20.0, 80.0, "DESARROLLO")
        );
        AssignmentResponseDto expectedResponse = new AssignmentResponseDto(List.of(
                new AssignmentResponseDto.RecommendationDto(1L, "Dev One", 88, "Especialista en DESARROLLO")
        ));

        when(userPerformanceService.getUserPerformanceProfiles()).thenReturn(profiles);
        when(claudeService.getTaskAssignment(any(), eq(profiles))).thenReturn(expectedResponse);

        AssignmentRequestDto request = new AssignmentRequestDto("Implementar autenticación", "DESARROLLO", 8.0, 5);
        AssignmentResponseDto result = taskAssignmentService.assignTask(request);

        assertNotNull(result);
        assertEquals(1, result.getRecomendaciones().size());
        assertEquals("Dev One", result.getRecomendaciones().get(0).getNombre());
        assertEquals(88, result.getRecomendaciones().get(0).getPuntuacion());
    }

    @Test
    void assignTask_shouldPassRequestToClaudeService() throws Exception {
        List<UserPerformanceDto> profiles = List.of(
                new UserPerformanceDto(1L, "Dev One", Map.of(), 3.0, 1.0, 10.0, 40.0, "TESTING")
        );
        AssignmentResponseDto expectedResponse = new AssignmentResponseDto(List.of());

        when(userPerformanceService.getUserPerformanceProfiles()).thenReturn(profiles);
        when(claudeService.getTaskAssignment(any(), any())).thenReturn(expectedResponse);

        AssignmentRequestDto request = new AssignmentRequestDto("Revisar calidad", "TESTING", 6.0, 3);
        taskAssignmentService.assignTask(request);

        verify(claudeService).getTaskAssignment(eq(request), eq(profiles));
    }

    @Test
    void assignTask_shouldPropagateException_whenClaudeServiceFails() throws Exception {
        List<UserPerformanceDto> profiles = List.of(
                new UserPerformanceDto(1L, "Dev One", Map.of(), 2.0, 0.5, 5.0, 20.0, "DESARROLLO")
        );

        when(userPerformanceService.getUserPerformanceProfiles()).thenReturn(profiles);
        when(claudeService.getTaskAssignment(any(), any()))
                .thenThrow(new RuntimeException("API error"));

        AssignmentRequestDto request = new AssignmentRequestDto("Test task", "DESARROLLO", 4.0, 2);

        assertThrows(RuntimeException.class, () -> taskAssignmentService.assignTask(request));
    }
}
