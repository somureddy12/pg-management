package com.pgmanagement.controller;

import com.pgmanagement.dto.request.LoginRequest;
import com.pgmanagement.dto.request.OwnerRegisterRequest;
import com.pgmanagement.dto.response.AuthResponse;
import com.pgmanagement.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/owner/register")
    public ResponseEntity<AuthResponse> registerOwner(@Valid @RequestBody OwnerRegisterRequest request) {
        return ResponseEntity.ok(authService.registerOwner(request));
    }

    @PostMapping("/owner/login")
    public ResponseEntity<AuthResponse> loginOwner(@Valid @RequestBody LoginRequest request) {
        return ResponseEntity.ok(authService.loginOwner(request));
    }

    @PostMapping("/tenant/login")
    public ResponseEntity<AuthResponse> loginTenant(@Valid @RequestBody LoginRequest request) {
        return ResponseEntity.ok(authService.loginTenant(request));
    }
}
