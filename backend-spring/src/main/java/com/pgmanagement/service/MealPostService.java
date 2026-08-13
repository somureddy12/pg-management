package com.pgmanagement.service;

import com.pgmanagement.dto.request.CreateMealPostRequest;
import com.pgmanagement.dto.request.MealSelectionRequest;
import com.pgmanagement.dto.response.MealPostResponse;

import java.time.LocalDate;
import java.util.List;

public interface MealPostService {
    MealPostResponse createMealPost(CreateMealPostRequest request);
    List<MealPostResponse> getMealPostsByDate(String pgId, LocalDate date);
    void deleteMealPost(String id);

    List<MealPostResponse> getTenantMealPosts(String tenantId);
    void submitSelection(String tenantId, MealSelectionRequest request);
}