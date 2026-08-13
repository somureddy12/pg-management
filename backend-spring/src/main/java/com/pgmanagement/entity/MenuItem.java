package com.pgmanagement.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "menu_items")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class MenuItem {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "weekly_menu_id", nullable = false)
    private WeeklyMenu weeklyMenu;

    @Column(nullable = false, length = 3)
    private String day; // MON, TUE, ...

    @Column(nullable = false)
    private String mealType; // BREAKFAST, LUNCH, DINNER

    @Column(nullable = false, columnDefinition = "TEXT")
    private String items;

    @Column(nullable = false)
    @Builder.Default
    private Boolean isVeg = true;

    private String timing;
}
