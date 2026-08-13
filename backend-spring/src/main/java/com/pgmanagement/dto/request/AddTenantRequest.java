package com.pgmanagement.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
public class AddTenantRequest {
    @NotBlank private String bedId;
    @NotBlank private String name;
    @NotBlank private String phone;
    private String email;
    private String emergencyContact;
    @NotBlank private String idType;
    @NotBlank private String idNumber;
    private String idProofUrl;
    private String photoUrl;
    @NotNull  private LocalDate joinDate;
    private LocalDate expectedVacate;
    @NotNull @Positive private BigDecimal monthlyRent;
    private BigDecimal securityDeposit;
}

