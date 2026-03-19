package com.softcode.projcodeapi.model;

import com.fasterxml.jackson.annotation.JsonManagedReference;
import com.softcode.projcodeapi.model.enums.ProjectStatus;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import java.time.LocalDate;
import java.util.HashSet;
import java.util.Set;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "proyectos")
public class Project {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank
    @Column(nullable = false)
    private String nombre;

    private String descripcion;

    @Column(name = "fecha_inicio")
    private LocalDate fechaInicio;

    @Column(name = "fecha_fin")
    private LocalDate fechaFin;

    @NotNull
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ProjectStatus estado;

    @ManyToOne
    @JoinColumn(name = "cliente_id")
    private Cliente cliente;

    @OneToMany(mappedBy = "project", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonManagedReference
    private Set<Task> tasks = new HashSet<>();
}
