package com.pgmanagement.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class CreateComplaintRequest {
    @NotBlank private String roomId;
    @NotBlank private String category;
    @NotBlank private String description;
    private String imageUrl;
}
