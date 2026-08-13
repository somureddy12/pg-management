package com.pgmanagement.entity;

import com.pgmanagement.enums.RentStatus;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "rent_bills",
       uniqueConstraints = @UniqueConstraint(columnNames = {"tenant_id", "month", "year"}))
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class RentBill {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "tenant_id", nullable = false)
    private Tenant tenant;

    @Column(nullable = false)
    private Integer month;

    @Column(nullable = false)
    private Integer year;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal roomRent;

    @Column(precision = 10, scale = 2)
    @Builder.Default
    private BigDecimal messCharges = BigDecimal.ZERO;

    @Column(precision = 10, scale = 2)
    @Builder.Default
    private BigDecimal electricity = BigDecimal.ZERO;

    @Column(precision = 10, scale = 2)
    @Builder.Default
    private BigDecimal lateFee = BigDecimal.ZERO;

    @Column(precision = 10, scale = 2)
    @Builder.Default
    private BigDecimal otherCharges = BigDecimal.ZERO;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal totalAmount;

    @Column(precision = 10, scale = 2)
    @Builder.Default
    private BigDecimal paidAmount = BigDecimal.ZERO;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private RentStatus status = RentStatus.UNPAID;

    @Column(nullable = false)
    private LocalDate dueDate;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;

    @OneToMany(mappedBy = "rentBill", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @Builder.Default
    private List<RentPayment> payments = new ArrayList<>();
}
