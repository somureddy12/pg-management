package com.pgmanagement.repository;

import com.pgmanagement.entity.AdvanceBooking;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AdvanceBookingRepository extends JpaRepository<AdvanceBooking, String> {
    List<AdvanceBooking> findByBedIdAndStatus(String bedId, String status);

    @Query("SELECT ab FROM AdvanceBooking ab WHERE ab.bed.room.floor.pgHouse.id = :pgId AND ab.status = 'PENDING'")
    List<AdvanceBooking> findPendingByPgId(String pgId);
}
