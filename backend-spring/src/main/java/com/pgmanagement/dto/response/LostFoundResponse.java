package com.pgmanagement.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class LostFoundResponse {
    private String id;
    private String title;
    private String description;
    private String imageUrl;
    private String status;
    private LocalDateTime foundDate;
    private String claimedBy;
    private LocalDateTime createdAt;
}
