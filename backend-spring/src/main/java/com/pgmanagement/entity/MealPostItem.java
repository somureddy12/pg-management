package com.pgmanagement.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "meal_post_items")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class MealPostItem {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "meal_post_id", nullable = false)
    private MealPost mealPost;

    @Column(nullable = false)
    private String itemName;

    @Builder.Default
    private Boolean isVeg = true;

    @Builder.Default
    private Boolean isDefault = Boolean.FALSE;
}