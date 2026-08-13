package com.pgmanagement.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class CreatePgRequest {
    @NotBlank(message = "PG name is required")
    private String name;

    @NotBlank(message = "Address is required")
    private String address;

    private String description;
}
