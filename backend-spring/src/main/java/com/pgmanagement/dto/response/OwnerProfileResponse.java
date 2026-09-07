package com.pgmanagement.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class OwnerProfileResponse {

    // Owner details
    private String ownerId;
    private String ownerName;
    private String email;
    private String phone;
    private LocalDateTime memberSince;

    // PG details
    private String pgId;
    private String pgName;
    private String pgAddress;
    private String pgDescription;

    // Bed stats
    private long totalBeds;
    private long occupiedBeds;
    private long vacantBeds;
    private long advanceBeds;

    // Tenant stats
    private long activeTenants;
    private long noticePeriodTenants;
    private long totalFloors;
    private long totalRooms;
}
