package com.pgmanagement.dto.response;

import com.pgmanagement.enums.PaymentMode;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class RentPaymentResponse {
    private String id;
    private BigDecimal amount;
    private LocalDateTime paymentDate;
    private PaymentMode mode;
    private String reference;
    private String notes;
}
