package com.pgmanagement.service;

import com.pgmanagement.dto.request.GenerateRentRequest;
import com.pgmanagement.dto.request.RecordPaymentRequest;
import com.pgmanagement.dto.response.RentBillResponse;

import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.List;

public interface RentService {
    List<RentBillResponse> getBillsByMonthYear(String pgId, int month, int year);
    List<RentBillResponse> generateRent(GenerateRentRequest request);
    RentBillResponse recordPayment(RecordPaymentRequest request);
    RentBillResponse recordTenantPayment(String tenantId, RecordPaymentRequest request);
    List<RentBillResponse> getTenantHistory(String tenantId);
    List<RentBillResponse> getDefaulters(String pgId);
    void generateReceipt(String billId, HttpServletResponse response) throws IOException;
}
