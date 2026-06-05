package com.softcode.prodsyncapi.ai;

import com.softcode.prodsyncapi.ai.dto.AssignmentRequestDto;
import com.softcode.prodsyncapi.ai.dto.AssignmentResponseDto;
import com.softcode.prodsyncapi.ai.dto.UserPerformanceDto;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;
import static org.mockito.Mockito.doReturn;

@ExtendWith(MockitoExtension.class)
class ClaudeServiceTest {

    private HttpClient mockHttpClient;
    private ClaudeService claudeService;

    @BeforeEach
    void setUp() {
        mockHttpClient = mock(HttpClient.class);
        claudeService  = new ClaudeService(mockHttpClient);
    }

    @Test
    void getTaskAssignment_shouldThrow_whenApiKeyIsBlank() {
        ReflectionTestUtils.setField(claudeService, "apiKey", "");

        AssignmentRequestDto request = new AssignmentRequestDto("Test task", "DESARROLLO", 8.0, 3);
        List<UserPerformanceDto> profiles = List.of(
                new UserPerformanceDto(1L, "Dev One", Map.of("DESARROLLO", 0.9), 5.0, 0.8, 30.0, 120.0, "DESARROLLO")
        );

        assertThrows(IllegalStateException.class,
                () -> claudeService.getTaskAssignment(request, profiles));
    }

    @Test
    void getTaskAssignment_shouldThrow_whenApiKeyIsNull() {
        ReflectionTestUtils.setField(claudeService, "apiKey", null);

        AssignmentRequestDto request = new AssignmentRequestDto("Test task", "TESTING", 4.0, 2);
        List<UserPerformanceDto> profiles = List.of();

        assertThrows(IllegalStateException.class,
                () -> claudeService.getTaskAssignment(request, profiles));
    }

    @Test
    void getTaskAssignment_shouldThrow_whenApiReturnsNon200() throws Exception {
        ReflectionTestUtils.setField(claudeService, "apiKey", "sk-ant-test-key");

        @SuppressWarnings("unchecked")
        HttpResponse<String> mockResponse = (HttpResponse<String>) mock(HttpResponse.class);
        when(mockResponse.statusCode()).thenReturn(401);
        when(mockResponse.body()).thenReturn("{\"error\":\"Unauthorized\"}");
        doReturn(mockResponse).when(mockHttpClient).send(any(HttpRequest.class), any());

        AssignmentRequestDto request = new AssignmentRequestDto("Test task", "DESARROLLO", 8.0, 5);
        List<UserPerformanceDto> profiles = List.of(
                new UserPerformanceDto(1L, "Dev One", Map.of(), 3.0, 1.0, 10.0, 40.0, "DESARROLLO")
        );

        assertThrows(RuntimeException.class,
                () -> claudeService.getTaskAssignment(request, profiles));
    }

    @Test
    void getTaskAssignment_shouldParseValidClaudeResponse() throws Exception {
        ReflectionTestUtils.setField(claudeService, "apiKey", "sk-ant-test-key");

        String claudeResponseBody = """
                {
                  "content": [
                    {
                      "text": "{\\"recomendaciones\\":[{\\"userId\\":1,\\"nombre\\":\\"Dev One\\",\\"puntuacion\\":92,\\"justificacion\\":\\"Especialista en DESARROLLO con baja carga\\"}]}"
                    }
                  ]
                }
                """;

        @SuppressWarnings("unchecked")
        HttpResponse<String> mockResponse = (HttpResponse<String>) mock(HttpResponse.class);
        when(mockResponse.statusCode()).thenReturn(200);
        when(mockResponse.body()).thenReturn(claudeResponseBody);
        doReturn(mockResponse).when(mockHttpClient).send(any(HttpRequest.class), any());

        AssignmentRequestDto request = new AssignmentRequestDto("Implementar login", "DESARROLLO", 8.0, 5);
        List<UserPerformanceDto> profiles = List.of(
                new UserPerformanceDto(1L, "Dev One", Map.of("DESARROLLO", 0.85), 6.0, 0.9, 25.0, 100.0, "DESARROLLO")
        );

        AssignmentResponseDto result = claudeService.getTaskAssignment(request, profiles);

        assertNotNull(result);
        assertEquals(1, result.getRecomendaciones().size());
        assertEquals(1L, result.getRecomendaciones().get(0).getUserId());
        assertEquals("Dev One", result.getRecomendaciones().get(0).getNombre());
        assertEquals(92, result.getRecomendaciones().get(0).getPuntuacion());
    }

    @Test
    void getTaskAssignment_shouldStripMarkdownFences_beforeParsing() throws Exception {
        ReflectionTestUtils.setField(claudeService, "apiKey", "sk-ant-test-key");

        String claudeResponseWithFences = """
                {
                  "content": [
                    {
                      "text": "```json\\n{\\"recomendaciones\\":[{\\"userId\\":2,\\"nombre\\":\\"Dev Two\\",\\"puntuacion\\":78,\\"justificacion\\":\\"Buena tasa de finalización\\"}]}\\n```"
                    }
                  ]
                }
                """;

        @SuppressWarnings("unchecked")
        HttpResponse<String> mockResponse = (HttpResponse<String>) mock(HttpResponse.class);
        when(mockResponse.statusCode()).thenReturn(200);
        when(mockResponse.body()).thenReturn(claudeResponseWithFences);
        doReturn(mockResponse).when(mockHttpClient).send(any(HttpRequest.class), any());

        AssignmentRequestDto request = new AssignmentRequestDto("Refactorizar módulo", "TESTING", 4.0, 3);
        List<UserPerformanceDto> profiles = List.of(
                new UserPerformanceDto(2L, "Dev Two", Map.of("TESTING", 0.95), 4.0, 0.75, 15.0, 60.0, "TESTING")
        );

        AssignmentResponseDto result = claudeService.getTaskAssignment(request, profiles);

        assertNotNull(result);
        assertEquals(1, result.getRecomendaciones().size());
        assertEquals(2L, result.getRecomendaciones().get(0).getUserId());
        assertEquals(78, result.getRecomendaciones().get(0).getPuntuacion());
    }
}
