package com.pgmanagement.controller;

import com.pgmanagement.dto.request.*;
import com.pgmanagement.dto.response.*;
import com.pgmanagement.enums.ComplaintStatus;
import com.pgmanagement.security.UserPrincipal;
import com.pgmanagement.service.CommunicationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/communications")
@RequiredArgsConstructor
public class CommunicationsController {

    private final CommunicationService communicationService;

    // ─── Notices ──────────────────────────────────────────────────────────────

    @GetMapping("/notices/{pgId}")
    public ResponseEntity<List<NoticeResponse>> getNotices(@PathVariable String pgId) {
        return ResponseEntity.ok(communicationService.getNotices(pgId));
    }

    @PostMapping("/notices")
    @PreAuthorize("hasRole('OWNER')")
    public ResponseEntity<NoticeResponse> createNotice(@Valid @RequestBody CreateNoticeRequest request) {
        return ResponseEntity.ok(communicationService.createNotice(request));
    }

    @PatchMapping("/notices/{id}")
    @PreAuthorize("hasRole('OWNER')")
    public ResponseEntity<NoticeResponse> updateNotice(
            @PathVariable String id,
            @RequestBody CreateNoticeRequest request) {
        return ResponseEntity.ok(communicationService.updateNotice(id, request));
    }

    @DeleteMapping("/notices/{id}")
    @PreAuthorize("hasRole('OWNER')")
    public ResponseEntity<Void> deleteNotice(@PathVariable String id) {
        communicationService.deleteNotice(id);
        return ResponseEntity.noContent().build();
    }

    // ─── Lost & Found ─────────────────────────────────────────────────────────

    @GetMapping("/lost-found/{pgId}")
    public ResponseEntity<List<LostFoundResponse>> getLostFound(@PathVariable String pgId) {
        return ResponseEntity.ok(communicationService.getLostFoundItems(pgId));
    }

    @PostMapping("/lost-found")
    @PreAuthorize("hasRole('OWNER')")
    public ResponseEntity<LostFoundResponse> createLostFound(
            @Valid @RequestBody CreateLostFoundRequest request) {
        return ResponseEntity.ok(communicationService.createLostFound(request));
    }

    @PatchMapping("/lost-found/{id}")
    @PreAuthorize("hasRole('OWNER')")
    public ResponseEntity<LostFoundResponse> updateLostFound(
            @PathVariable String id,
            @RequestBody CreateLostFoundRequest request) {
        return ResponseEntity.ok(communicationService.updateLostFound(id, request));
    }

    // ─── Complaints ───────────────────────────────────────────────────────────

    @GetMapping("/complaints/{pgId}")
    public ResponseEntity<List<ComplaintResponse>> getComplaints(
            @PathVariable String pgId,
            @RequestParam(required = false) ComplaintStatus status) {
        return ResponseEntity.ok(communicationService.getComplaints(pgId, status));
    }

    /** Tenant submits a complaint */
    @PostMapping("/complaints")
    @PreAuthorize("hasRole('TENANT')")
    public ResponseEntity<ComplaintResponse> createComplaint(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody CreateComplaintRequest request) {
        return ResponseEntity.ok(communicationService.createComplaint(principal.getId(), request));
    }

    /** Owner updates complaint status */
    @PatchMapping("/complaints/{id}")
    @PreAuthorize("hasRole('OWNER')")
    public ResponseEntity<ComplaintResponse> updateComplaint(
            @PathVariable String id,
            @Valid @RequestBody UpdateComplaintRequest request) {
        return ResponseEntity.ok(communicationService.updateComplaint(id, request));
    }

    /** Tenant edits their own OPEN complaint */
    @PatchMapping("/complaints/{id}/edit")
    @PreAuthorize("hasRole('TENANT')")
    public ResponseEntity<ComplaintResponse> editComplaint(
            @PathVariable String id,
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestBody CreateComplaintRequest request) {
        return ResponseEntity.ok(communicationService.editComplaint(id, principal.getId(), request));
    }

    /** Tenant deletes their own OPEN complaint */
    @DeleteMapping("/complaints/{id}")
    @PreAuthorize("hasRole('TENANT')")
    public ResponseEntity<Void> deleteComplaint(
            @PathVariable String id,
            @AuthenticationPrincipal UserPrincipal principal) {
        communicationService.deleteComplaint(id, principal.getId());
        return ResponseEntity.noContent().build();
    }
}
