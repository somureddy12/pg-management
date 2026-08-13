package com.pgmanagement.controller;

import com.pgmanagement.dto.response.MonthlyReportResponse;
import com.pgmanagement.dto.response.OccupancyReportResponse;
import com.pgmanagement.service.ReportService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/reports")
@RequiredArgsConstructor
@PreAuthorize("hasRole('OWNER')")
public class ReportController {

    private final ReportService reportService;

    @GetMapping("/monthly/{pgId}/{month}/{year}")
    public ResponseEntity<MonthlyReportResponse> getMonthlyReport(
            @PathVariable String pgId,
            @PathVariable int month,
            @PathVariable int year) {
        return ResponseEntity.ok(reportService.getMonthlyReport(pgId, month, year));
    }

    @GetMapping("/occupancy/{pgId}")
    public ResponseEntity<OccupancyReportResponse> getOccupancyReport(@PathVariable String pgId) {
        return ResponseEntity.ok(reportService.getOccupancyReport(pgId));
    }
}
