package com.pgmanagement.repository;

import com.pgmanagement.entity.Owner;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface OwnerRepository extends JpaRepository<Owner, String> {
    Optional<Owner> findByEmail(String email);
    boolean existsByEmail(String email);
}
