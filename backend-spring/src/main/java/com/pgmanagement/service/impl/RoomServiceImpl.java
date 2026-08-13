package com.pgmanagement.service.impl;

import com.pgmanagement.dto.request.CreateRoomRequest;
import com.pgmanagement.dto.response.BedResponse;
import com.pgmanagement.dto.response.RoomResponse;
import com.pgmanagement.entity.Bed;
import com.pgmanagement.entity.Floor;
import com.pgmanagement.entity.Room;
import com.pgmanagement.exception.ResourceNotFoundException;
import com.pgmanagement.repository.BedRepository;
import com.pgmanagement.repository.FloorRepository;
import com.pgmanagement.repository.RoomRepository;
import com.pgmanagement.service.RoomService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class RoomServiceImpl implements RoomService {

    private final RoomRepository roomRepository;
    private final FloorRepository floorRepository;
    private final BedRepository bedRepository;

    @Override
    @Transactional
    public RoomResponse createRoom(CreateRoomRequest request) {
        Floor floor = floorRepository.findById(request.getFloorId())
            .orElseThrow(() -> new ResourceNotFoundException("Floor", request.getFloorId()));
        Room room = Room.builder()
            .floor(floor).roomNumber(request.getRoomNumber())
            .sharingType(request.getSharingType()).monthlyRent(request.getMonthlyRent())
            .amenities(request.getAmenities() != null ? request.getAmenities() : new ArrayList<>())
            .build();
        room = roomRepository.save(room);
        String[] labels = {"A", "B", "C", "D"};
        List<Bed> beds = new ArrayList<>();
        for (int i = 0; i < request.getSharingType(); i++) {
            beds.add(bedRepository.save(Bed.builder().room(room).bedLabel(labels[i]).build()));
        }
        room.setBeds(beds);
        return mapToResponse(room, floor);
    }

    @Override
    @Transactional(readOnly = true)
    public RoomResponse getRoomById(String id) {
        Room room = roomRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Room", id));
        return mapToResponse(room, room.getFloor());
    }

    @Override
    @Transactional(readOnly = true)
    public List<RoomResponse> getRoomsByFloor(String floorId) {
        return roomRepository.findByFloorId(floorId)
            .stream().map(r -> mapToResponse(r, r.getFloor())).toList();
    }

    @Override
    @Transactional
    public RoomResponse updateRoom(String id, CreateRoomRequest request) {
        Room room = roomRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Room", id));
        if (request.getRoomNumber() != null) room.setRoomNumber(request.getRoomNumber());
        if (request.getMonthlyRent() != null) room.setMonthlyRent(request.getMonthlyRent());
        if (request.getAmenities() != null) room.setAmenities(request.getAmenities());
        return mapToResponse(roomRepository.save(room), room.getFloor());
    }

    @Override
    @Transactional
    public void deleteRoom(String id) {
        if (!roomRepository.existsById(id)) throw new ResourceNotFoundException("Room", id);
        roomRepository.deleteById(id);
    }

    private RoomResponse mapToResponse(Room room, Floor floor) {
        List<BedResponse> bedResponses = room.getBeds() == null ? List.of() :
            room.getBeds().stream().map(b -> {
                List<BedResponse.TenantSummary> tenants = b.getTenants() == null ? List.of() :
                    b.getTenants().stream()
                        .filter(t -> t.getStatus().name().equals("ACTIVE") || t.getStatus().name().equals("NOTICE_PERIOD"))
                        .map(t -> BedResponse.TenantSummary.builder()
                            .id(t.getId()).name(t.getName()).phone(t.getPhone()).build())
                        .toList();
                List<BedResponse.AdvanceBookingSummary> advances = b.getAdvanceBookings() == null ? List.of() :
                    b.getAdvanceBookings().stream()
                        .filter(ab -> "PENDING".equals(ab.getStatus()))
                        .map(ab -> BedResponse.AdvanceBookingSummary.builder()
                            .id(ab.getId()).tenantName(ab.getTenantName())
                            .phone(ab.getPhone()).advancePaid(ab.getAdvancePaid())
                            .expectedJoin(ab.getExpectedJoin().toString()).build())
                        .toList();
                return BedResponse.builder()
                    .id(b.getId()).bedLabel(b.getBedLabel()).status(b.getStatus())
                    .tenants(tenants).advanceBookings(advances).build();
            }).toList();
        return RoomResponse.builder()
            .id(room.getId()).roomNumber(room.getRoomNumber()).sharingType(room.getSharingType())
            .amenities(room.getAmenities() != null ? String.join(", ", room.getAmenities()) : "")
            .monthlyRent(room.getMonthlyRent())
            .floorId(floor.getId()).floorNumber(floor.getNumber()).beds(bedResponses).build();
    }
}