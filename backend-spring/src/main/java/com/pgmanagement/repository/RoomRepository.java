package com.pgmanagement.repository;

import com.pgmanagement.entity.Room;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface RoomRepository extends JpaRepository<Room, String> {
    List<Room> findByFloorId(String floorId);

    @Query("SELECT r FROM Room r WHERE r.floor.pgHouse.id = :pgId")
    List<Room> findByPgId(String pgId);
}
