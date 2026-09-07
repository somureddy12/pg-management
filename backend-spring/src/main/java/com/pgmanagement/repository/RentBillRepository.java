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

    // Only count bills for active tenants — vacated tenants' bills must not inflate the monthly totals
    @Query("SELECT rb FROM RentBill rb WHERE rb.tenant.bed.room.floor.pgHouse.id = :pgId AND rb.month = :month AND rb.year = :year AND rb.tenant.status IN ('ACTIVE', 'NOTICE_PERIOD')")
    List<RentBill> findByPgIdAndMonthAndYear(String pgId, int month, int year);

    // Only flag active tenants as defaulters — vacated tenants' dues are visible on their own profile
    @Query("SELECT rb FROM RentBill rb WHERE rb.tenant.bed.room.floor.pgHouse.id = :pgId AND rb.status IN ('UNPAID','PARTIAL') AND rb.dueDate < :today AND rb.tenant.status IN ('ACTIVE', 'NOTICE_PERIOD')")
    List<RentBill> findDefaulters(String pgId, LocalDate today);

    // Fetch the single latest bill per tenant in one query instead of N+1 individual queries
    @Query("SELECT rb FROM RentBill rb WHERE rb.tenant.id IN :tenantIds AND (rb.year * 100 + rb.month) = (SELECT MAX(rb2.year * 100 + rb2.month) FROM RentBill rb2 WHERE rb2.tenant.id = rb.tenant.id)")
    List<RentBill> findLatestBillPerTenant(List<String> tenantIds);
}
