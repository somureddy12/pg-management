package com.pgmanagement.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class OccupancyReportResponse {
    private List<FloorOccupancy> floors;
    private FloorOccupancy summary;

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class FloorOccupancy {
        private Integer floorNumber;
        private String label;
        private long total;
        private long occupied;
        private long vacant;
        private long advance;
        private List<RoomOccupancy> rooms;
    }

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class RoomOccupancy {
        private String roomNumber;
        private int sharingType;
        private long total;
        private long occupied;
        private long vacant;
        private long advance;
    }
}
