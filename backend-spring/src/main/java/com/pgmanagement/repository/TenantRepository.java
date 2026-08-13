package com.pgmanagement.repository;

import com.pgmanagement.entity.Tenant;
import com.pgmanagement.enums.TenantStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface TenantRepository extends JpaRepository<Tenant, String> {

    Optional<Tenant> findByPhone(String phone);

    @Query("SELECT t FROM Tenant t WHERE t.bed.room.floor.pgHouse.id = :pgId")
    List<Tenant> findByPgId(String pgId);

    @Query("SELECT t FROM Tenant t WHERE t.bed.room.floor.pgHouse.id = :pgId AND t.status = :status")
    List<Tenant> findByPgIdAndStatus(String pgId, TenantStatus status);

    @Query("SELECT t FROM Tenant t WHERE t.bed.room.floor.pgHouse.id = :pgId AND t.status IN ('ACTIVE', 'NOTICE_PERIOD')")
    List<Tenant> findActiveTenantsByPgId(String pgId);

    @Query("SELECT t FROM Tenant t WHERE t.bed.room.floor.pgHouse.id = :pgId AND t.status IN ('ACTIVE', 'NOTICE_PERIOD') AND t.expectedVacate BETWEEN :from AND :to")
    List<Tenant> findUpcomingVacancies(String pgId, LocalDate from, LocalDate to);
}
