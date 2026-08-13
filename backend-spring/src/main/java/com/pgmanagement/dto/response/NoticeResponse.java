package com.pgmanagement.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class NoticeResponse {
    private String id;
    private String title;
    private String body;
    private Boolean isPinned;
    private LocalDateTime createdAt;
}
