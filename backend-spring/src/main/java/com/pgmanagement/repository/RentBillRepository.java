package com.pgmanagement.repository;

import com.pgmanagement.entity.RentBill;
import com.pgmanagement.enums.RentStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface RentBillRepository extends JpaRepository<RentBill, String> {

    List<RentBill> findByTenantIdOrderByYearDescMonthDesc(String tenantId);

    Optional<RentBill> findByTenantIdAndMonthAndYear(String tenantId, int month, int year);

    @Query("SELECT rb FROM RentBill rb WHERE rb.tenant.bed.room.floor.pgHouse.id = :pgId AND rb.month = :month AND rb.year = :year")
    List<RentBill> findByPgIdAndMonthAndYear(String pgId, int month, int year);

    @Query("SELECT rb FROM RentBill rb WHERE rb.tenant.bed.room.floor.pgHouse.id = :pgId AND rb.status IN ('UNPAID','PARTIAL') AND rb.dueDate < :today")
    List<RentBill> findDefaulters(String pgId, LocalDate today);
}
