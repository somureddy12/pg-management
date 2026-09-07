package com.pgmanagement.repository;

import com.pgmanagement.entity.DayWiseTenant;
import com.pgmanagement.enums.DayWiseStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface DayWiseTenantRepository extends JpaRepository<DayWiseTenant, String> {

    @Query("SELECT d FROM DayWiseTenant d WHERE d.bed.room.floor.pgHouse.id = :pgId ORDER BY d.startDate DESC")
    List<DayWiseTenant> findByPgId(String pgId);

    @Query("SELECT d FROM DayWiseTenant d WHERE d.bed.room.floor.pgHouse.id = :pgId AND d.status = :status ORDER BY d.startDate DESC")
    List<DayWiseTenant> findByPgIdAndStatus(String pgId, DayWiseStatus status);

    @Query("SELECT d FROM DayWiseTenant d WHERE d.bed.room.floor.pgHouse.id = :pgId AND d.status IN ('UPCOMING','ACTIVE') AND d.endDate = :today")
    List<DayWiseTenant> findTodayCheckouts(String pgId, LocalDate today);
}
