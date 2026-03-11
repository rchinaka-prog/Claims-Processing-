package com.nicodiamond.aims.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;

@Entity
@Table(name = "policies")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Policy {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    private String policyNumber;
    private String holderName;
    private String status; // ACTIVE, EXPIRED, INACTIVE
    private String tier; // GOLD, SILVER, BRONZE
    private LocalDate expiryDate;
    private Double coverageLimit;
}
