package com.pgmanagement.controller;

import com.pgmanagement.dto.request.GenerateRentRequest;
import com.pgmanagement.dto.request.RecordPaymentRequest;
import com.pgmanagement.dto.response.RentBillResponse;
import com.pgmanagement.security.UserPrincipal;
import com.pgmanagement.service.RentService;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.util.List;

@RestController
@RequestMapping("/api/rent")
@RequiredArgsConstructor
public class RentController {

    private final RentService rentService;

    /** Owner: bills for a given month/year */
    @GetMapping("/month/{month}/{year}")
    @PreAuthorize("hasRole('OWNER')")
    public ResponseEntity<List<RentBillResponse>> getBillsByMonth(
            @PathVariable int month,
            @PathVariable int year,
            @RequestParam String pgId) {
        return ResponseEntity.ok(rentService.getBillsByMonthYear(pgId, month, year));
    }

    /** Owner: auto-generate rent bills for all active tenants */
    @PostMapping("/generate")
    @PreAuthorize("hasRole('OWNER')")
    public ResponseEntity<List<RentBillResponse>> generateRent(
            @Valid @RequestBody GenerateRentRequest request) {
        return ResponseEntity.ok(rentService.generateRent(request));
    }

    /** Owner: record a payment against a bill */
    @PostMapping("/pay")
    @PreAuthorize("hasRole('OWNER')")
    public ResponseEntity<RentBillResponse> recordPayment(
            @Valid @RequestBody RecordPaymentRequest request) {
        return ResponseEntity.ok(rentService.recordPayment(request));
    }

    /** Tenant: self-record a payment against their own bill */
    @PostMapping("/tenant/pay")
    @PreAuthorize("hasRole('TENANT')")
    public ResponseEntity<RentBillResponse> tenantPay(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody RecordPaymentRequest request) {
        return ResponseEntity.ok(rentService.recordTenantPayment(principal.getId(), request));
    }

    /** Tenant or owner: full rent history for a tenant */
    @GetMapping("/tenant/{tenantId}")
    public ResponseEntity<List<RentBillResponse>> getTenantHistory(
            @PathVariable String tenantId,
            @AuthenticationPrincipal UserPrincipal principal) {
        // Tenants can only view their own history
        if ("TENANT".equals(principal.getRole()) && !principal.getId().equals(tenantId)) {
            return ResponseEntity.status(403).build();
        }
        return ResponseEntity.ok(rentService.getTenantHistory(tenantId));
    }

    /** Owner: list defaulters (overdue unpaid/partial bills) */
    @GetMapping("/defaulters/{pgId}")
    @PreAuthorize("hasRole('OWNER')")
    public ResponseEntity<List<RentBillResponse>> getDefaulters(@PathVariable String pgId) {
        return ResponseEntity.ok(rentService.getDefaulters(pgId));
    }

    /** PDF receipt download — accessible to both owner and tenant */
    @GetMapping("/receipt/{billId}")
    public void downloadReceipt(
            @PathVariable String billId,
            HttpServletResponse response) throws IOException {
        rentService.generateReceipt(billId, response);
    }
}
