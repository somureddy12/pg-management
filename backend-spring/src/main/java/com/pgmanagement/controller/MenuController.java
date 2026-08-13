package com.pgmanagement.controller;

import com.pgmanagement.dto.request.CreateWeeklyMenuRequest;
import com.pgmanagement.dto.response.WeeklyMenuResponse;
import com.pgmanagement.service.MenuService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/menu")
@RequiredArgsConstructor
public class MenuController {

    private final MenuService menuService;

    /** Owner or tenant: get current week's menu */
    @GetMapping("/current/{pgId}")
    public ResponseEntity<WeeklyMenuResponse> getCurrentMenu(@PathVariable String pgId) {
        WeeklyMenuResponse menu = menuService.getCurrentMenu(pgId);
        return menu != null ? ResponseEntity.ok(menu) : ResponseEntity.noContent().build();
    }

    /** Owner or tenant: get today's menu items only */
    @GetMapping("/today/{pgId}")
    public ResponseEntity<List<WeeklyMenuResponse.MenuItemResponse>> getTodayMenu(@PathVariable String pgId) {
        return ResponseEntity.ok(menuService.getTodayMenu(pgId));
    }

    /** Owner: create/replace weekly menu */
    @PostMapping
    @PreAuthorize("hasRole('OWNER')")
    public ResponseEntity<WeeklyMenuResponse> createWeeklyMenu(
            @Valid @RequestBody CreateWeeklyMenuRequest request) {
        return ResponseEntity.ok(menuService.createWeeklyMenu(request));
    }
}
