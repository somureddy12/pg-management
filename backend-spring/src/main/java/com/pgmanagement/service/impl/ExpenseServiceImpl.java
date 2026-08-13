package com.pgmanagement.service.impl;

import com.pgmanagement.dto.request.CreateExpenseRequest;
import com.pgmanagement.dto.response.ExpenseResponse;
import com.pgmanagement.entity.Expense;
import com.pgmanagement.entity.PgHouse;
import com.pgmanagement.exception.ResourceNotFoundException;
import com.pgmanagement.repository.ExpenseRepository;
import com.pgmanagement.repository.PgHouseRepository;
import com.pgmanagement.service.ExpenseService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ExpenseServiceImpl implements ExpenseService {

    private final ExpenseRepository expenseRepository;
    private final PgHouseRepository pgHouseRepository;

    @Override
    @Transactional
    public ExpenseResponse createExpense(CreateExpenseRequest request) {
        PgHouse pg = pgHouseRepository.findById(request.getPgId())
            .orElseThrow(() -> new ResourceNotFoundException("PgHouse", request.getPgId()));
        Expense expense = Expense.builder()
            .pgHouse(pg).category(request.getCategory()).description(request.getDescription())
            .amount(request.getAmount()).date(request.getDate()).build();
        return mapToResponse(expenseRepository.save(expense));
    }

    @Override
    @Transactional(readOnly = true)
    public List<ExpenseResponse> getExpenses(String pgId, Integer month, Integer year) {
        if (month != null && year != null) {
            LocalDate from = LocalDate.of(year, month, 1);
            LocalDate to = from.withDayOfMonth(from.lengthOfMonth());
            return expenseRepository.findByPgHouseIdAndDateBetweenOrderByDateDesc(pgId, from, to)
                .stream().map(this::mapToResponse).toList();
        }
        return expenseRepository.findByPgHouseIdOrderByDateDesc(pgId)
            .stream().map(this::mapToResponse).toList();
    }

    @Override
    @Transactional
    public void deleteExpense(String id) {
        if (!expenseRepository.existsById(id)) throw new ResourceNotFoundException("Expense", id);
        expenseRepository.deleteById(id);
    }

    private ExpenseResponse mapToResponse(Expense e) {
        return ExpenseResponse.builder()
            .id(e.getId()).category(e.getCategory()).description(e.getDescription())
            .amount(e.getAmount()).date(e.getDate()).createdAt(e.getCreatedAt()).build();
    }
}
