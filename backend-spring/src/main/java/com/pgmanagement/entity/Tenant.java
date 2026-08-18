package com.pgmanagement.entity;

import com.pgmanagement.enums.TenantStatus;
import com.pgmanagement.enums.UserRole;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "tenants")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Tenant {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "bed_id", nullable = false)
    private Bed bed;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    private String phone;

    private String email;
    private String emergencyContact;

    @Column(nullable = false)
    private String idType;

    @Column(nullable = false)
    private String idNumber;

    private String idProofUrl;
    private String photoUrl;

    @Column(nullable = false)
    private LocalDate joinDate;

    private LocalDate expectedVacate;
    private LocalDate actualVacate;

    private String vacateType;        // CONFIRMED or TENTATIVE
    private String vacateReason;
    private LocalDate vacateRequestDate;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal monthlyRent;

    @Column(precision = 10, scale = 2)
    @Builder.Default
    private BigDecimal securityDeposit = BigDecimal.ZERO;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private TenantStatus status = TenantStatus.ACTIVE;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private UserRole role = UserRole.TENANT;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;

    @OneToMany(mappedBy = "tenant", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @Builder.Default
    private List<RentBill> rentBills = new ArrayList<>();

    @OneToMany(mappedBy = "tenant", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @Builder.Default
    private List<Complaint> complaints = new ArrayList<>();
}
