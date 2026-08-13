package com.pgmanagement.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "meal_posts")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class MealPost {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "pg_house_id", nullable = false)
    private PgHouse pgHouse;

    @Column(nullable = false)
    private LocalDate date;

    @Column(nullable = false)
    private String mealType; // BREAKFAST, LUNCH, DINNER

    @Column(nullable = false)
    private LocalDateTime windowOpen;

    @Column(nullable = false)
    private LocalDateTime windowClose;

    @OneToMany(mappedBy = "mealPost", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @Builder.Default
    private List<MealPostItem> items = new ArrayList<>();

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;
}