package com.pgmanagement.entity;

import jakarta.persistence.*;
import lombok.*;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "tenant_meal_defaults",
    uniqueConstraints = @UniqueConstraint(columnNames = {"tenant_id", "meal_post_id"}))
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class TenantMealDefault {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "tenant_id", nullable = false)
    private Tenant tenant;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "meal_post_id", nullable = false)
    private MealPost mealPost;

    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(name = "tenant_meal_default_items",
        joinColumns = @JoinColumn(name = "default_id"),
        inverseJoinColumns = @JoinColumn(name = "item_id"))
    @Builder.Default
    private List<MealPostItem> defaultItems = new ArrayList<>();
}