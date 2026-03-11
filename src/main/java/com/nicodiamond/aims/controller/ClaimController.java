package com.nicodiamond.aims.controller;

import com.nicodiamond.aims.model.Claim;
import com.nicodiamond.aims.repository.ClaimRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/claims")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class ClaimController {

    private final ClaimRepository claimRepository;

    @GetMapping
    public List<Claim> getAllClaims() {
        return claimRepository.findAll();
    }

    @PostMapping
    public Claim createClaim(@RequestBody Claim claim) {
        if (claim.getSubmittedAt() == null) {
            claim.setSubmittedAt(java.time.LocalDateTime.now());
        }
        return claimRepository.save(claim);
    }

    @GetMapping("/{idOrNumber}")
    public ResponseEntity<Claim> getClaim(@PathVariable String idOrNumber) {
        return findClaimByIdOrNumber(idOrNumber)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/{idOrNumber}/assign/{assessorId}")
    public ResponseEntity<Map<String, String>> assignAssessor(@PathVariable String idOrNumber, @PathVariable String assessorId) {
        var claim = findClaimByIdOrNumber(idOrNumber).orElse(null);

        if (claim != null) {
            claim.setAssignedAssessor(assessorId);
            claim.setStatus("Assigned");
            claimRepository.save(claim);
            return ResponseEntity.ok(Map.of("message", "Assessor " + assessorId + " assigned to claim " + idOrNumber));
        }
        return ResponseEntity.notFound().build();
    }

    @PostMapping("/{idOrNumber}/process-payout")
    public ResponseEntity<Map<String, String>> processPayout(@PathVariable String idOrNumber) {
        var claim = findClaimByIdOrNumber(idOrNumber).orElse(null);

        if (claim != null) {
            claim.setStatus("Settled");
            claimRepository.save(claim);
            return ResponseEntity.ok(Map.of("message", "Payout processed for claim " + idOrNumber + ". Status updated to Settled."));
        }
        return ResponseEntity.notFound().build();
    }

    @GetMapping("/bottlenecks")
    public List<Claim> getBottlenecks() {
        return claimRepository.findAll().stream()
                .filter(c -> c.getBottleneckReason() != null)
                .toList();
    }

    private Optional<Claim> findClaimByIdOrNumber(String idOrNumber) {
        try {
            var id = Long.parseLong(idOrNumber);
            return claimRepository.findById(id);
        } catch (NumberFormatException e) {
            return claimRepository.findByClaimNumber(idOrNumber);
        }
    }
}
