package com.pgmanagement.controller;

import com.pgmanagement.dto.request.AddTenantRequest;
import com.pgmanagement.dto.request.TenantVacateRequestDto;
import com.pgmanagement.dto.request.UpdateTenantRequest;
import com.pgmanagement.dto.request.VacateTenantRequest;
import com.pgmanagement.dto.response.TenantResponse;
import com.pgmanagement.enums.TenantStatus;
import com.pgmanagement.security.UserPrincipal;
import com.pgmanagement.service.TenantService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/tenants")
@RequiredArgsConstructor
public class TenantController {

    private final TenantService tenantService;

    /** Tenant reads their own profile */
    @GetMapping("/me")
    @PreAuthorize("hasRole('TENANT')")
    public ResponseEntity<TenantResponse> getMyProfile(
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(tenantService.getMyProfile(principal.getId()));
    }

    /** Owner: list all tenants in PG, with optional status filter */
    @GetMapping
    @PreAuthorize("hasRole('OWNER')")
    public ResponseEntity<List<TenantResponse>> getTenants(
            @RequestParam String pgId,
            @RequestParam(required = false) TenantStatus status) {
        return ResponseEntity.ok(tenantService.getTenantsByPg(pgId, status));
    }

    /** Owner: add a new tenant */
    @PostMapping
    @PreAuthorize("hasRole('OWNER')")
    public ResponseEntity<TenantResponse> addTenant(@Valid @RequestBody AddTenantRequest request) {
        return ResponseEntity.ok(tenantService.addTenant(request));
    }

    /** Owner: get a single tenant's full detail */
    @GetMapping("/{id}")
    @PreAuthorize("hasRole('OWNER')")
    public ResponseEntity<TenantResponse> getTenant(@PathVariable String id) {
        return ResponseEntity.ok(tenantService.getTenantById(id));
    }

    /** Owner: update tenant details */
    @PutMapping("/{id}")
    @PreAuthorize("hasRole('OWNER')")
    public ResponseEntity<TenantResponse> updateTenant(
            @PathVariable String id,
            @Valid @RequestBody UpdateTenantRequest request) {
        return ResponseEntity.ok(tenantService.updateTenant(id, request));
    }

    /** Owner: mark tenant as vacated */
    @PostMapping("/{id}/vacate")
    @PreAuthorize("hasRole('OWNER')")
    public ResponseEntity<Void> vacateTenant(
            @PathVariable String id,
            @Valid @RequestBody VacateTenantRequest request) {
        tenantService.vacateTenant(id, request);
        return ResponseEntity.ok().build();
    }

    /** Tenant: submit a vacate request */
    @PostMapping("/me/vacate-request")
    @PreAuthorize("hasRole('TENANT')")
    public ResponseEntity<Void> submitVacateRequest(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody TenantVacateRequestDto request) {
        tenantService.submitVacateRequest(principal.getId(), request);
        return ResponseEntity.ok().build();
    }

    /** Tenant: update their existing vacate request */
    @PutMapping("/me/vacate-request")
    @PreAuthorize("hasRole('TENANT')")
    public ResponseEntity<Void> updateVacateRequest(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody TenantVacateRequestDto request) {
        tenantService.updateVacateRequest(principal.getId(), request);
        return ResponseEntity.ok().build();
    }

    /** Tenant: cancel their vacate request */
    @DeleteMapping("/me/vacate-request")
    @PreAuthorize("hasRole('TENANT')")
    public ResponseEntity<Void> cancelVacateRequest(
            @AuthenticationPrincipal UserPrincipal principal) {
        tenantService.cancelVacateRequest(principal.getId());
        return ResponseEntity.ok().build();
    }

    /** Owner: list all tenants currently in notice period */
    @GetMapping("/notice-period")
    @PreAuthorize("hasRole('OWNER')")
    public ResponseEntity<List<TenantResponse>> getNoticePeriodTenants(@RequestParam String pgId) {
        return ResponseEntity.ok(tenantService.getNoticePeriodTenants(pgId));
    }
}
