package com.pgmanagement.dto.request;

import com.pgmanagement.enums.PaymentMode;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class RecordPaymentRequest {
    @NotBlank  private String rentBillId;
    @NotNull @Positive private BigDecimal amount;
    @NotNull   private PaymentMode mode;
    private String reference;
    private String notes;
}
