package com.nicodiamond.aims.controller;

import com.nicodiamond.aims.model.Repairer;
import com.nicodiamond.aims.repository.RepairerRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/repairers")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class RepairerController {

    private final RepairerRepository repairerRepository;

    @GetMapping
    public List<Repairer> getAllRepairers() {
        return repairerRepository.findAll();
    }

    @PostMapping
    @SuppressWarnings("null")
    public Repairer createRepairer(@RequestBody Repairer repairer) {
        return repairerRepository.save(repairer);
    }
}
