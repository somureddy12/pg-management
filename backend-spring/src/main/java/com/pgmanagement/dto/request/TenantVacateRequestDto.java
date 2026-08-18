package com.pgmanagement.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import java.time.LocalDate;

@Data
public class TenantVacateRequestDto {

    @NotNull(message = "Vacate date is required")
    private LocalDate vacateDate;

    @NotBlank(message = "Vacate type is required")
    private String vacateType; // CONFIRMED or TENTATIVE

    @NotBlank(message = "Reason is required")
    private String reason;
}
