package com.pgmanagement.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class CreateNoticeRequest {
    @NotBlank private String pgId;
    @NotBlank private String title;
    @NotBlank private String body;
    private Boolean isPinned = false;
}
