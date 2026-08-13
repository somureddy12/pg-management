package com.pgmanagement.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class CreateFloorRequest {
    @NotBlank(message = "PG ID is required")
    private String pgId;

    @NotNull(message = "Floor number is required")
    private Integer number;

    private String label;
}
