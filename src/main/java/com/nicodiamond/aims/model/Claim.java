package com.nicodiamond.aims.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "claims")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Claim {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    private String claimNumber;
    private String customerName;
    private String customerPhone;
    private String vehicleInfo;
    private String registrationNumber;
    private String status;
    private String priority;
    private String bottleneckReason;
    private Double estimatedAmount;
    private Double coverageAmount;
    private LocalDateTime submittedAt;
    private LocalDateTime dueDate;
    private String assignedAssessor;
    private String repairer;
    private Integer progress;
}
