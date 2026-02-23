
package com.nicodiamond.aims.controller;

import org.springframework.web.bind.annotation.*;
import java.util.*;

@RestController
@RequestMapping("/api/claims")
@CrossOrigin(origins = "*")
public class ClaimController {

    // Simple mock data for demonstration
    private static List<Map<String, Object>> claims = new ArrayList<>();

    static {
        Map<String, Object> c1 = new HashMap<>();
        c1.put("id", "REC-9901");
        c1.put("customer", "Sarah Jenkins");
        c1.put("phone", "+263 772 101 202");
        c1.put("status", "Reviewing");
        c1.put("bottleneck", "Awaiting Field Visit");
        claims.add(c1);
    }

    @GetMapping
    public List<Map<String, Object>> getAllClaims() {
        return claims;
    }

    @PostMapping("/{claimId}/assign/{assessorId}")
    public Map<String, String> assignAssessor(@PathVariable String claimId, @PathVariable String assessorId) {
        // Logic to update claim in DB would go here
        return Collections.singletonMap("message", "Assessor " + assessorId + " assigned to claim " + claimId);
    }

    @PostMapping("/{claimId}/process-payout")
    public Map<String, String> processPayout(@PathVariable String claimId) {
        for (Map<String, Object> claim : claims) {
            if (claimId.equals(claim.get("id"))) {
                claim.put("status", "Settled");
                return Collections.singletonMap("message", "Payout processed for claim " + claimId + ". Status updated to Settled.");
            }
        }
        return Collections.singletonMap("error", "Claim not found: " + claimId);
    }

    @GetMapping("/bottlenecks")
    public List<Map<String, Object>> getBottlenecks() {
        return claims.stream()
            .filter(c -> c.get("bottleneck") != null)
            .toList();
    }
}
