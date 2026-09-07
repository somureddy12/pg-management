package com.pgmanagement.service;

import com.pgmanagement.dto.request.CreateRoomRequest;
import com.pgmanagement.dto.response.BedResponse;
import com.pgmanagement.dto.response.RoomResponse;

import java.util.List;
import java.util.Map;

public interface RoomService {
    RoomResponse createRoom(CreateRoomRequest request);
    RoomResponse getRoomById(String id);
    List<RoomResponse> getRoomsByFloor(String floorId);
    RoomResponse updateRoom(String id, CreateRoomRequest request);
    void deleteRoom(String id);
    BedResponse updateBed(String bedId, Map<String, String> updates);
    void deleteBed(String bedId);
}
