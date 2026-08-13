package com.pgmanagement.repository;

import com.pgmanagement.entity.LostFound;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface LostFoundRepository extends JpaRepository<LostFound, String> {
    List<LostFound> findByPgHouseIdOrderByCreatedAtDesc(String pgId);
}
