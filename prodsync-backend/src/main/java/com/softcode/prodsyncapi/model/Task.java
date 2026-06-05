package com.softcode.prodsyncapi.model;

import com.fasterxml.jackson.annotation.JsonBackReference;
import com.softcode.prodsyncapi.model.enums.TaskStatus;
import jakarta.persistence.*;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "tasks")
public class Task {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "project_id", nullable = false)
    @JsonBackReference
    private Project project;

    @NotBlank(message = "La descripción no puede estar vacía")
    @Column(name = "descripcion", columnDefinition = "TEXT")
    private String descripcion;

    @NotNull(message = "El estado es obligatorio")
    @Enumerated(EnumType.STRING)
    @Column(name = "estado")
    private TaskStatus estado;

    @Min(value = 0, message = "La estimación no puede ser negativa")
    @Column(name = "estimacion")
    private Double estimacion; // en horas

    @Column(name = "story_points")
    private Integer storyPoints;

}
