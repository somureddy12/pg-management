package com.pgmanagement.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "advance_bookings",
       indexes = {
           @Index(name = "idx_advbooking_bed_status", columnList = "bed_id, status")
       })
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class AdvanceBooking {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "bed_id", nullable = false)
    private Bed bed;

    @Column(nullable = false)
    private String tenantName;

    @Column(nullable = false)
    private String phone;

    @Column(nullable = false)
    private LocalDate expectedJoin;

    @Column(precision = 10, scale = 2)
    @Builder.Default
    private BigDecimal advancePaid = BigDecimal.ZERO;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @Column(nullable = false)
    @Builder.Default
    private String status = "PENDING";

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;
}
