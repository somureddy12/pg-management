package com.pgmanagement.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

import java.util.List;

@Data
public class MealSelectionRequest {
    @NotBlank
    private String mealPostId;
    private List<String> itemIds; // empty = tenant opts out
}