package com.nicodiamond.aims.model;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "staff")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Staff {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    private String staffId; // e.g., AS-882
    private String name;
    private String role; // ASSESSOR, SUPPORT, MANAGER
    private Integer workload;
    private String status; // ACTIVE, BUSY, OFFLINE
}
