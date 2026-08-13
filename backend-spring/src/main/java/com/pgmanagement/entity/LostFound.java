package com.pgmanagement.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "lost_found")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class LostFound {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "pg_id", nullable = false)
    private PgHouse pgHouse;

    @Column(nullable = false)
    private String title;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String description;

    private String imageUrl;

    @Column(nullable = false)
    @Builder.Default
    private String status = "UNCLAIMED";

    @Column(nullable = false)
    @Builder.Default
    private LocalDateTime foundDate = LocalDateTime.now();

    private String claimedBy;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;
}
