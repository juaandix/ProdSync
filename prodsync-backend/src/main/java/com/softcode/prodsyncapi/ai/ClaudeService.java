package com.softcode.prodsyncapi.ai;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.softcode.prodsyncapi.ai.dto.AssignmentRequestDto;
import com.softcode.prodsyncapi.ai.dto.AssignmentResponseDto;
import com.softcode.prodsyncapi.ai.dto.UserPerformanceDto;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.util.List;
import java.util.Map;

@Service
public class ClaudeService {

    @Value("${anthropic.api.key:}")
    private String apiKey;

    private final HttpClient httpClient;
    private final ObjectMapper mapper = new ObjectMapper();

    public ClaudeService() {
        this.httpClient = HttpClient.newHttpClient();
    }

    // Package-private constructor for unit testing
    ClaudeService(HttpClient httpClient) {
        this.httpClient = httpClient;
    }

    public AssignmentResponseDto getTaskAssignment(AssignmentRequestDto request,
                                                   List<UserPerformanceDto> profiles) throws Exception {
        if (apiKey == null || apiKey.isBlank()) {
            throw new IllegalStateException("ANTHROPIC_API_KEY no configurada en el servidor");
        }

        String profilesJson = mapper.writeValueAsString(profiles);
        String prompt = buildPrompt(request, profilesJson);

        String bodyJson = mapper.writeValueAsString(Map.of(
                "model", "claude-sonnet-4-6",
                "max_tokens", 1024,
                "messages", List.of(Map.of("role", "user", "content", prompt))
        ));

        HttpRequest httpRequest = HttpRequest.newBuilder()
                .uri(URI.create("https://api.anthropic.com/v1/messages"))
                .header("x-api-key", apiKey)
                .header("anthropic-version", "2023-06-01")
                .header("content-type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(bodyJson))
                .build();

        HttpResponse<String> response = httpClient.send(httpRequest,
                HttpResponse.BodyHandlers.ofString());

        if (response.statusCode() != 200) {
            throw new RuntimeException("Claude API error %d: %s"
                    .formatted(response.statusCode(), response.body()));
        }

        JsonNode root    = mapper.readTree(response.body());
        String   content = root.at("/content/0/text").asText().trim();

        // Strip markdown code fences if present
        if (content.startsWith("```")) {
            content = content.replaceAll("```[a-zA-Z]*\\n?", "").replace("```", "").trim();
        }

        return mapper.readValue(content, AssignmentResponseDto.class);
    }

    private String buildPrompt(AssignmentRequestDto req, String profilesJson) {
        return """
                Eres un sistema de asignación óptima de tareas en un equipo de desarrollo software.

                Nueva tarea a asignar:
                - Descripción: %s
                - Tipo: %s
                - Estimación: %s horas
                - Story Points: %s

                Perfiles de rendimiento del equipo:
                %s

                Responde ÚNICAMENTE con un JSON válido con este formato exacto (sin texto adicional ni bloques de código markdown):
                {"recomendaciones":[{"userId":1,"nombre":"Nombre Apellido","puntuacion":94,"justificacion":"Razón breve en español de máximo 15 palabras"}]}

                Reglas:
                - Ordena por puntuación descendente (0-100).
                - Incluye a todos los desarrolladores de la lista.
                - Puntuación alta = mejor candidato para esta tarea.
                - Considera: eficiencia en el tipo de tarea, carga actual (horasUltimos7Dias), tasa de finalización y especialización.
                """.formatted(
                req.getDescripcion(),
                req.getTipo() != null ? req.getTipo() : "DESARROLLO",
                req.getEstimacion() != null ? req.getEstimacion() : 0,
                req.getStoryPoints() != null ? req.getStoryPoints() : 0,
                profilesJson
        );
    }
}
