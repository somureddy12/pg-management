package com.pgmanagement.service.impl;

import com.pgmanagement.dto.request.AdvanceBookingRequest;
import com.pgmanagement.dto.request.CreateFloorRequest;
import com.pgmanagement.dto.request.CreatePgRequest;
import com.pgmanagement.dto.request.UpdateAdvanceBookingRequest;
import com.pgmanagement.dto.request.UpdateOwnerProfileRequest;
import com.pgmanagement.dto.response.*;
import com.pgmanagement.entity.*;
import com.pgmanagement.enums.BedStatus;
import com.pgmanagement.enums.RentStatus;
import com.pgmanagement.exception.BusinessException;
import com.pgmanagement.exception.ResourceNotFoundException;
import com.pgmanagement.repository.*;
import com.pgmanagement.service.OwnerService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class OwnerServiceImpl implements OwnerService {

    private final OwnerRepository ownerRepository;
    private final PgHouseRepository pgHouseRepository;
    private final FloorRepository floorRepository;
    private final BedRepository bedRepository;
    private final TenantRepository tenantRepository;
    private final RentBillRepository rentBillRepository;
    private final AdvanceBookingRepository advanceBookingRepository;

    @Override
    @Transactional(readOnly = true)
    public DashboardResponse getDashboard(String ownerId) {
        var pgOpt = pgHouseRepository.findByOwnerId(ownerId);
        if (pgOpt.isEmpty()) {
            return DashboardResponse.builder().hasPg(false).build();
        }
        PgHouse pg = pgOpt.get();
        List<Floor> floors = floorRepository.findByPgHouseIdOrderByNumberAsc(pg.getId());

        long totalBeds = 0, occupied = 0, vacant = 0, advance = 0;
        for (Floor floor : floors) {
            for (Room room : floor.getRooms()) {
                for (Bed bed : room.getBeds()) {
                    totalBeds++;
                    switch (bed.getStatus()) {
                        case OCCUPIED -> occupied++;
                        case VACANT -> vacant++;
                        case ADVANCE_BOOKED -> advance++;
                        default -> {}
                    }
                }
            }
        }

        LocalDate now = LocalDate.now();
        List<RentBill> bills = rentBillRepository.findByPgIdAndMonthAndYear(pg.getId(), now.getMonthValue(), now.getYear());
        BigDecimal totalRent = bills.stream().map(RentBill::getTotalAmount).reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal collected = bills.stream().map(RentBill::getPaidAmount).reduce(BigDecimal.ZERO, BigDecimal::add);

        List<Tenant> upcoming = tenantRepository.findUpcomingVacancies(pg.getId(), now, now.plusDays(30));

        return DashboardResponse.builder()
            .hasPg(true)
            .pg(mapPgToResponse(pg))
            .stats(DashboardResponse.OccupancyStats.builder()
                .totalBeds(totalBeds).occupiedBeds(occupied).vacantBeds(vacant).advanceBeds(advance)
                .build())
            .rent(DashboardResponse.RentStats.builder()
                .totalRent(totalRent).collectedRent(collected).pendingRent(totalRent.subtract(collected))
                .build())
            .upcomingVacancies(upcoming.stream().map(this::mapTenantSummary).toList())
            .build();
    }

    @Override
    @Transactional
    public PgHouseResponse createPg(String ownerId, CreatePgRequest request) {
        if (pgHouseRepository.findByOwnerId(ownerId).isPresent()) {
            throw new BusinessException("You already have a PG registered");
        }
        Owner owner = ownerRepository.findById(ownerId)
            .orElseThrow(() -> new ResourceNotFoundException("Owner", ownerId));
        PgHouse pg = PgHouse.builder()
            .owner(owner).name(request.getName())
            .address(request.getAddress()).description(request.getDescription())
            .build();
        return mapPgToResponse(pgHouseRepository.save(pg));
    }

    @Override
    @Transactional(readOnly = true)
    public PgHouseResponse getPg(String ownerId) {
        PgHouse pg = pgHouseRepository.findByOwnerId(ownerId)
            .orElseThrow(() -> new ResourceNotFoundException("PG not found for owner: " + ownerId));
        List<Floor> floors = floorRepository.findByPgHouseIdOrderByNumberAsc(pg.getId());
        pg.setFloors(floors);
        return mapPgToResponse(pg);
    }

    @Override
    @Transactional
    public FloorResponse addFloor(CreateFloorRequest request) {
        PgHouse pg = pgHouseRepository.findById(request.getPgId())
            .orElseThrow(() -> new ResourceNotFoundException("PgHouse", request.getPgId()));
        Floor floor = Floor.builder()
            .pgHouse(pg).number(request.getNumber()).label(request.getLabel())
            .build();
        floor = floorRepository.save(floor);
        return FloorResponse.builder()
            .id(floor.getId()).number(floor.getNumber()).label(floor.getLabel())
            .rooms(List.of()).build();
    }

    @Override
    @Transactional(readOnly = true)
    public List<AdvanceBookingResponse> getAdvanceBookings(String pgId) {
        return advanceBookingRepository.findPendingByPgId(pgId).stream()
            .map(this::mapAdvanceBooking)
            .toList();
    }

    @Override
    @Transactional
    public AdvanceBookingResponse createAdvanceBooking(AdvanceBookingRequest request) {
        Bed bed = bedRepository.findById(request.getBedId())
            .orElseThrow(() -> new ResourceNotFoundException("Bed", request.getBedId()));
        if (bed.getStatus() != BedStatus.VACANT) {
            throw new BusinessException("Bed is not vacant");
        }
        AdvanceBooking booking = AdvanceBooking.builder()
            .bed(bed).tenantName(request.getTenantName()).phone(request.getPhone())
            .expectedJoin(request.getExpectedJoin())
            .advancePaid(request.getAdvancePaid() != null ? request.getAdvancePaid() : BigDecimal.ZERO)
            .notes(request.getNotes()).status("PENDING")
            .build();
        booking = advanceBookingRepository.save(booking);
        bed.setStatus(BedStatus.ADVANCE_BOOKED);
        bedRepository.save(bed);
        return mapAdvanceBooking(booking);
    }

    @Override
    @Transactional
    public AdvanceBookingResponse updateAdvanceBooking(String id, UpdateAdvanceBookingRequest request) {
        AdvanceBooking booking = advanceBookingRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("AdvanceBooking", id));
        booking.setTenantName(request.getTenantName());
        booking.setPhone(request.getPhone());
        booking.setExpectedJoin(request.getExpectedJoin());
        booking.setAdvancePaid(request.getAdvancePaid() != null ? request.getAdvancePaid() : BigDecimal.ZERO);
        booking.setNotes(request.getNotes());
        return mapAdvanceBooking(advanceBookingRepository.save(booking));
    }

    @Override
    @Transactional
    public void deleteAdvanceBooking(String id) {
        AdvanceBooking booking = advanceBookingRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("AdvanceBooking", id));
        Bed bed = booking.getBed();
        advanceBookingRepository.delete(booking);
        bed.setStatus(BedStatus.VACANT);
        bedRepository.save(bed);
    }

    @Override
    @Transactional(readOnly = true)
    public OwnerProfileResponse getProfile(String ownerId) {
        Owner owner = ownerRepository.findById(ownerId)
            .orElseThrow(() -> new ResourceNotFoundException("Owner", ownerId));
        var pgOpt = pgHouseRepository.findByOwnerId(ownerId);
        if (pgOpt.isEmpty()) {
            return OwnerProfileResponse.builder()
                .ownerId(owner.getId()).ownerName(owner.getName())
                .email(owner.getEmail()).phone(owner.getPhone())
                .memberSince(owner.getCreatedAt())
                .build();
        }
        PgHouse pg = pgOpt.get();
        List<Floor> floors = floorRepository.findByPgHouseIdOrderByNumberAsc(pg.getId());
        long totalBeds = 0, occupied = 0, vacant = 0, advance = 0, totalRooms = 0;
        for (Floor floor : floors) {
            totalRooms += floor.getRooms().size();
            for (Room room : floor.getRooms()) {
                for (Bed bed : room.getBeds()) {
                    totalBeds++;
                    switch (bed.getStatus()) {
                        case OCCUPIED -> occupied++;
                        case VACANT -> vacant++;
                        case ADVANCE_BOOKED -> advance++;
                        default -> {}
                    }
                }
            }
        }
        List<Object[]> counts = tenantRepository.countByPgIdGroupByStatus(pg.getId());
        long active = counts.stream().filter(r -> r[0].toString().equals("ACTIVE")).mapToLong(r -> (Long) r[1]).sum();
        long notice = counts.stream().filter(r -> r[0].toString().equals("NOTICE_PERIOD")).mapToLong(r -> (Long) r[1]).sum();
        return OwnerProfileResponse.builder()
            .ownerId(owner.getId()).ownerName(owner.getName())
            .email(owner.getEmail()).phone(owner.getPhone())
            .memberSince(owner.getCreatedAt())
            .pgId(pg.getId()).pgName(pg.getName())
            .pgAddress(pg.getAddress()).pgDescription(pg.getDescription())
            .totalBeds(totalBeds).occupiedBeds(occupied)
            .vacantBeds(vacant).advanceBeds(advance)
            .activeTenants(active).noticePeriodTenants(notice)
            .totalFloors(floors.size()).totalRooms(totalRooms)
            .build();
    }

    @Override
    @Transactional
    public OwnerProfileResponse updateProfile(String ownerId, UpdateOwnerProfileRequest request) {
        Owner owner = ownerRepository.findById(ownerId)
            .orElseThrow(() -> new ResourceNotFoundException("Owner", ownerId));
        owner.setName(request.getOwnerName());
        owner.setPhone(request.getPhone());
        ownerRepository.save(owner);
        pgHouseRepository.findByOwnerId(ownerId).ifPresent(pg -> {
            pg.setName(request.getPgName());
            pg.setAddress(request.getPgAddress());
            pg.setDescription(request.getPgDescription());
            pgHouseRepository.save(pg);
        });
        return getProfile(ownerId);
    }

    @Override
    @Transactional
    public void deleteFloor(String floorId) {
        Floor floor = floorRepository.findById(floorId)
            .orElseThrow(() -> new ResourceNotFoundException("Floor", floorId));
        boolean hasActiveTenants = floor.getRooms() != null && floor.getRooms().stream()
            .flatMap(r -> r.getBeds().stream())
            .flatMap(b -> b.getTenants().stream())
            .anyMatch(t -> "ACTIVE".equals(t.getStatus().name()) || "NOTICE_PERIOD".equals(t.getStatus().name()));
        if (hasActiveTenants) {
            throw new BusinessException("Cannot delete a floor with active tenants");
        }
        floorRepository.deleteById(floorId);
    }

    // â"€â"€â"€ Mappers â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€

    private PgHouseResponse mapPgToResponse(PgHouse pg) {
        List<FloorResponse> floorResponses = pg.getFloors() == null ? List.of() :
            pg.getFloors().stream().map(f -> FloorResponse.builder()
                .id(f.getId()).number(f.getNumber()).label(f.getLabel())
                .rooms(f.getRooms() == null ? List.of() :
                    f.getRooms().stream().map(r -> RoomResponse.builder()
                        .id(r.getId()).roomNumber(r.getRoomNumber()).sharingType(r.getSharingType())
                        .amenities(r.getAmenities() != null ? String.join(", ", r.getAmenities()) : "").monthlyRent(r.getMonthlyRent())
                        .floorId(f.getId()).floorNumber(f.getNumber())
                        .beds(r.getBeds() == null ? List.of() :
                            r.getBeds().stream().map(b -> {
                                List<BedResponse.TenantSummary> tenantSummaries = b.getTenants() == null ? List.of() :
                                    b.getTenants().stream()
                                        .filter(t -> t.getStatus().name().equals("ACTIVE") || t.getStatus().name().equals("NOTICE_PERIOD"))
                                        .map(t -> BedResponse.TenantSummary.builder()
                                            .id(t.getId()).name(t.getName()).phone(t.getPhone()).build())
                                        .toList();
                                List<BedResponse.AdvanceBookingSummary> advSummaries = b.getAdvanceBookings() == null ? List.of() :
                                    b.getAdvanceBookings().stream()
                                        .filter(ab -> ab.getStatus().equals("PENDING"))
                                        .map(ab -> BedResponse.AdvanceBookingSummary.builder()
                                            .id(ab.getId()).tenantName(ab.getTenantName())
                                            .phone(ab.getPhone()).advancePaid(ab.getAdvancePaid())
                                            .expectedJoin(ab.getExpectedJoin().toString()).build())
                                        .toList();
                                return BedResponse.builder()
                                    .id(b.getId()).bedLabel(b.getBedLabel()).status(b.getStatus())
                                    .tenants(tenantSummaries).advanceBookings(advSummaries).build();
                            }).toList())
                        .build()).toList())
                .build()).toList();
        return PgHouseResponse.builder()
            .id(pg.getId()).name(pg.getName()).address(pg.getAddress())
            .description(pg.getDescription()).floors(floorResponses).build();
    }

    private TenantResponse mapTenantSummary(Tenant t) {
        Bed bed = t.getBed();
        Room room = bed.getRoom();
        Floor floor = room.getFloor();
        return TenantResponse.builder()
            .id(t.getId()).name(t.getName()).phone(t.getPhone())
            .joinDate(t.getJoinDate()).expectedVacate(t.getExpectedVacate()).status(t.getStatus())
            .bedLabel(bed.getBedLabel()).roomNumber(room.getRoomNumber()).floorNumber(floor.getNumber())
            .build();
    }

    private AdvanceBookingResponse mapAdvanceBooking(AdvanceBooking ab) {
        Bed bed = ab.getBed();
        Room room = bed.getRoom();
        Floor floor = room.getFloor();
        return AdvanceBookingResponse.builder()
            .id(ab.getId()).bedId(bed.getId()).bedLabel(bed.getBedLabel())
            .roomNumber(room.getRoomNumber()).sharingType(room.getSharingType()).floorNumber(floor.getNumber())
            .tenantName(ab.getTenantName()).phone(ab.getPhone())
            .expectedJoin(ab.getExpectedJoin())
            .advancePaid(ab.getAdvancePaid()).notes(ab.getNotes()).status(ab.getStatus())
            .createdAt(ab.getCreatedAt()).build();
    }
}

