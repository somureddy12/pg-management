package com.pgmanagement.service.impl;

import com.pgmanagement.dto.request.AddTenantRequest;
import com.pgmanagement.dto.request.TenantVacateRequestDto;
import com.pgmanagement.dto.request.UpdateTenantRequest;
import com.pgmanagement.dto.request.VacateTenantRequest;
import com.pgmanagement.dto.response.TenantResponse;
import com.pgmanagement.entity.*;
import com.pgmanagement.enums.BedStatus;
import com.pgmanagement.enums.RentStatus;
import com.pgmanagement.enums.TenantStatus;
import com.pgmanagement.exception.BusinessException;
import com.pgmanagement.exception.ResourceNotFoundException;
import com.pgmanagement.repository.*;
import com.pgmanagement.service.TenantService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class TenantServiceImpl implements TenantService {

    private final TenantRepository tenantRepository;
    private final BedRepository bedRepository;
    private final RentBillRepository rentBillRepository;
    private final AdvanceBookingRepository advanceBookingRepository;

    @Override
    @Transactional
    public TenantResponse addTenant(AddTenantRequest request) {
        Bed bed = bedRepository.findById(request.getBedId())
            .orElseThrow(() -> new ResourceNotFoundException("Bed", request.getBedId()));
        if (bed.getStatus() != BedStatus.VACANT && bed.getStatus() != BedStatus.ADVANCE_BOOKED) {
            throw new BusinessException("Bed " + bed.getBedLabel() + " is already occupied");
        }
        if (tenantRepository.existsActiveByPhoneExcluding(request.getPhone(), "")) {
            throw new BusinessException("Phone number " + request.getPhone() + " is already registered to an active tenant");
        }
        if (tenantRepository.existsActiveByIdNumberExcluding(request.getIdNumber(), "")) {
            throw new BusinessException(request.getIdType() + " number " + request.getIdNumber() + " is already registered to an active tenant");
        }
        Tenant tenant = Tenant.builder()
            .bed(bed).name(request.getName()).phone(request.getPhone()).email(request.getEmail())
            .emergencyContact(request.getEmergencyContact()).idType(request.getIdType()).idNumber(request.getIdNumber())
            .idProofUrl(request.getIdProofUrl()).photoUrl(request.getPhotoUrl())
            .joinDate(request.getJoinDate()).expectedVacate(request.getExpectedVacate())
            .monthlyRent(request.getMonthlyRent())
            .securityDeposit(request.getSecurityDeposit() != null ? request.getSecurityDeposit() : BigDecimal.ZERO)
            .status(TenantStatus.ACTIVE)
            .build();
        tenant = tenantRepository.save(tenant);
        bed.setStatus(BedStatus.OCCUPIED);
        bedRepository.save(bed);
        return mapToResponse(tenant, null);
    }

    @Override
    @Transactional
    public TenantResponse updateTenant(String id, UpdateTenantRequest request) {
        Tenant tenant = tenantRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Tenant", id));
        if (tenantRepository.existsActiveByPhoneExcluding(request.getPhone(), id)) {
            throw new BusinessException("Phone number " + request.getPhone() + " is already registered to another active tenant");
        }
        if (tenantRepository.existsActiveByIdNumberExcluding(request.getIdNumber(), id)) {
            throw new BusinessException(request.getIdType() + " number " + request.getIdNumber() + " is already registered to another active tenant");
        }
        tenant.setName(request.getName());
        tenant.setPhone(request.getPhone());
        tenant.setEmail(request.getEmail());
        tenant.setEmergencyContact(request.getEmergencyContact());
        tenant.setIdType(request.getIdType());
        tenant.setIdNumber(request.getIdNumber());
        tenant.setExpectedVacate(request.getExpectedVacate());
        BigDecimal newRent = request.getMonthlyRent();
        boolean rentChanged = tenant.getMonthlyRent().compareTo(newRent) != 0;
        tenant.setMonthlyRent(newRent);
        if (request.getSecurityDeposit() != null) tenant.setSecurityDeposit(request.getSecurityDeposit());
        tenantRepository.save(tenant);
        List<RentBill> bills = rentBillRepository.findByTenantIdOrderByYearDescMonthDesc(id);
        if (rentChanged) {
            List<RentBill> toUpdate = bills.stream()
                .filter(b -> b.getStatus() == RentStatus.UNPAID || b.getStatus() == RentStatus.PARTIAL)
                .toList();
            toUpdate.forEach(b -> {
                b.setRoomRent(newRent);
                BigDecimal total = newRent
                    .add(b.getMessCharges()   != null ? b.getMessCharges()   : BigDecimal.ZERO)
                    .add(b.getElectricity()   != null ? b.getElectricity()   : BigDecimal.ZERO)
                    .add(b.getLateFee()       != null ? b.getLateFee()       : BigDecimal.ZERO)
                    .add(b.getOtherCharges()  != null ? b.getOtherCharges()  : BigDecimal.ZERO);
                b.setTotalAmount(total);
            });
            rentBillRepository.saveAll(toUpdate);
        }
        return mapToResponse(tenant, bills);
    }

    @Override
    @Transactional(readOnly = true)
    public TenantResponse getTenantById(String id) {
        Tenant tenant = tenantRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Tenant", id));
        List<RentBill> bills = rentBillRepository.findByTenantIdOrderByYearDescMonthDesc(id);
        return mapToResponse(tenant, bills);
    }

    @Override
    @Transactional(readOnly = true)
    public TenantResponse getMyProfile(String tenantId) {
        Tenant tenant = tenantRepository.findById(tenantId)
            .orElseThrow(() -> new ResourceNotFoundException("Tenant", tenantId));
        List<RentBill> bills = rentBillRepository.findByTenantIdOrderByYearDescMonthDesc(tenantId);
        return mapToResponse(tenant, bills);
    }

    @Override
    @Transactional(readOnly = true)
    public List<TenantResponse> getTenantsByPg(String pgId, TenantStatus status) {
        List<Tenant> tenants = status != null
            ? tenantRepository.findByPgIdAndStatus(pgId, status)
            : tenantRepository.findByPgId(pgId);

        if (tenants.isEmpty()) return List.of();

        // Single batch query for latest bill per tenant — replaces N+1 individual queries
        List<String> ids = tenants.stream().map(Tenant::getId).toList();
        Map<String, RentBill> latestBillMap = rentBillRepository.findLatestBillPerTenant(ids)
            .stream()
            .collect(Collectors.toMap(rb -> rb.getTenant().getId(), rb -> rb));

        return tenants.stream().map(t -> {
            TenantResponse r = mapToResponse(t, null);
            RentBill latest = latestBillMap.get(t.getId());
            if (latest != null) {
                r.setLatestBill(TenantResponse.RentBillSummary.builder()
                    .id(latest.getId()).month(latest.getMonth()).year(latest.getYear())
                    .status(latest.getStatus().name()).totalAmount(latest.getTotalAmount())
                    .paidAmount(latest.getPaidAmount()).build());
            }
            return r;
        }).toList();
    }

    @Override
    @Transactional
    public void vacateTenant(String tenantId, VacateTenantRequest request) {
        Tenant tenant = tenantRepository.findById(tenantId)
            .orElseThrow(() -> new ResourceNotFoundException("Tenant", tenantId));
        tenant.setStatus(TenantStatus.VACATED);
        tenant.setActualVacate(request.getVacateDate());
        tenantRepository.save(tenant);
        Bed bed = tenant.getBed();
        bed.setStatus(BedStatus.VACANT);
        bedRepository.save(bed);
    }

    @Override
    @Transactional
    public void submitVacateRequest(String tenantId, TenantVacateRequestDto req) {
        Tenant tenant = tenantRepository.findById(tenantId)
            .orElseThrow(() -> new ResourceNotFoundException("Tenant", tenantId));
        if (tenant.getStatus() == TenantStatus.VACATED) {
            throw new BusinessException("Tenant has already vacated");
        }
        tenant.setStatus(TenantStatus.NOTICE_PERIOD);
        tenant.setExpectedVacate(req.getVacateDate());
        tenant.setVacateType(req.getVacateType());
        tenant.setVacateReason(req.getReason());
        tenant.setVacateRequestDate(LocalDate.now());
        tenantRepository.save(tenant);
    }

    @Override
    @Transactional
    public void updateVacateRequest(String tenantId, TenantVacateRequestDto req) {
        Tenant tenant = tenantRepository.findById(tenantId)
            .orElseThrow(() -> new ResourceNotFoundException("Tenant", tenantId));
        if (tenant.getStatus() != TenantStatus.NOTICE_PERIOD) {
            throw new BusinessException("No active vacate request found");
        }
        tenant.setExpectedVacate(req.getVacateDate());
        tenant.setVacateType(req.getVacateType());
        tenant.setVacateReason(req.getReason());
        tenantRepository.save(tenant);
    }

    @Override
    @Transactional
    public void cancelVacateRequest(String tenantId) {
        Tenant tenant = tenantRepository.findById(tenantId)
            .orElseThrow(() -> new ResourceNotFoundException("Tenant", tenantId));
        if (tenant.getStatus() != TenantStatus.NOTICE_PERIOD) {
            throw new BusinessException("No active vacate request found");
        }
        tenant.setStatus(TenantStatus.ACTIVE);
        tenant.setVacateType(null);
        tenant.setVacateReason(null);
        tenant.setVacateRequestDate(null);
        tenant.setExpectedVacate(null);
        tenantRepository.save(tenant);
    }

    @Override
    @Transactional(readOnly = true)
    public List<TenantResponse> getNoticePeriodTenants(String pgId) {
        return tenantRepository.findByPgIdAndStatus(pgId, TenantStatus.NOTICE_PERIOD)
            .stream().map(t -> mapToResponse(t, null)).toList();
    }

    @Override
    @Transactional(readOnly = true)
    public Map<String, Long> getStatusCounts(String pgId) {
        List<Object[]> rows = tenantRepository.countByPgIdGroupByStatus(pgId);
        Map<String, Long> counts = new HashMap<>();
        for (Object[] row : rows) {
            counts.put(((TenantStatus) row[0]).name(), (Long) row[1]);
        }
        counts.put("ADVANCE_BOOKED", advanceBookingRepository.countPendingByPgId(pgId));
        return counts;
    }

    private TenantResponse mapToResponse(Tenant t, List<RentBill> bills) {
        Bed bed = t.getBed();
        Room room = bed.getRoom();
        Floor floor = room.getFloor();
        PgHouse pg = floor.getPgHouse();

        TenantResponse.TenantResponseBuilder builder = TenantResponse.builder()
            .id(t.getId()).name(t.getName()).phone(t.getPhone()).email(t.getEmail())
            .emergencyContact(t.getEmergencyContact()).idType(t.getIdType()).idNumber(t.getIdNumber())
            .idProofUrl(t.getIdProofUrl()).photoUrl(t.getPhotoUrl())
            .joinDate(t.getJoinDate()).expectedVacate(t.getExpectedVacate()).actualVacate(t.getActualVacate())
            .vacateType(t.getVacateType()).vacateReason(t.getVacateReason()).vacateRequestDate(t.getVacateRequestDate())
            .monthlyRent(t.getMonthlyRent()).securityDeposit(t.getSecurityDeposit())
            .status(t.getStatus()).createdAt(t.getCreatedAt())
            .bedId(bed.getId()).bedLabel(bed.getBedLabel())
            .roomId(room.getId()).roomNumber(room.getRoomNumber()).sharingType(room.getSharingType())
            .floorNumber(floor.getNumber()).floorLabel(floor.getLabel())
            .pgId(pg.getId()).pgName(pg.getName());

        if (bills != null) {
            builder.rentBills(bills.stream().map(b -> {
                var rb = new com.pgmanagement.dto.response.RentBillResponse();
                rb.setId(b.getId()); rb.setMonth(b.getMonth()); rb.setYear(b.getYear());
                rb.setRoomRent(b.getRoomRent()); rb.setMessCharges(b.getMessCharges());
                rb.setElectricity(b.getElectricity()); rb.setLateFee(b.getLateFee());
                rb.setTotalAmount(b.getTotalAmount()); rb.setPaidAmount(b.getPaidAmount());
                rb.setStatus(b.getStatus()); rb.setDueDate(b.getDueDate());
                rb.setPayments(b.getPayments() == null ? List.of() :
                    b.getPayments().stream().map(p ->
                        com.pgmanagement.dto.response.RentPaymentResponse.builder()
                            .id(p.getId()).amount(p.getAmount()).paymentDate(p.getPaymentDate())
                            .mode(p.getMode()).reference(p.getReference()).notes(p.getNotes()).build())
                    .toList());
                return rb;
            }).toList());
        }
        return builder.build();
    }
}
