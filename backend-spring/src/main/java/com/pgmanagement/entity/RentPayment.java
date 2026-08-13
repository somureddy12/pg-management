package com.pgmanagement.entity;

import com.pgmanagement.enums.PaymentMode;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "rent_payments")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class RentPayment {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "rent_bill_id", nullable = false)
    private RentBill rentBill;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal amount;

    @CreationTimestamp
    private LocalDateTime paymentDate;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private PaymentMode mode;

    private String reference;

    @Column(columnDefinition = "TEXT")
    private String notes;
}
