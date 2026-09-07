package com.pgmanagement.service.impl;

import com.pgmanagement.dto.request.CreateRoomRequest;
import com.pgmanagement.dto.response.BedResponse;
import com.pgmanagement.dto.response.RoomResponse;
import com.pgmanagement.entity.Bed;
import com.pgmanagement.entity.Floor;
import com.pgmanagement.entity.Room;
import com.pgmanagement.enums.BedStatus;
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
import java.util.Map;
import java.util.stream.Collectors;

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
        if (request.getSharingType() != null) {
            List<Bed> currentBeds = room.getBeds();
            long occupiedCount = currentBeds.stream()
                .filter(b ->
                    b.getTenants().stream().anyMatch(t -> "ACTIVE".equals(t.getStatus().name()) || "NOTICE_PERIOD".equals(t.getStatus().name()))
                    || b.getAdvanceBookings().stream().anyMatch(ab -> "PENDING".equals(ab.getStatus()))
                ).count();
            int newSharing = request.getSharingType();
            if (newSharing < occupiedCount) {
                throw new com.pgmanagement.exception.BusinessException(
                    "Cannot reduce sharing to " + newSharing + " — " + occupiedCount + " bed(s) are currently occupied");
            }
            String[] allLabels = {"A", "B", "C", "D"};
            int currentCount = currentBeds.size();
            if (newSharing > currentCount) {
                for (int i = currentCount; i < newSharing; i++) {
                    bedRepository.save(Bed.builder().room(room).bedLabel(allLabels[i]).build());
                }
            } else if (newSharing < currentCount) {
                List<Bed> vacantBeds = currentBeds.stream()
                    .filter(b ->
                        b.getTenants().stream().noneMatch(t -> "ACTIVE".equals(t.getStatus().name()) || "NOTICE_PERIOD".equals(t.getStatus().name()))
                        && b.getAdvanceBookings().stream().noneMatch(ab -> "PENDING".equals(ab.getStatus()))
                    ).collect(Collectors.toList());
                int toRemove = currentCount - newSharing;
                List<Bed> bedsToDelete = vacantBeds.subList(vacantBeds.size() - toRemove, vacantBeds.size());
                // Remove from room collection BEFORE saving to avoid cascade-merge on deleted entities
                currentBeds.removeAll(bedsToDelete);
                bedsToDelete.forEach(b -> bedRepository.deleteById(b.getId()));
            }
            room.setSharingType(newSharing);
        }
        if (request.getMonthlyRent() != null) room.setMonthlyRent(request.getMonthlyRent());
        if (request.getAmenities() != null) room.setAmenities(request.getAmenities());
        roomRepository.save(room);
        // Re-fetch fresh beds (covers newly added beds too)
        room.setBeds(bedRepository.findByRoomId(id));
        return mapToResponse(room, room.getFloor());
    }

    @Override
    @Transactional
    public void deleteRoom(String id) {
        if (!roomRepository.existsById(id)) throw new ResourceNotFoundException("Room", id);
        roomRepository.deleteById(id);
    }

    @Override
    @Transactional
    public BedResponse updateBed(String bedId, Map<String, String> updates) {
        Bed bed = bedRepository.findById(bedId)
            .orElseThrow(() -> new ResourceNotFoundException("Bed", bedId));
        if (updates.containsKey("bedLabel") && updates.get("bedLabel") != null && !updates.get("bedLabel").isBlank()) {
            bed.setBedLabel(updates.get("bedLabel"));
        }
        if (updates.containsKey("status") && updates.get("status") != null) {
            BedStatus newStatus = BedStatus.valueOf(updates.get("status"));
            if (newStatus == BedStatus.MAINTENANCE || (bed.getStatus() == BedStatus.MAINTENANCE && newStatus == BedStatus.VACANT)) {
                bed.setStatus(newStatus);
            }
        }
        bedRepository.save(bed);
        return BedResponse.builder()
            .id(bed.getId()).bedLabel(bed.getBedLabel()).status(bed.getStatus())
            .tenants(List.of()).advanceBookings(List.of()).build();
    }

    @Override
    @Transactional
    public void deleteBed(String bedId) {
        Bed bed = bedRepository.findById(bedId)
            .orElseThrow(() -> new ResourceNotFoundException("Bed", bedId));
        boolean occupied = bed.getTenants() != null && bed.getTenants().stream()
            .anyMatch(t -> "ACTIVE".equals(t.getStatus().name()) || "NOTICE_PERIOD".equals(t.getStatus().name()));
        boolean hasAdvance = bed.getAdvanceBookings() != null && bed.getAdvanceBookings().stream()
            .anyMatch(ab -> "PENDING".equals(ab.getStatus()));
        if (occupied || hasAdvance) {
            throw new com.pgmanagement.exception.BusinessException("Cannot delete an occupied or advance-booked bed");
        }
        bedRepository.deleteById(bedId);
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