package com.pgmanagement.entity;

import com.pgmanagement.enums.BedStatus;
import jakarta.persistence.*;
import lombok.*;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "beds",
       indexes = {
           @Index(name = "idx_bed_status",      columnList = "status"),
           @Index(name = "idx_bed_room_status", columnList = "room_id, status")
       })
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Bed {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "room_id", nullable = false)
    private Room room;

    @Column(nullable = false)
    private String bedLabel;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private BedStatus status = BedStatus.VACANT;

    @OneToMany(mappedBy = "bed", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @Builder.Default
    private List<Tenant> tenants = new ArrayList<>();

    @OneToMany(mappedBy = "bed", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @Builder.Default
    private List<AdvanceBooking> advanceBookings = new ArrayList<>();
}
