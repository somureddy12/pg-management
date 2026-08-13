package com.pgmanagement.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDate;
import java.util.List;

@Data
public class CreateWeeklyMenuRequest {
    @NotBlank private String pgId;
    @NotNull  private LocalDate weekStartDate;
    @NotNull  private List<MenuItemRequest> menuItems;

    @Data
    public static class MenuItemRequest {
        @NotBlank private String day;
        @NotBlank private String mealType;
        @NotBlank private String items;
        private Boolean isVeg = true;
        private String timing;
    }
}
