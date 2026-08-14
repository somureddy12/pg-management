package com.pgmanagement.service.impl;

import com.pgmanagement.dto.request.LoginRequest;
import com.pgmanagement.dto.request.OwnerRegisterRequest;
import com.pgmanagement.dto.response.AuthResponse;
import com.pgmanagement.entity.Owner;
import com.pgmanagement.entity.Tenant;
import java.util.List;
import com.pgmanagement.exception.BusinessException;
import com.pgmanagement.exception.ResourceNotFoundException;
import com.pgmanagement.repository.OwnerRepository;
import com.pgmanagement.repository.TenantRepository;
import com.pgmanagement.security.JwtUtil;
import com.pgmanagement.service.AuthService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthServiceImpl implements AuthService {

    private final OwnerRepository ownerRepository;
    private final TenantRepository tenantRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;

    @Override
    @Transactional
    public AuthResponse registerOwner(OwnerRegisterRequest request) {
        log.info("Registering owner with email: {}", request.getEmail());
        if (ownerRepository.findByEmail(request.getEmail()).isPresent()) {
            throw new BusinessException("Email already registered: " + request.getEmail());
        }
        try {
            Owner owner = Owner.builder()
                .name(request.getName())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .phone(request.getPhone())
                .build();
            owner = ownerRepository.save(owner);
            ownerRepository.flush();
            log.info("Owner registered successfully with id: {}", owner.getId());
            String token = jwtUtil.generateToken(owner.getId(), "OWNER");
            return buildAuthResponse(token, owner.getId(), owner.getName(), owner.getEmail(), owner.getPhone(), "OWNER");
        } catch (Exception e) {
            log.error("Error registering owner: {}", e.getMessage(), e);
            throw new BusinessException("Registration failed: " + e.getMessage());
        }
    }

    @Override
    @Transactional(readOnly = true)
    public AuthResponse loginOwner(LoginRequest request) {
        Owner owner = ownerRepository.findByEmail(request.getIdentifier())
            .orElseThrow(() -> new BusinessException("Invalid email or password"));
        if (!passwordEncoder.matches(request.getPassword(), owner.getPassword())) {
            throw new BusinessException("Invalid email or password");
        }
        String token = jwtUtil.generateToken(owner.getId(), "OWNER");
        return buildAuthResponse(token, owner.getId(), owner.getName(), owner.getEmail(), owner.getPhone(), "OWNER");
    }

    @Override
    @Transactional(readOnly = true)
    public AuthResponse loginTenant(LoginRequest request) {
        List<Tenant> matches = tenantRepository.findActiveByPhone(request.getIdentifier());
        if (matches.isEmpty()) throw new ResourceNotFoundException("Tenant not found with phone: " + request.getIdentifier());
        Tenant tenant = matches.get(0);
        String token = jwtUtil.generateToken(tenant.getId(), "TENANT");
        return buildAuthResponse(token, tenant.getId(), tenant.getName(), tenant.getEmail(), tenant.getPhone(), "TENANT");
    }

    private AuthResponse buildAuthResponse(String token, String id, String name, String email, String phone, String role) {
        return AuthResponse.builder()
            .token(token)
            .user(AuthResponse.UserDto.builder()
                .id(id).name(name).email(email).phone(phone).role(role)
                .build())
            .build();
    }
}