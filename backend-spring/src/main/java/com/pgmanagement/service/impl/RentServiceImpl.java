package com.pgmanagement.service.impl;

import com.itextpdf.text.*;
import com.itextpdf.text.pdf.*;
import com.pgmanagement.dto.request.GenerateRentRequest;
import com.pgmanagement.dto.request.RecordPaymentRequest;
import com.pgmanagement.dto.response.RentBillResponse;
import com.pgmanagement.dto.response.RentPaymentResponse;
import com.pgmanagement.entity.*;
import com.pgmanagement.enums.RentStatus;
import com.pgmanagement.exception.BusinessException;
import com.pgmanagement.exception.ResourceNotFoundException;
import com.pgmanagement.repository.*;
import com.pgmanagement.service.RentService;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.IOException;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class RentServiceImpl implements RentService {

    private final RentBillRepository rentBillRepository;
    private final RentPaymentRepository rentPaymentRepository;
    private final TenantRepository tenantRepository;
    private final PgHouseRepository pgHouseRepository;

    @Override
    @Transactional(readOnly = true)
    public List<RentBillResponse> getBillsByMonthYear(String pgId, int month, int year) {
        return rentBillRepository.findByPgIdAndMonthAndYear(pgId, month, year)
            .stream().map(this::mapToResponse).toList();
    }

    @Override
    @Transactional
    public List<RentBillResponse> generateRent(GenerateRentRequest request) {
        List<Tenant> tenants = tenantRepository.findActiveTenantsByPgId(request.getPgId());
        List<RentBillResponse> generated = new ArrayList<>();
        for (Tenant tenant : tenants) {
            boolean exists = rentBillRepository.findByTenantIdAndMonthAndYear(
                tenant.getId(), request.getMonth(), request.getYear()).isPresent();
            if (exists) continue;
            RentBill bill = RentBill.builder()
                .tenant(tenant).month(request.getMonth()).year(request.getYear())
                .roomRent(tenant.getMonthlyRent()).totalAmount(tenant.getMonthlyRent())
                .dueDate(LocalDate.of(request.getYear(), request.getMonth(), 5))
                .status(RentStatus.UNPAID)
                .build();
            generated.add(mapToResponse(rentBillRepository.save(bill)));
        }
        return generated;
    }

    @Override
    @Transactional
    public RentBillResponse recordPayment(RecordPaymentRequest request) {
        RentBill bill = rentBillRepository.findById(request.getRentBillId())
            .orElseThrow(() -> new ResourceNotFoundException("RentBill", request.getRentBillId()));
        RentPayment payment = RentPayment.builder()
            .rentBill(bill).amount(request.getAmount()).mode(request.getMode())
            .reference(request.getReference()).notes(request.getNotes())
            .build();
        rentPaymentRepository.save(payment);
        BigDecimal newPaid = bill.getPaidAmount().add(request.getAmount());
        bill.setPaidAmount(newPaid);
        bill.setStatus(newPaid.compareTo(bill.getTotalAmount()) >= 0 ? RentStatus.PAID : RentStatus.PARTIAL);
        return mapToResponse(rentBillRepository.save(bill));
    }

    @Override
    @Transactional
    public RentBillResponse recordTenantPayment(String tenantId, RecordPaymentRequest request) {
        RentBill bill = rentBillRepository.findById(request.getRentBillId())
            .orElseThrow(() -> new ResourceNotFoundException("RentBill", request.getRentBillId()));
        if (!bill.getTenant().getId().equals(tenantId))
            throw new RuntimeException("Not authorized to pay this bill");
        if (bill.getStatus() == RentStatus.PAID)
            throw new RuntimeException("This bill is already fully paid");
        return recordPayment(request);
    }

    @Override
    @Transactional(readOnly = true)
    public List<RentBillResponse> getTenantHistory(String tenantId) {
        return rentBillRepository.findByTenantIdOrderByYearDescMonthDesc(tenantId)
            .stream().map(this::mapToResponse).toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<RentBillResponse> getDefaulters(String pgId) {
        return rentBillRepository.findDefaulters(pgId, LocalDate.now())
            .stream().map(this::mapToResponse).toList();
    }

    @Override
    @Transactional(readOnly = true)
    public void generateReceipt(String billId, HttpServletResponse response) throws IOException {
        RentBill bill = rentBillRepository.findById(billId)
            .orElseThrow(() -> new ResourceNotFoundException("RentBill", billId));
        Tenant tenant = bill.getTenant();
        Room room = tenant.getBed().getRoom();
        Floor floor = room.getFloor();
        PgHouse pg = floor.getPgHouse();

        response.setContentType("application/pdf");
        response.setHeader("Content-Disposition", "attachment; filename=receipt-" + billId + ".pdf");

        try {
            Document doc = new Document(PageSize.A5);
            PdfWriter.getInstance(doc, response.getOutputStream());
            doc.open();

            Font titleFont = new Font(Font.FontFamily.HELVETICA, 16, Font.BOLD);
            Font headerFont = new Font(Font.FontFamily.HELVETICA, 11, Font.BOLD);
            Font normalFont = new Font(Font.FontFamily.HELVETICA, 10, Font.NORMAL);
            Font smallFont = new Font(Font.FontFamily.HELVETICA, 8, Font.NORMAL);

            String[] months = {"","Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"};

            // Header
            Paragraph pgName = new Paragraph(pg.getName(), titleFont);
            pgName.setAlignment(Element.ALIGN_CENTER);
            doc.add(pgName);
            Paragraph addr = new Paragraph(pg.getAddress() != null ? pg.getAddress() : "", smallFont);
            addr.setAlignment(Element.ALIGN_CENTER);
            doc.add(addr);
            doc.add(new Paragraph(" "));

            Paragraph receipt = new Paragraph("RENT RECEIPT", new Font(Font.FontFamily.HELVETICA, 14, Font.BOLD | Font.UNDERLINE));
            receipt.setAlignment(Element.ALIGN_CENTER);
            doc.add(receipt);
            doc.add(new Paragraph(" "));

            // Tenant info
            doc.add(new Paragraph("Tenant: " + tenant.getName(), headerFont));
            doc.add(new Paragraph("Room: " + room.getRoomNumber() + ", Bed: " + tenant.getBed().getBedLabel() + ", Floor: " + floor.getNumber(), normalFont));
            doc.add(new Paragraph("Period: " + months[bill.getMonth()] + " " + bill.getYear(), normalFont));
            doc.add(new Paragraph("Bill Date: " + LocalDate.now().format(DateTimeFormatter.ofPattern("dd MMM yyyy")), normalFont));
            doc.add(new Paragraph(" "));

            // Bill details table
            PdfPTable table = new PdfPTable(2);
            table.setWidthPercentage(100);
            addTableRow(table, "Room Rent", "₹" + bill.getRoomRent(), normalFont);
            if (bill.getMessCharges().compareTo(BigDecimal.ZERO) > 0)
                addTableRow(table, "Mess Charges", "₹" + bill.getMessCharges(), normalFont);
            if (bill.getElectricity().compareTo(BigDecimal.ZERO) > 0)
                addTableRow(table, "Electricity", "₹" + bill.getElectricity(), normalFont);
            if (bill.getLateFee().compareTo(BigDecimal.ZERO) > 0)
                addTableRow(table, "Late Fee", "₹" + bill.getLateFee(), normalFont);
            addTableRow(table, "Total Amount", "₹" + bill.getTotalAmount(), headerFont);
            addTableRow(table, "Amount Paid", "₹" + bill.getPaidAmount(), headerFont);
            addTableRow(table, "Status", bill.getStatus().name(), headerFont);
            doc.add(table);
            doc.add(new Paragraph(" "));

            // Payment details
            if (!bill.getPayments().isEmpty()) {
                doc.add(new Paragraph("Payment Details:", headerFont));
                bill.getPayments().forEach(p -> {
                    try {
                        doc.add(new Paragraph("  " + p.getPaymentDate().toLocalDate() + " — " + p.getMode() + " — ₹" + p.getAmount()
                            + (p.getReference() != null ? " (Ref: " + p.getReference() + ")" : ""), normalFont));
                    } catch (DocumentException e) { throw new RuntimeException(e); }
                });
            }

            doc.add(new Paragraph(" "));
            Paragraph sig = new Paragraph("Authorised Signatory", normalFont);
            sig.setAlignment(Element.ALIGN_RIGHT);
            doc.add(sig);
            doc.close();
        } catch (DocumentException e) {
            throw new IOException("Failed to generate PDF: " + e.getMessage());
        }
    }

    private void addTableRow(PdfPTable table, String label, String value, Font font) {
        PdfPCell c1 = new PdfPCell(new Phrase(label, font));
        PdfPCell c2 = new PdfPCell(new Phrase(value, font));
        c1.setBorder(Rectangle.BOTTOM); c2.setBorder(Rectangle.BOTTOM);
        c2.setHorizontalAlignment(Element.ALIGN_RIGHT);
        table.addCell(c1); table.addCell(c2);
    }

    private RentBillResponse mapToResponse(RentBill b) {
        Tenant t = b.getTenant();
        return RentBillResponse.builder()
            .id(b.getId()).month(b.getMonth()).year(b.getYear())
            .roomRent(b.getRoomRent()).messCharges(b.getMessCharges())
            .electricity(b.getElectricity()).lateFee(b.getLateFee())
            .otherCharges(b.getOtherCharges()).totalAmount(b.getTotalAmount())
            .paidAmount(b.getPaidAmount()).status(b.getStatus())
            .dueDate(b.getDueDate()).createdAt(b.getCreatedAt())
            .tenantId(t.getId()).tenantName(t.getName()).tenantPhone(t.getPhone())
            .roomNumber(t.getBed().getRoom().getRoomNumber()).bedLabel(t.getBed().getBedLabel())
            .sharingType(t.getBed().getRoom().getSharingType())
            .floorNumber(t.getBed().getRoom().getFloor().getNumber())
            .payments(b.getPayments() == null ? List.of() :
                b.getPayments().stream().map(p -> RentPaymentResponse.builder()
                    .id(p.getId()).amount(p.getAmount()).paymentDate(p.getPaymentDate())
                    .mode(p.getMode()).reference(p.getReference()).notes(p.getNotes()).build())
                .toList())
            .build();
    }
}
