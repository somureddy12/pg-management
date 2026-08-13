package com.pgmanagement.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class RoomResponse {
    private String id;
    private String roomNumber;
    private Integer sharingType;
    private String amenities;
    private BigDecimal monthlyRent;
    private String floorId;
    private Integer floorNumber;
    private List<BedResponse> beds;
}
