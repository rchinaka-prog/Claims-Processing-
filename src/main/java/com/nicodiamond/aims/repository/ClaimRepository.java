package com.nicodiamond.aims.repository;

import com.nicodiamond.aims.model.Claim;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface ClaimRepository extends JpaRepository<Claim, Long> {
    List<Claim> findByStatus(String status);
    List<Claim> findByAssignedAssessor(String assessorId);
    List<Claim> findByRepairer(String repairerId);
    Optional<Claim> findByClaimNumber(String claimNumber);
}
