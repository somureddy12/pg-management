package com.pgmanagement.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Data
public class CreateMealPostRequest {

    @NotBlank
    private String pgId;

    @NotNull
    private LocalDate date;

    @NotBlank
    private String mealType; // BREAKFAST, LUNCH, DINNER

    @NotNull
    private LocalDateTime windowOpen;

    @NotNull
    private LocalDateTime windowClose;

    @NotEmpty
    private List<ItemRequest> items;

    @Data
    public static class ItemRequest {
        @NotBlank
        private String itemName;
        private boolean isVeg = true;
    }
}