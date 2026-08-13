package com.pgmanagement.service;

import com.pgmanagement.dto.response.MonthlyReportResponse;
import com.pgmanagement.dto.response.OccupancyReportResponse;

public interface ReportService {
    MonthlyReportResponse getMonthlyReport(String pgId, int month, int year);
    OccupancyReportResponse getOccupancyReport(String pgId);
}
