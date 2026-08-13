package com.pgmanagement.repository;

import com.pgmanagement.entity.RentPayment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface RentPaymentRepository extends JpaRepository<RentPayment, String> {
    List<RentPayment> findByRentBillId(String rentBillId);
}
