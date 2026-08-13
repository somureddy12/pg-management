package com.pgmanagement.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class MonthlyReportResponse {
    private IncomeBreakdown income;
    private ExpenseBreakdown expenses;
    private BigDecimal netProfit;
    private BigDecimal pendingRent;

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class IncomeBreakdown {
        private BigDecimal rentCollected;
        private BigDecimal messCharges;
        private BigDecimal lateFees;
        private BigDecimal total;
    }

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class ExpenseBreakdown {
        private BigDecimal total;
        private Map<String, BigDecimal> byCategory;
        private List<ExpenseResponse> items;
    }
}
