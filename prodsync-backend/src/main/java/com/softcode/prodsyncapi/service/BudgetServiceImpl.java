package com.softcode.prodsyncapi.service;

import com.softcode.prodsyncapi.model.Budget;
import com.softcode.prodsyncapi.model.enums.BudgetStatus;
import com.softcode.prodsyncapi.repository.BudgetRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Optional;

@Service
public class BudgetServiceImpl implements BudgetService {

    @Autowired
    private BudgetRepository budgetRepository;

    @Override
    public List<Budget> getAll() {
        return budgetRepository.findAll();
    }

    @Override
    public Optional<Budget> getById(Long id) {
        return budgetRepository.findById(id);
    }

    @Override
    public Budget save(Budget budget) {
        if (budget.getLines() != null) {
            budget.getLines().forEach(line -> {
                line.setBudget(budget);
                line.setTotal(line.getQuantity() * line.getUnitPrice());
            });
            double total = budget.getLines().stream()
                    .mapToDouble(l -> l.getTotal() != null ? l.getTotal() : 0.0)
                    .sum();
            budget.setTotalAmount(total);
        }
        return budgetRepository.save(budget);
    }

    @Override
    public Budget updateStatus(Long id, BudgetStatus status) {
        Budget budget = budgetRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Presupuesto no encontrado"));
        budget.setStatus(status);
        return budgetRepository.save(budget);
    }

    @Override
    public void delete(Long id) {
        budgetRepository.deleteById(id);
    }
}
