package com.pgmanagement.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "notices")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Notice {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "pg_id", nullable = false)
    private PgHouse pgHouse;

    @Column(nullable = false)
    private String title;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String body;

    @Column(nullable = false)
    @Builder.Default
    private Boolean isPinned = false;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;
}
