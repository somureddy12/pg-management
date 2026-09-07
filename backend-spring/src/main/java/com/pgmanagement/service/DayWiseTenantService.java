package com.pgmanagement.service;

import com.pgmanagement.dto.request.DayWiseTenantRequest;
import com.pgmanagement.dto.response.DayWiseTenantResponse;

import java.math.BigDecimal;
import java.util.List;

public interface DayWiseTenantService {
    DayWiseTenantResponse add(DayWiseTenantRequest request);
    List<DayWiseTenantResponse> getByPg(String pgId);
    DayWiseTenantResponse checkout(String id);
    DayWiseTenantResponse cancel(String id);
    DayWiseTenantResponse recordPayment(String id, BigDecimal amount);
    void autoUpdateStatuses();
}
