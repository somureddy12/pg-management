package com.pgmanagement.controller;

import com.pgmanagement.dto.request.CreateMealPostRequest;
import com.pgmanagement.dto.request.MealSelectionRequest;
import com.pgmanagement.dto.response.MealPostResponse;
import com.pgmanagement.security.UserPrincipal;
import com.pgmanagement.service.MealPostService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/meals")
@RequiredArgsConstructor
public class MealPostController {

    private final MealPostService mealPostService;

    // Owner: post a meal with items and time window
    @PostMapping
    @PreAuthorize("hasRole('OWNER')")
    public ResponseEntity<MealPostResponse> createMealPost(
            @Valid @RequestBody CreateMealPostRequest request) {
        return ResponseEntity.ok(mealPostService.createMealPost(request));
    }

    // Owner: list meal posts for a date (defaults to today)
    @GetMapping
    @PreAuthorize("hasRole('OWNER')")
    public ResponseEntity<List<MealPostResponse>> getMealPosts(
            @RequestParam String pgId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        return ResponseEntity.ok(mealPostService.getMealPostsByDate(pgId, date != null ? date : LocalDate.now()));
    }

    // Owner: delete a meal post
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('OWNER')")
    public ResponseEntity<Void> deleteMealPost(@PathVariable String id) {
        mealPostService.deleteMealPost(id);
        return ResponseEntity.noContent().build();
    }

    // Tenant: get today's meal posts for their PG
    @GetMapping("/my")
    @PreAuthorize("hasRole('TENANT')")
    public ResponseEntity<List<MealPostResponse>> getTenantMealPosts(
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(mealPostService.getTenantMealPosts(principal.getId()));
    }

    // Tenant: submit or update their meal selection
    @PostMapping("/select")
    @PreAuthorize("hasRole('TENANT')")
    public ResponseEntity<Void> submitSelection(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody MealSelectionRequest request) {
        mealPostService.submitSelection(principal.getId(), request);
        return ResponseEntity.ok().build();
    }
}