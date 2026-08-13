package com.pgmanagement.entity;

import jakarta.persistence.*;
import lombok.*;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "floors")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Floor {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "pg_id", nullable = false)
    private PgHouse pgHouse;

    @Column(nullable = false)
    private Integer number;

    private String label;

    @OneToMany(mappedBy = "floor", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @Builder.Default
    private List<Room> rooms = new ArrayList<>();
}
