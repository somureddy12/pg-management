package com.pgmanagement.service;

import com.pgmanagement.dto.request.AddTenantRequest;
import com.pgmanagement.dto.request.VacateTenantRequest;
import com.pgmanagement.dto.response.TenantResponse;
import com.pgmanagement.enums.TenantStatus;

import java.util.List;

public interface TenantService {
    TenantResponse addTenant(AddTenantRequest request);
    TenantResponse getTenantById(String id);
    TenantResponse getMyProfile(String tenantId);
    List<TenantResponse> getTenantsByPg(String pgId, TenantStatus status);
    void vacateTenant(String tenantId, VacateTenantRequest request);
}
