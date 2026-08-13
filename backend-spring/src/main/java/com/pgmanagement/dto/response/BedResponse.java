package com.pgmanagement.dto.response;

import com.pgmanagement.enums.BedStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class BedResponse {
    private String id;
    private String bedLabel;
    private BedStatus status;
    private List<TenantSummary> tenants;
    private List<AdvanceBookingSummary> advanceBookings;

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class TenantSummary {
        private String id;
        private String name;
        private String phone;
        private String rentStatus;
    }

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class AdvanceBookingSummary {
        private String id;
        private String tenantName;
        private String phone;
        private String expectedJoin;
        private BigDecimal advancePaid;
    }
}
