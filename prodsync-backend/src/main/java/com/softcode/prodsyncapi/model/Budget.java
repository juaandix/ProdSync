package com.softcode.prodsyncapi.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.softcode.prodsyncapi.model.enums.BudgetStatus;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "presupuestos")
public class Budget {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String numero;

    @Column(nullable = false)
    private String title;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "cliente_id", nullable = false)
    @JsonIgnore
    private Cliente cliente;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "proyecto_id")
    @JsonIgnore
    private Project proyecto;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private BudgetStatus status;

    @Column(name = "created_at")
    private LocalDate createdAt;

    @Column(name = "valid_until")
    private LocalDate validUntil;

    @OneToMany(mappedBy = "budget", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<BudgetLine> lines = new ArrayList<>();

    @Column(name = "total_amount")
    private Double totalAmount;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @JsonProperty("clientId")
    public String getClientId() {
        return cliente != null ? String.valueOf(cliente.getId()) : null;
    }

    @JsonProperty("clientName")
    public String getClientName() {
        return cliente != null ? cliente.getNombre() : null;
    }

    @JsonProperty("projectId")
    public String getProjectId() {
        return proyecto != null ? String.valueOf(proyecto.getId()) : null;
    }

    @JsonProperty("projectName")
    public String getProjectName() {
        return proyecto != null ? proyecto.getNombre() : null;
    }
}
