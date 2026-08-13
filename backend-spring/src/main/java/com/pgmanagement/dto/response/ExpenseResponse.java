package com.pgmanagement.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class ExpenseResponse {
    private String id;
    private String category;
    private String description;
    private BigDecimal amount;
    private LocalDate date;
    private LocalDateTime createdAt;
}
