package com.pgmanagement.repository;

import com.pgmanagement.entity.PgHouse;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface PgHouseRepository extends JpaRepository<PgHouse, String> {

    Optional<PgHouse> findByOwnerId(String ownerId);

    @Query("SELECT p FROM PgHouse p LEFT JOIN FETCH p.floors f LEFT JOIN FETCH f.rooms r LEFT JOIN FETCH r.beds WHERE p.owner.id = :ownerId")
    Optional<PgHouse> findByOwnerIdWithFullHierarchy(String ownerId);
}
