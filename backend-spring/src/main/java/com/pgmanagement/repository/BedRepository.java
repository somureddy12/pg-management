package com.pgmanagement.repository;

import com.pgmanagement.entity.Bed;
import com.pgmanagement.enums.BedStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface BedRepository extends JpaRepository<Bed, String> {
    List<Bed> findByRoomId(String roomId);
    List<Bed> findByRoomIdAndStatus(String roomId, BedStatus status);
}
