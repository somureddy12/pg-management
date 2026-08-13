package com.pgmanagement.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class AdvanceBookingResponse {
    private String id;
    private String bedId;
    private String bedLabel;
    private String roomNumber;
    private Integer floorNumber;
    private String tenantName;
    private String phone;
    private LocalDate expectedJoin;
    private BigDecimal advancePaid;
    private String notes;
    private String status;
    private LocalDateTime createdAt;
}
