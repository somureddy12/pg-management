package com.pgmanagement.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class PgHouseResponse {
    private String id;
    private String name;
    private String address;
    private String description;
    private List<FloorResponse> floors;
}
