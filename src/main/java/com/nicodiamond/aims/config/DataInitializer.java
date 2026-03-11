package com.nicodiamond.aims.config;

import com.nicodiamond.aims.model.Claim;
import com.nicodiamond.aims.model.Staff;
import com.nicodiamond.aims.model.User;
import com.nicodiamond.aims.repository.ClaimRepository;
import com.nicodiamond.aims.repository.StaffRepository;
import com.nicodiamond.aims.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Configuration;

import java.time.LocalDateTime;

@Configuration
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private final ClaimRepository claimRepository;
    private final StaffRepository staffRepository;
    private final UserRepository userRepository;

    @Override
    @SuppressWarnings("null")
    public void run(String... args) {
        // Initial Users
        var user1 = userRepository.save(User.builder()
                .email("customer@example.com")
                .password("password")
                .fullName("John Doe")
                .role("CUSTOMER")
                .phone("+263 771 000 111")
                .build());

        var user2 = userRepository.save(User.builder()
                .email("assessor@example.com")
                .password("password")
                .fullName("Marcus Flint")
                .role("ASSESSOR")
                .phone("+263 772 222 333")
                .build());

        // Initial Staff
        var staff1 = staffRepository.save(Staff.builder()
                .staffId("AS-882")
                .name("Marcus Flint")
                .role("ASSESSOR")
                .workload(3)
                .status("ACTIVE")
                .build());

        var staff2 = staffRepository.save(Staff.builder()
                .staffId("AS-883")
                .name("Sarah Jenkins")
                .role("ASSESSOR")
                .workload(5)
                .status("BUSY")
                .build());

        // Initial Claims
        var claim1 = claimRepository.save(Claim.builder()
                .claimNumber("REC-9901")
                .customerName("Sarah Jenkins")
                .customerPhone("+263 772 101 202")
                .vehicleInfo("Toyota Fortuner 2022")
                .registrationNumber("AFG-1022")
                .status("Reviewing")
                .priority("MEDIUM")
                .bottleneckReason("Awaiting Field Visit")
                .submittedAt(LocalDateTime.now().minusDays(2))
                .progress(25)
                .build());

        var claim2 = claimRepository.save(Claim.builder()
                .claimNumber("REC-9902")
                .customerName("Mark Thompson")
                .customerPhone("+263 773 303 404")
                .vehicleInfo("BMW X5 2021")
                .registrationNumber("BGH-4401")
                .status("Assigned")
                .priority("CRITICAL")
                .assignedAssessor("AS-882")
                .submittedAt(LocalDateTime.now().minusDays(1))
                .progress(45)
                .build());
    }
}
