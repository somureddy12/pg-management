package com.pgmanagement.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
public class CreateExpenseRequest {
    @NotBlank private String pgId;
    @NotBlank private String category;
    @NotBlank private String description;
    @NotNull @Positive private BigDecimal amount;
    @NotNull private LocalDate date;
}
