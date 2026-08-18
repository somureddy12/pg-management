package com.pgmanagement.service;

import com.pgmanagement.dto.request.AddTenantRequest;
import com.pgmanagement.dto.request.TenantVacateRequestDto;
import com.pgmanagement.dto.request.UpdateTenantRequest;
import com.pgmanagement.dto.request.VacateTenantRequest;
import com.pgmanagement.dto.response.TenantResponse;
import com.pgmanagement.enums.TenantStatus;

import java.util.List;

public interface TenantService {
    TenantResponse addTenant(AddTenantRequest request);
    TenantResponse updateTenant(String id, UpdateTenantRequest request);
    TenantResponse getTenantById(String id);
    TenantResponse getMyProfile(String tenantId);
    List<TenantResponse> getTenantsByPg(String pgId, TenantStatus status);
    void vacateTenant(String tenantId, VacateTenantRequest request);

    // Tenant self-service vacate
    void submitVacateRequest(String tenantId, TenantVacateRequestDto req);
    void updateVacateRequest(String tenantId, TenantVacateRequestDto req);
    void cancelVacateRequest(String tenantId);
    List<TenantResponse> getNoticePeriodTenants(String pgId);
}
