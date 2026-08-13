package com.pgmanagement.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "weekly_menus")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class WeeklyMenu {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "pg_id", nullable = false)
    private PgHouse pgHouse;

    @Column(nullable = false)
    private LocalDate weekStartDate;

    @OneToMany(mappedBy = "weeklyMenu", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @Builder.Default
    private List<MenuItem> menuItems = new ArrayList<>();
}
