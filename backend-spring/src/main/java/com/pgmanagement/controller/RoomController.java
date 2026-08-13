package com.pgmanagement.controller;

import com.pgmanagement.dto.request.CreateRoomRequest;
import com.pgmanagement.dto.response.RoomResponse;
import com.pgmanagement.service.RoomService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/rooms")
@RequiredArgsConstructor
@PreAuthorize("hasRole('OWNER')")
public class RoomController {

    private final RoomService roomService;

    @PostMapping
    public ResponseEntity<RoomResponse> createRoom(@Valid @RequestBody CreateRoomRequest request) {
        return ResponseEntity.ok(roomService.createRoom(request));
    }

    @GetMapping("/{id}")
    public ResponseEntity<RoomResponse> getRoom(@PathVariable String id) {
        return ResponseEntity.ok(roomService.getRoomById(id));
    }

    @GetMapping
    public ResponseEntity<List<RoomResponse>> getRoomsByFloor(@RequestParam String floorId) {
        return ResponseEntity.ok(roomService.getRoomsByFloor(floorId));
    }

    @PatchMapping("/{id}")
    public ResponseEntity<RoomResponse> updateRoom(
            @PathVariable String id,
            @RequestBody CreateRoomRequest request) {
        return ResponseEntity.ok(roomService.updateRoom(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteRoom(@PathVariable String id) {
        roomService.deleteRoom(id);
        return ResponseEntity.noContent().build();
    }
}
