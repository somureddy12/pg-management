package com.pgmanagement.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class DashboardResponse {
    private boolean hasPg;
    private PgHouseResponse pg;
    private OccupancyStats stats;
    private RentStats rent;
    private List<TenantResponse> upcomingVacancies;

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class OccupancyStats {
        private long totalBeds;
        private long occupiedBeds;
        private long vacantBeds;
        private long advanceBeds;
    }

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class RentStats {
        private BigDecimal totalRent;
        private BigDecimal collectedRent;
        private BigDecimal pendingRent;
    }
}
