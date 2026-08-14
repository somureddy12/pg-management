package com.pgmanagement.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
public class UpdateAdvanceBookingRequest {
    @NotBlank private String tenantName;
    @NotBlank private String phone;
    @NotNull  private LocalDate expectedJoin;
    private BigDecimal advancePaid;
    private String notes;
}
