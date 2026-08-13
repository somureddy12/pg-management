package com.pgmanagement.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class LoginRequest {
    @NotBlank private String identifier; // email for owner, phone for tenant
    @NotBlank private String password;
}
