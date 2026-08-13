package com.pgmanagement.controller;

import com.pgmanagement.repository.OwnerRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/dev")
@RequiredArgsConstructor
public class DevController {

    private final OwnerRepository ownerRepository;
    private final PasswordEncoder passwordEncoder;

    @GetMapping("/reset-password")
    public String resetPassword(@RequestParam String email, @RequestParam String newPassword) {
        return ownerRepository.findByEmail(email).map(owner -> {
            owner.setPassword(passwordEncoder.encode(newPassword));
            ownerRepository.save(owner);
            return "Password reset successfully for: " + email;
        }).orElse("Owner not found");
    }
}