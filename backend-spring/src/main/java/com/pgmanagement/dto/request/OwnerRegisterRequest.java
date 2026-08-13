package com.pgmanagement.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class OwnerRegisterRequest {
    @NotBlank(message = "Name is required")
    private String name;

    @NotBlank @Email(message = "Valid email required")
    private String email;

    @NotBlank @Size(min = 6, message = "Password must be at least 6 characters")
    private String password;

    @NotBlank(message = "Phone is required")
    private String phone;
}
