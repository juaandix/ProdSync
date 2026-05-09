package com.softcode.prodsyncapi.ai.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UserPerformanceDto {
    private Long userId;
    private String nombre;
    private Map<String, Double> eficienciaPorTipo;
    private Double storyPointsPorSemana;
    private Double tasaFinalizacion;
    private Double horasUltimos7Dias;
    private Double horasUltimos30Dias;
    private String especializacion;
}
