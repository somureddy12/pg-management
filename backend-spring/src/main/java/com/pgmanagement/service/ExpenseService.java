package com.pgmanagement.service;

import com.pgmanagement.dto.request.CreateExpenseRequest;
import com.pgmanagement.dto.response.ExpenseResponse;

import java.util.List;

public interface ExpenseService {
    ExpenseResponse createExpense(CreateExpenseRequest request);
    List<ExpenseResponse> getExpenses(String pgId, Integer month, Integer year);
    void deleteExpense(String id);
}
