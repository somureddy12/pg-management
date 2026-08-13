package com.pgmanagement.service.impl;

import com.pgmanagement.dto.response.ExpenseResponse;
import com.pgmanagement.dto.response.MonthlyReportResponse;
import com.pgmanagement.dto.response.OccupancyReportResponse;
import com.pgmanagement.entity.Expense;
import com.pgmanagement.entity.Floor;
import com.pgmanagement.entity.RentBill;
import com.pgmanagement.repository.ExpenseRepository;
import com.pgmanagement.repository.FloorRepository;
import com.pgmanagement.repository.RentBillRepository;
import com.pgmanagement.service.ReportService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ReportServiceImpl implements ReportService {

    private final RentBillRepository rentBillRepository;
    private final ExpenseRepository expenseRepository;
    private final FloorRepository floorRepository;

    @Override
    @Transactional(readOnly = true)
    public MonthlyReportResponse getMonthlyReport(String pgId, int month, int year) {
        List<RentBill> bills = rentBillRepository.findByPgIdAndMonthAndYear(pgId, month, year);

        BigDecimal rentCollected = bills.stream().map(RentBill::getPaidAmount).reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal messCharges = bills.stream().map(RentBill::getMessCharges).reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal lateFees = bills.stream().map(RentBill::getLateFee).reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal totalRent = bills.stream().map(RentBill::getTotalAmount).reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal totalIncome = rentCollected.add(messCharges).add(lateFees);

        LocalDate from = LocalDate.of(year, month, 1);
        LocalDate to = from.withDayOfMonth(from.lengthOfMonth());
        List<Expense> expenseList = expenseRepository.findByPgHouseIdAndDateBetweenOrderByDateDesc(pgId, from, to);

        BigDecimal totalExpenses = expenseList.stream().map(Expense::getAmount).reduce(BigDecimal.ZERO, BigDecimal::add);
        Map<String, BigDecimal> byCategory = expenseList.stream().collect(
            Collectors.groupingBy(Expense::getCategory,
                Collectors.reducing(BigDecimal.ZERO, Expense::getAmount, BigDecimal::add)));

        List<ExpenseResponse> expenseResponses = expenseList.stream().map(e -> ExpenseResponse.builder()
            .id(e.getId()).category(e.getCategory()).description(e.getDescription())
            .amount(e.getAmount()).date(e.getDate()).createdAt(e.getCreatedAt()).build()).toList();

        return MonthlyReportResponse.builder()
            .income(MonthlyReportResponse.IncomeBreakdown.builder()
                .rentCollected(rentCollected).messCharges(messCharges)
                .lateFees(lateFees).total(totalIncome).build())
            .expenses(MonthlyReportResponse.ExpenseBreakdown.builder()
                .total(totalExpenses).byCategory(byCategory).items(expenseResponses).build())
            .netProfit(totalIncome.subtract(totalExpenses))
            .pendingRent(totalRent.subtract(rentCollected))
            .build();
    }

    @Override
    @Transactional(readOnly = true)
    public OccupancyReportResponse getOccupancyReport(String pgId) {
        List<Floor> floors = floorRepository.findByPgHouseIdOrderByNumberAsc(pgId);
        long gTotal = 0, gOccupied = 0, gVacant = 0, gAdvance = 0;

        List<OccupancyReportResponse.FloorOccupancy> floorOccupancies = floors.stream().map(floor -> {
            long fTotal = 0, fOccupied = 0, fVacant = 0, fAdvance = 0;
            List<OccupancyReportResponse.RoomOccupancy> roomOccupancies = floor.getRooms().stream().map(room -> {
                long rTotal = room.getBeds().size();
                long rOccupied = room.getBeds().stream().filter(b -> b.getStatus().name().equals("OCCUPIED")).count();
                long rVacant = room.getBeds().stream().filter(b -> b.getStatus().name().equals("VACANT")).count();
                long rAdvance = room.getBeds().stream().filter(b -> b.getStatus().name().equals("ADVANCE_BOOKED")).count();
                return OccupancyReportResponse.RoomOccupancy.builder()
                    .roomNumber(room.getRoomNumber()).sharingType(room.getSharingType())
                    .total(rTotal).occupied(rOccupied).vacant(rVacant).advance(rAdvance).build();
            }).toList();
            long floorTotal = roomOccupancies.stream().mapToLong(OccupancyReportResponse.RoomOccupancy::getTotal).sum();
            long floorOcc = roomOccupancies.stream().mapToLong(OccupancyReportResponse.RoomOccupancy::getOccupied).sum();
            long floorVac = roomOccupancies.stream().mapToLong(OccupancyReportResponse.RoomOccupancy::getVacant).sum();
            long floorAdv = roomOccupancies.stream().mapToLong(OccupancyReportResponse.RoomOccupancy::getAdvance).sum();
            return OccupancyReportResponse.FloorOccupancy.builder()
                .floorNumber(floor.getNumber()).label(floor.getLabel())
                .total(floorTotal).occupied(floorOcc).vacant(floorVac).advance(floorAdv)
                .rooms(roomOccupancies).build();
        }).toList();

        long sTotal = floorOccupancies.stream().mapToLong(OccupancyReportResponse.FloorOccupancy::getTotal).sum();
        long sOcc = floorOccupancies.stream().mapToLong(OccupancyReportResponse.FloorOccupancy::getOccupied).sum();
        long sVac = floorOccupancies.stream().mapToLong(OccupancyReportResponse.FloorOccupancy::getVacant).sum();
        long sAdv = floorOccupancies.stream().mapToLong(OccupancyReportResponse.FloorOccupancy::getAdvance).sum();

        return OccupancyReportResponse.builder()
            .floors(floorOccupancies)
            .summary(OccupancyReportResponse.FloorOccupancy.builder()
                .total(sTotal).occupied(sOcc).vacant(sVac).advance(sAdv).build())
            .build();
    }
}
