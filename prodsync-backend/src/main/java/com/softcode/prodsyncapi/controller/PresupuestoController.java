package com.softcode.prodsyncapi.controller;

import com.softcode.prodsyncapi.dto.BudgetRequestDto;
import com.softcode.prodsyncapi.model.Budget;
import com.softcode.prodsyncapi.model.Cliente;
import com.softcode.prodsyncapi.model.Project;
import com.softcode.prodsyncapi.model.enums.BudgetStatus;
import com.softcode.prodsyncapi.repository.ClienteRepository;
import com.softcode.prodsyncapi.repository.ProjectRepository;
import com.softcode.prodsyncapi.service.BudgetService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/presupuestos")
@CrossOrigin(origins = "http://localhost:3000")
public class PresupuestoController {

    @Autowired
    private BudgetService budgetService;

    @Autowired
    private ClienteRepository clienteRepository;

    @Autowired
    private ProjectRepository projectRepository;

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public List<Budget> getAll() {
        return budgetService.getAll();
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Budget> getById(@PathVariable Long id) {
        return budgetService.getById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Budget> create(@RequestBody BudgetRequestDto dto) {
        Budget budget = mapDtoToBudget(new Budget(), dto);
        return new ResponseEntity<>(budgetService.save(budget), HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Budget> update(@PathVariable Long id, @RequestBody BudgetRequestDto dto) {
        return budgetService.getById(id)
                .map(existing -> {
                    existing.getLines().clear();
                    Budget updated = mapDtoToBudget(existing, dto);
                    return ResponseEntity.ok(budgetService.save(updated));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Budget> updateStatus(@PathVariable Long id, @RequestBody Map<String, String> body) {
        BudgetStatus status = BudgetStatus.valueOf(body.get("status").toUpperCase());
        return ResponseEntity.ok(budgetService.updateStatus(id, status));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        budgetService.delete(id);
        return ResponseEntity.noContent().build();
    }

    private Budget mapDtoToBudget(Budget budget, BudgetRequestDto dto) {
        budget.setNumero(dto.getNumero());
        budget.setTitle(dto.getTitle());
        budget.setStatus(BudgetStatus.valueOf(dto.getStatus().toUpperCase()));
        budget.setCreatedAt(LocalDate.parse(dto.getCreatedAt()));
        budget.setValidUntil(LocalDate.parse(dto.getValidUntil()));
        budget.setNotes(dto.getNotes());

        Cliente cliente = clienteRepository.findById(dto.getClientId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Cliente no encontrado"));
        budget.setCliente(cliente);

        if (dto.getProjectId() != null) {
            Project project = projectRepository.findById(dto.getProjectId())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Proyecto no encontrado"));
            budget.setProyecto(project);
        } else {
            budget.setProyecto(null);
        }

        if (dto.getLines() != null) {
            dto.getLines().forEach(line -> {
                line.setId(null);
                line.setBudget(budget);
            });
            budget.setLines(dto.getLines());
        }

        return budget;
    }
}
