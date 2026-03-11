package com.nicodiamond.aims.controller;

import com.nicodiamond.aims.model.Staff;
import com.nicodiamond.aims.repository.StaffRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/staff")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class StaffController {

    private final StaffRepository staffRepository;

    @GetMapping
    public List<Staff> getAllStaff() {
        return staffRepository.findAll();
    }

    @GetMapping("/role/{role}")
    public List<Staff> getStaffByRole(@PathVariable String role) {
        return staffRepository.findByRole(role);
    }

    @PostMapping
    @SuppressWarnings("null")
    public Staff createStaff(@RequestBody Staff staff) {
        return staffRepository.save(staff);
    }
}
