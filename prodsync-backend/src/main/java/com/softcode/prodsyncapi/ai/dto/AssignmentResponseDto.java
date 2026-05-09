package com.softcode.prodsyncapi.ai.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AssignmentResponseDto {
    private List<RecommendationDto> recomendaciones;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RecommendationDto {
        private Long userId;
        private String nombre;
        private Integer puntuacion;
        private String justificacion;
    }
}
