package com.nicodiamond.aims.model;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "repairers")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Repairer {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    private String name;
    private String location;
    private String specialization;
    private Double rating;
    private Integer activeJobs;
}
