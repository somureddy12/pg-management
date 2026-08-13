package com.pgmanagement.repository;

import com.pgmanagement.entity.Expense;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface ExpenseRepository extends JpaRepository<Expense, String> {
    List<Expense> findByPgHouseIdOrderByDateDesc(String pgId);
    List<Expense> findByPgHouseIdAndDateBetweenOrderByDateDesc(String pgId, LocalDate from, LocalDate to);
}
