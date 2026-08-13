package com.pgmanagement.dto.response;

import com.pgmanagement.enums.ComplaintStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class ComplaintResponse {
    private String id;
    private String tenantId;
    private String tenantName;
    private String roomId;
    private String roomNumber;
    private String category;
    private String description;
    private String imageUrl;
    private ComplaintStatus status;
    private String resolution;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
