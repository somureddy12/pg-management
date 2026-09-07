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

    @Query("SELECT t FROM Tenant t WHERE t.phone = :phone AND t.status IN ('ACTIVE', 'NOTICE_PERIOD') ORDER BY t.joinDate DESC")
    List<Tenant> findActiveByPhone(String phone);

    @Query("SELECT COUNT(t) > 0 FROM Tenant t WHERE t.phone = :phone AND t.status IN ('ACTIVE', 'NOTICE_PERIOD') AND t.id <> :excludeId")
    boolean existsActiveByPhoneExcluding(String phone, String excludeId);

    @Query("SELECT COUNT(t) > 0 FROM Tenant t WHERE t.idNumber = :idNumber AND t.status IN ('ACTIVE', 'NOTICE_PERIOD') AND t.id <> :excludeId")
    boolean existsActiveByIdNumberExcluding(String idNumber, String excludeId);

    // Default: only active tenants — vacated/defaulter records are fetched via findByPgIdAndStatus
    @Query("SELECT t FROM Tenant t WHERE t.bed.room.floor.pgHouse.id = :pgId AND t.status IN ('ACTIVE', 'NOTICE_PERIOD')")
    List<Tenant> findByPgId(String pgId);

    @Query("SELECT t FROM Tenant t WHERE t.bed.room.floor.pgHouse.id = :pgId AND t.status = :status")
    List<Tenant> findByPgIdAndStatus(String pgId, TenantStatus status);

    @Query("SELECT t FROM Tenant t WHERE t.bed.room.floor.pgHouse.id = :pgId AND t.status IN ('ACTIVE', 'NOTICE_PERIOD') AND t.expectedVacate BETWEEN :from AND :to")
    List<Tenant> findUpcomingVacancies(String pgId, LocalDate from, LocalDate to);

    @Query("SELECT t.status, COUNT(t) FROM Tenant t WHERE t.bed.room.floor.pgHouse.id = :pgId GROUP BY t.status")
    List<Object[]> countByPgIdGroupByStatus(String pgId);
}
