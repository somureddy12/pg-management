package com.pgmanagement.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class MealPostResponse {
    private String id;
    private String pgHouseId;
    private LocalDate date;
    private String mealType;
    private LocalDateTime windowOpen;
    private LocalDateTime windowClose;
    private boolean isOpen;
    private Boolean hasSubmitted; // tenant view: true if tenant already saved a selection
    private List<ItemResponse> items;

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class ItemResponse {
        private String id;
        private String itemName;
        private Boolean isVeg;
        private Integer selectionCount; // populated for owner view
        private Integer defaultCount;   // populated for owner view
        private Boolean selectedByMe;   // populated for tenant view
        private Boolean isDefault;      // populated for tenant view
    }
}