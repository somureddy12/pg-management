package com.pgmanagement.dto.response;

import com.pgmanagement.enums.RentStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class RentBillResponse {
    private String id;
    private Integer month;
    private Integer year;
    private BigDecimal roomRent;
    private BigDecimal messCharges;
    private BigDecimal electricity;
    private BigDecimal lateFee;
    private BigDecimal otherCharges;
    private BigDecimal totalAmount;
    private BigDecimal paidAmount;
    private RentStatus status;
    private LocalDate dueDate;
    private LocalDateTime createdAt;
    private List<RentPaymentResponse> payments;

    // Tenant info for bulk views
    private String tenantId;
    private String tenantName;
    private String tenantPhone;
    private String roomNumber;
    private String bedLabel;
}
