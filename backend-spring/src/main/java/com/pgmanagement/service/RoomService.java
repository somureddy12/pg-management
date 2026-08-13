package com.pgmanagement.service;

import com.pgmanagement.dto.request.CreateRoomRequest;
import com.pgmanagement.dto.response.RoomResponse;

import java.util.List;

public interface RoomService {
    RoomResponse createRoom(CreateRoomRequest request);
    RoomResponse getRoomById(String id);
    List<RoomResponse> getRoomsByFloor(String floorId);
    RoomResponse updateRoom(String id, CreateRoomRequest request);
    void deleteRoom(String id);
}
