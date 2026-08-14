package com.pgmanagement.controller;

import com.pgmanagement.dto.request.AdvanceBookingRequest;
import com.pgmanagement.dto.request.CreateFloorRequest;
import com.pgmanagement.dto.request.CreatePgRequest;
import com.pgmanagement.dto.request.UpdateAdvanceBookingRequest;
import com.pgmanagement.dto.response.AdvanceBookingResponse;
import com.pgmanagement.dto.response.DashboardResponse;
import com.pgmanagement.dto.response.FloorResponse;
import com.pgmanagement.dto.response.PgHouseResponse;
import java.util.List;
import com.pgmanagement.security.UserPrincipal;
import com.pgmanagement.service.OwnerService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/owner")
@RequiredArgsConstructor
@PreAuthorize("hasRole('OWNER')")
public class OwnerController {

    private final OwnerService ownerService;

    @GetMapping("/dashboard")
    public ResponseEntity<DashboardResponse> getDashboard(
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(ownerService.getDashboard(principal.getId()));
    }

    @PostMapping("/pg")
    public ResponseEntity<PgHouseResponse> createPg(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody CreatePgRequest request) {
        return ResponseEntity.ok(ownerService.createPg(principal.getId(), request));
    }

    @GetMapping("/pg")
    public ResponseEntity<PgHouseResponse> getPg(
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(ownerService.getPg(principal.getId()));
    }

    @PostMapping("/floor")
    public ResponseEntity<FloorResponse> addFloor(
            @Valid @RequestBody CreateFloorRequest request) {
        return ResponseEntity.ok(ownerService.addFloor(request));
    }

    @PostMapping("/advance-booking")
    public ResponseEntity<AdvanceBookingResponse> createAdvanceBooking(
            @Valid @RequestBody AdvanceBookingRequest request) {
        return ResponseEntity.ok(ownerService.createAdvanceBooking(request));
    }

    @GetMapping("/advance-bookings")
    public ResponseEntity<List<AdvanceBookingResponse>> getAdvanceBookings(@RequestParam String pgId) {
        return ResponseEntity.ok(ownerService.getAdvanceBookings(pgId));
    }

    @PutMapping("/advance-booking/{id}")
    public ResponseEntity<AdvanceBookingResponse> updateAdvanceBooking(
            @PathVariable String id,
            @Valid @RequestBody UpdateAdvanceBookingRequest request) {
        return ResponseEntity.ok(ownerService.updateAdvanceBooking(id, request));
    }

    @DeleteMapping("/advance-booking/{id}")
    public ResponseEntity<Void> deleteAdvanceBooking(@PathVariable String id) {
        ownerService.deleteAdvanceBooking(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/health")
    public ResponseEntity<String> health() {
        return ResponseEntity.ok("ok");
    }
}
