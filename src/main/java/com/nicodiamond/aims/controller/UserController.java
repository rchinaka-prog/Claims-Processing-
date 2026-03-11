package com.nicodiamond.aims.controller;

import com.nicodiamond.aims.model.User;
import com.nicodiamond.aims.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/users")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class UserController {

    private final UserRepository userRepository;

    @GetMapping
    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    public record LoginRequest(String email, String password) {}

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest credentials) {
        return userRepository.findByEmailAndPassword(credentials.email(), credentials.password())
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.status(401).body(null));
    }

    @PostMapping("/register")
    @SuppressWarnings("null")
    public User register(@RequestBody User user) {
        return userRepository.save(user);
    }
}
