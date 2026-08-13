package com.pgmanagement.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class FloorResponse {
    private String id;
    private Integer number;
    private String label;
    private List<RoomResponse> rooms;
}
