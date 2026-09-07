package com.pgmanagement.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class UpdateOwnerProfileRequest {
    @NotBlank private String ownerName;
    @NotBlank private String phone;
    @NotBlank private String pgName;
    @NotBlank private String pgAddress;
    private String pgDescription;
}
