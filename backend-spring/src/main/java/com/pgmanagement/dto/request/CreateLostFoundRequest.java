package com.pgmanagement.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class CreateLostFoundRequest {
    @NotBlank private String pgId;
    @NotBlank private String title;
    @NotBlank private String description;
    private String imageUrl;
    private String status;
    private String claimedBy;
}
