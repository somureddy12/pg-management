package com.pgmanagement.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.List;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class WeeklyMenuResponse {
    private String id;
    private LocalDate weekStartDate;
    private List<MenuItemResponse> menuItems;

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class MenuItemResponse {
        private String id;
        private String day;
        private String mealType;
        private String items;
        private Boolean isVeg;
        private String timing;
    }
}
