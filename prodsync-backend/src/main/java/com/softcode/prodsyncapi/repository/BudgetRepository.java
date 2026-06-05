package com.softcode.prodsyncapi.repository;

import com.softcode.prodsyncapi.model.Budget;
import org.springframework.data.jpa.repository.JpaRepository;

public interface BudgetRepository extends JpaRepository<Budget, Long> {
}
