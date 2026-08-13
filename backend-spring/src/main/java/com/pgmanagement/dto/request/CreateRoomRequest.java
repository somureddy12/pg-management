package com.pgmanagement.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Data;

import java.math.BigDecimal;
import java.util.List;

@Data
public class CreateRoomRequest {
    @NotBlank(message = "Floor ID is required")
    private String floorId;

    @NotBlank(message = "Room number is required")
    private String roomNumber;

    @NotNull @Positive
    private Integer sharingType;

    @NotNull @Positive
    private BigDecimal monthlyRent;

    private List<String> amenities;
}
