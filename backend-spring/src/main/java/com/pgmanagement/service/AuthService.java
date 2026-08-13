package com.pgmanagement.service;

import com.pgmanagement.dto.request.LoginRequest;
import com.pgmanagement.dto.request.OwnerRegisterRequest;
import com.pgmanagement.dto.response.AuthResponse;

public interface AuthService {
    AuthResponse registerOwner(OwnerRegisterRequest request);
    AuthResponse loginOwner(LoginRequest request);
    AuthResponse loginTenant(LoginRequest request);
}
