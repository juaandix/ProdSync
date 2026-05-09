package com.softcode.prodsyncapi.ai.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AssignmentRequestDto {
    @NotBlank(message = "La descripción es obligatoria")
    private String descripcion;
    private String tipo;
    private Double estimacion;
    private Integer storyPoints;
}
