package com.pgmanagement.service.impl;

import com.pgmanagement.dto.request.DayWiseTenantRequest;
import com.pgmanagement.dto.response.DayWiseTenantResponse;
import com.pgmanagement.entity.*;
import com.pgmanagement.enums.DayWiseStatus;
import com.pgmanagement.exception.ResourceNotFoundException;
import com.pgmanagement.repository.BedRepository;
import com.pgmanagement.repository.DayWiseTenantRepository;
import com.pgmanagement.service.DayWiseTenantService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
public class DayWiseTenantServiceImpl implements DayWiseTenantService {

    private final DayWiseTenantRepository repository;
    private final BedRepository bedRepository;

    @Override
    @Transactional
    public DayWiseTenantResponse add(DayWiseTenantRequest req) {
        Bed bed = bedRepository.findById(req.getBedId())
            .orElseThrow(() -> new ResourceNotFoundException("Bed", req.getBedId()));

        int totalDays = (int) (req.getEndDate().toEpochDay() - req.getStartDate().toEpochDay());
        if (totalDays <= 0) throw new IllegalArgumentException("End date must be after start date");

        BigDecimal totalAmount = req.getPricePerDay().multiply(BigDecimal.valueOf(totalDays));
        BigDecimal paid = req.getPaidAmount() != null ? req.getPaidAmount() : BigDecimal.ZERO;

        LocalDate today = LocalDate.now();
        DayWiseStatus status = today.isBefore(req.getStartDate()) ? DayWiseStatus.UPCOMING : DayWiseStatus.ACTIVE;

        DayWiseTenant tenant = DayWiseTenant.builder()
            .bed(bed).name(req.getName()).phone(req.getPhone()).email(req.getEmail())
            .emergencyContact(req.getEmergencyContact()).idType(req.getIdType())
            .idNumber(req.getIdNumber()).notes(req.getNotes())
            .startDate(req.getStartDate()).endDate(req.getEndDate())
            .totalDays(totalDays).pricePerDay(req.getPricePerDay())
            .totalAmount(totalAmount).paidAmount(paid).status(status)
            .build();

        return map(repository.save(tenant));
    }

    @Override
    @Transactional(readOnly = true)
    public List<DayWiseTenantResponse> getByPg(String pgId) {
        return repository.findByPgId(pgId).stream().map(this::map).toList();
    }

    @Override
    @Transactional
    public DayWiseTenantResponse checkout(String id) {
        DayWiseTenant t = repository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("DayWiseTenant", id));
        t.setStatus(DayWiseStatus.COMPLETED);
        return map(repository.save(t));
    }

    @Override
    @Transactional
    public DayWiseTenantResponse cancel(String id) {
        DayWiseTenant t = repository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("DayWiseTenant", id));
        t.setStatus(DayWiseStatus.CANCELLED);
        return map(repository.save(t));
    }

    @Override
    @Transactional
    public DayWiseTenantResponse recordPayment(String id, BigDecimal amount) {
        DayWiseTenant t = repository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("DayWiseTenant", id));
        BigDecimal newPaid = t.getPaidAmount().add(amount);
        if (newPaid.compareTo(t.getTotalAmount()) > 0)
            throw new IllegalArgumentException("Payment exceeds total amount");
        t.setPaidAmount(newPaid);
        return map(repository.save(t));
    }

    @Override
    @Transactional
    public void autoUpdateStatuses() {
        LocalDate today = LocalDate.now();
        List<DayWiseTenant> all = repository.findAll();
        for (DayWiseTenant t : all) {
            if (t.getStatus() == DayWiseStatus.UPCOMING && !today.isBefore(t.getStartDate())) {
                t.setStatus(DayWiseStatus.ACTIVE);
            } else if (t.getStatus() == DayWiseStatus.ACTIVE && today.isAfter(t.getEndDate())) {
                t.setStatus(DayWiseStatus.COMPLETED);
            }
        }
        repository.saveAll(all);
    }

    private DayWiseTenantResponse map(DayWiseTenant t) {
        Bed bed = t.getBed();
        Room room = bed.getRoom();
        Floor floor = room.getFloor();
        PgHouse pg = floor.getPgHouse();
        return DayWiseTenantResponse.builder()
            .id(t.getId()).name(t.getName()).phone(t.getPhone()).email(t.getEmail())
            .emergencyContact(t.getEmergencyContact()).idType(t.getIdType())
            .idNumber(t.getIdNumber()).notes(t.getNotes())
            .startDate(t.getStartDate()).endDate(t.getEndDate())
            .totalDays(t.getTotalDays()).pricePerDay(t.getPricePerDay())
            .totalAmount(t.getTotalAmount()).paidAmount(t.getPaidAmount())
            .balanceAmount(t.getTotalAmount().subtract(t.getPaidAmount()))
            .status(t.getStatus())
            .bedId(bed.getId()).bedLabel(bed.getBedLabel())
            .roomId(room.getId()).roomNumber(room.getRoomNumber()).sharingType(room.getSharingType())
            .floorNumber(floor.getNumber()).floorLabel(floor.getLabel())
            .pgId(pg.getId()).pgName(pg.getName())
            .createdAt(t.getCreatedAt())
            .build();
    }
}
