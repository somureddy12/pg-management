package com.pgmanagement.dto.request;

import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
public class DayWiseTenantRequest {
    private String bedId;
    private String name;
    private String phone;
    private String email;
    private String emergencyContact;
    private String idType;
    private String idNumber;
    private String notes;
    private LocalDate startDate;
    private LocalDate endDate;
    private BigDecimal pricePerDay;
    private BigDecimal paidAmount;
}
