package com.pgmanagement.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.Data;
import java.time.LocalDate;

@Data
public class VacateTenantRequest {
    @NotNull(message = "Vacate date is required")
    private LocalDate vacateDate;
}
