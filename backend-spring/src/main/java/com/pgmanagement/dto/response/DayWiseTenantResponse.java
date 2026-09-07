package com.pgmanagement.dto.response;

import com.pgmanagement.enums.DayWiseStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class DayWiseTenantResponse {
    private String id;
    private String name;
    private String phone;
    private String email;
    private String emergencyContact;
    private String idType;
    private String idNumber;
    private String notes;

    private LocalDate startDate;
    private LocalDate endDate;
    private int totalDays;
    private BigDecimal pricePerDay;
    private BigDecimal totalAmount;
    private BigDecimal paidAmount;
    private BigDecimal balanceAmount;
    private DayWiseStatus status;

    private String bedId;
    private String bedLabel;
    private String roomId;
    private String roomNumber;
    private Integer sharingType;
    private Integer floorNumber;
    private String floorLabel;
    private String pgId;
    private String pgName;

    private LocalDateTime createdAt;
}
