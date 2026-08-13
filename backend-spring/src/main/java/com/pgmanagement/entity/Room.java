package com.pgmanagement.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "rooms")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Room {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "floor_id", nullable = false)
    private Floor floor;

    @Column(nullable = false)
    private String roomNumber;

    @Column(nullable = false)
    private Integer sharingType;

    @ElementCollection
    @CollectionTable(name = "room_amenities", joinColumns = @JoinColumn(name = "room_id"))
    @Column(name = "amenity")
    @Builder.Default
    private List<String> amenities = new ArrayList<>();

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal monthlyRent;

    @OneToMany(mappedBy = "room", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @Builder.Default
    private List<Bed> beds = new ArrayList<>();

    @OneToMany(mappedBy = "room", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @Builder.Default
    private List<Complaint> complaints = new ArrayList<>();
}
