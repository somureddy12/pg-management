package com.pgmanagement.dto.request;

import com.pgmanagement.enums.ComplaintStatus;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class UpdateComplaintRequest {
    @NotNull private ComplaintStatus status;
    private String resolution;
}
