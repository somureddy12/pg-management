package com.pgmanagement.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "meal_selections",
    uniqueConstraints = @UniqueConstraint(columnNames = {"tenant_id", "meal_post_id"}))
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class MealSelection {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "tenant_id", nullable = false,
                foreignKey = @ForeignKey(name = "fk_mealsel_tenant",
                    foreignKeyDefinition = "FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE"))
    private Tenant tenant;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "meal_post_id", nullable = false)
    private MealPost mealPost;

    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(name = "meal_selection_items",
        joinColumns = @JoinColumn(name = "selection_id"),
        inverseJoinColumns = @JoinColumn(name = "item_id"))
    @Builder.Default
    private List<MealPostItem> selectedItems = new ArrayList<>();

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;
}