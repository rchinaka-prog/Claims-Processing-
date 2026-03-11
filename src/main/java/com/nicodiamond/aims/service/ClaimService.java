package com.nicodiamond.aims.service;

import com.nicodiamond.aims.model.Claim;
import com.nicodiamond.aims.repository.ClaimRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ClaimService {

    private final ClaimRepository claimRepository;

    public List<Claim> getAllClaims() {
        return claimRepository.findAll();
    }

    @SuppressWarnings("null")
    public Claim saveClaim(Claim claim) {
        return claimRepository.save(claim);
    }

    @SuppressWarnings("null")
    public void deleteClaim(Long id) {
        claimRepository.deleteById(id);
    }
}
