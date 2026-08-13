package com.pgmanagement.controller;

import com.pgmanagement.dto.request.CreateExpenseRequest;
import com.pgmanagement.dto.response.ExpenseResponse;
import com.pgmanagement.service.ExpenseService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/expenses")
@RequiredArgsConstructor
@PreAuthorize("hasRole('OWNER')")
public class ExpenseController {

    private final ExpenseService expenseService;

    @GetMapping("/{pgId}")
    public ResponseEntity<List<ExpenseResponse>> getExpenses(
            @PathVariable String pgId,
            @RequestParam(required = false) Integer month,
            @RequestParam(required = false) Integer year) {
        return ResponseEntity.ok(expenseService.getExpenses(pgId, month, year));
    }

    @PostMapping
    public ResponseEntity<ExpenseResponse> createExpense(@Valid @RequestBody CreateExpenseRequest request) {
        return ResponseEntity.ok(expenseService.createExpense(request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteExpense(@PathVariable String id) {
        expenseService.deleteExpense(id);
        return ResponseEntity.noContent().build();
    }
}
