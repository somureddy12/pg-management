package com.pgmanagement.dto.response;

import com.pgmanagement.enums.TenantStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class TenantResponse {
    private String id;
    private String name;
    private String phone;
    private String email;
    private String emergencyContact;
    private String idType;
    private String idNumber;
    private String idProofUrl;
    private String photoUrl;
    private LocalDate joinDate;
    private LocalDate expectedVacate;
    private LocalDate actualVacate;
    private BigDecimal monthlyRent;
    private BigDecimal securityDeposit;
    private TenantStatus status;
    private LocalDateTime createdAt;

    // Bed / room location
    private String bedId;
    private String bedLabel;
    private String roomId;
    private String roomNumber;
    private Integer floorNumber;
    private String floorLabel;
    private String pgId;
    private String pgName;

    // Latest rent bill (for list view)
    private RentBillSummary latestBill;

    // Full collections (for detail view)
    private List<RentBillResponse> rentBills;
    private List<ComplaintResponse> complaints;

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class RentBillSummary {
        private String id;
        private Integer month;
        private Integer year;
        private String status;
        private BigDecimal totalAmount;
        private BigDecimal paidAmount;
    }
}
