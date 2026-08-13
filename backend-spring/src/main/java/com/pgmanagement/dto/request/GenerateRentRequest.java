package com.pgmanagement.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Data;

@Data
public class GenerateRentRequest {
    @NotBlank private String pgId;
    @NotNull  private Integer month;
    @NotNull  private Integer year;
}
