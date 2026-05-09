package com.softcode.prodsyncapi.service;

import com.softcode.prodsyncapi.model.Budget;
import com.softcode.prodsyncapi.model.enums.BudgetStatus;

import java.util.List;
import java.util.Optional;

public interface BudgetService {
    List<Budget> getAll();
    Optional<Budget> getById(Long id);
    Budget save(Budget budget);
    Budget updateStatus(Long id, BudgetStatus status);
    void delete(Long id);
}
