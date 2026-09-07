package com.pgmanagement.controller;

import com.pgmanagement.dto.request.DayWiseTenantRequest;
import com.pgmanagement.dto.response.DayWiseTenantResponse;
import com.pgmanagement.service.DayWiseTenantService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/day-wise")
@RequiredArgsConstructor
@PreAuthorize("hasRole('OWNER')")
public class DayWiseTenantController {

    private final DayWiseTenantService service;

    @PostMapping
    public ResponseEntity<DayWiseTenantResponse> add(@RequestBody DayWiseTenantRequest request) {
        return ResponseEntity.ok(service.add(request));
    }

    @GetMapping
    public ResponseEntity<List<DayWiseTenantResponse>> getByPg(@RequestParam String pgId) {
        return ResponseEntity.ok(service.getByPg(pgId));
    }

    @PutMapping("/{id}/checkout")
    public ResponseEntity<DayWiseTenantResponse> checkout(@PathVariable String id) {
        return ResponseEntity.ok(service.checkout(id));
    }

    @PutMapping("/{id}/cancel")
    public ResponseEntity<DayWiseTenantResponse> cancel(@PathVariable String id) {
        return ResponseEntity.ok(service.cancel(id));
    }

    @PutMapping("/{id}/payment")
    public ResponseEntity<DayWiseTenantResponse> payment(@PathVariable String id, @RequestBody Map<String, BigDecimal> body) {
        return ResponseEntity.ok(service.recordPayment(id, body.get("amount")));
    }
}
