package com.pgmanagement.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "pg_houses")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class PgHouse {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "owner_id", nullable = false)
    private Owner owner;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String address;

    @Column(columnDefinition = "TEXT")
    private String description;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;

    @OneToMany(mappedBy = "pgHouse", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @Builder.Default
    private List<Floor> floors = new ArrayList<>();

    @OneToMany(mappedBy = "pgHouse", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @Builder.Default
    private List<Notice> notices = new ArrayList<>();

    @OneToMany(mappedBy = "pgHouse", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @Builder.Default
    private List<LostFound> lostFoundItems = new ArrayList<>();

    @OneToMany(mappedBy = "pgHouse", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @Builder.Default
    private List<Expense> expenses = new ArrayList<>();
}
