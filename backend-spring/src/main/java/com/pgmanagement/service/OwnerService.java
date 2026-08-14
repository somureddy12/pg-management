package com.pgmanagement.service;

import com.pgmanagement.dto.request.AdvanceBookingRequest;
import com.pgmanagement.dto.request.CreateFloorRequest;
import com.pgmanagement.dto.request.CreatePgRequest;
import com.pgmanagement.dto.request.UpdateAdvanceBookingRequest;
import com.pgmanagement.dto.response.AdvanceBookingResponse;
import com.pgmanagement.dto.response.DashboardResponse;
import com.pgmanagement.dto.response.FloorResponse;
import com.pgmanagement.dto.response.PgHouseResponse;

import java.util.List;

public interface OwnerService {
    DashboardResponse getDashboard(String ownerId);
    PgHouseResponse createPg(String ownerId, CreatePgRequest request);
    PgHouseResponse getPg(String ownerId);
    FloorResponse addFloor(CreateFloorRequest request);
    AdvanceBookingResponse createAdvanceBooking(AdvanceBookingRequest request);
    List<AdvanceBookingResponse> getAdvanceBookings(String pgId);
    AdvanceBookingResponse updateAdvanceBooking(String id, UpdateAdvanceBookingRequest request);
    void deleteAdvanceBooking(String id);
}
