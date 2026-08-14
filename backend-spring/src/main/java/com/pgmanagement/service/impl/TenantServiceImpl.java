package com.pgmanagement.service.impl;

import com.pgmanagement.dto.request.AddTenantRequest;
import com.pgmanagement.dto.request.UpdateTenantRequest;
import com.pgmanagement.dto.request.VacateTenantRequest;
import com.pgmanagement.dto.response.TenantResponse;
import com.pgmanagement.entity.*;
import com.pgmanagement.enums.BedStatus;
import com.pgmanagement.enums.TenantStatus;
import com.pgmanagement.exception.BusinessException;
import com.pgmanagement.exception.ResourceNotFoundException;
import com.pgmanagement.repository.*;
import com.pgmanagement.service.TenantService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

@Service
@RequiredArgsConstructor
public class TenantServiceImpl implements TenantService {

    private final TenantRepository tenantRepository;
    private final BedRepository bedRepository;
    private final RentBillRepository rentBillRepository;

    @Override
    @Transactional
    public TenantResponse addTenant(AddTenantRequest request) {
        Bed bed = bedRepository.findById(request.getBedId())
            .orElseThrow(() -> new ResourceNotFoundException("Bed", request.getBedId()));
        if (bed.getStatus() != BedStatus.VACANT && bed.getStatus() != BedStatus.ADVANCE_BOOKED) {
            throw new BusinessException("Bed " + bed.getBedLabel() + " is already occupied");
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
        tenant.setName(request.getName());
        tenant.setPhone(request.getPhone());
        tenant.setEmail(request.getEmail());
        tenant.setEmergencyContact(request.getEmergencyContact());
        tenant.setIdType(request.getIdType());
        tenant.setIdNumber(request.getIdNumber());
        tenant.setExpectedVacate(request.getExpectedVacate());
        tenant.setMonthlyRent(request.getMonthlyRent());
        if (request.getSecurityDeposit() != null) tenant.setSecurityDeposit(request.getSecurityDeposit());
        tenantRepository.save(tenant);
        List<RentBill> bills = rentBillRepository.findByTenantIdOrderByYearDescMonthDesc(id);
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

        return tenants.stream().map(t -> {
            // For list view, get only the latest bill
            List<RentBill> bills = rentBillRepository.findByTenantIdOrderByYearDescMonthDesc(t.getId());
            RentBill latest = bills.isEmpty() ? null : bills.get(0);
            TenantResponse r = mapToResponse(t, null);
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
