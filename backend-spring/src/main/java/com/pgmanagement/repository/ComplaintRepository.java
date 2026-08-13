package com.pgmanagement.repository;

import com.pgmanagement.entity.Complaint;
import com.pgmanagement.enums.ComplaintStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ComplaintRepository extends JpaRepository<Complaint, String> {

    @Query("SELECT c FROM Complaint c WHERE c.room.floor.pgHouse.id = :pgId ORDER BY c.createdAt DESC")
    List<Complaint> findByPgId(String pgId);

    @Query("SELECT c FROM Complaint c WHERE c.room.floor.pgHouse.id = :pgId AND c.status = :status ORDER BY c.createdAt DESC")
    List<Complaint> findByPgIdAndStatus(String pgId, ComplaintStatus status);

    List<Complaint> findByTenantIdOrderByCreatedAtDesc(String tenantId);
}
