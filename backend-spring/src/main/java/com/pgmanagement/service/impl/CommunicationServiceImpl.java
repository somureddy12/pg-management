package com.pgmanagement.service.impl;

import com.pgmanagement.dto.request.*;
import com.pgmanagement.dto.response.*;
import com.pgmanagement.entity.*;
import com.pgmanagement.enums.ComplaintStatus;
import com.pgmanagement.exception.ResourceNotFoundException;
import com.pgmanagement.repository.*;
import com.pgmanagement.service.CommunicationService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class CommunicationServiceImpl implements CommunicationService {

    private final NoticeRepository noticeRepository;
    private final LostFoundRepository lostFoundRepository;
    private final ComplaintRepository complaintRepository;
    private final PgHouseRepository pgHouseRepository;
    private final TenantRepository tenantRepository;
    private final RoomRepository roomRepository;

    // ─── Notices ──────────────────────────────────────────────────────────────

    @Override @Transactional
    public NoticeResponse createNotice(CreateNoticeRequest request) {
        PgHouse pg = pgHouseRepository.findById(request.getPgId())
            .orElseThrow(() -> new ResourceNotFoundException("PgHouse", request.getPgId()));
        Notice notice = Notice.builder()
            .pgHouse(pg).title(request.getTitle()).body(request.getBody())
            .isPinned(request.getIsPinned() != null && request.getIsPinned()).build();
        return mapNotice(noticeRepository.save(notice));
    }

    @Override @Transactional(readOnly = true)
    public List<NoticeResponse> getNotices(String pgId) {
        return noticeRepository.findByPgHouseIdOrderByIsPinnedDescCreatedAtDesc(pgId)
            .stream().map(this::mapNotice).toList();
    }

    @Override @Transactional
    public NoticeResponse updateNotice(String id, CreateNoticeRequest request) {
        Notice notice = noticeRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Notice", id));
        if (request.getTitle() != null) notice.setTitle(request.getTitle());
        if (request.getBody() != null) notice.setBody(request.getBody());
        if (request.getIsPinned() != null) notice.setIsPinned(request.getIsPinned());
        return mapNotice(noticeRepository.save(notice));
    }

    @Override @Transactional
    public void deleteNotice(String id) {
        if (!noticeRepository.existsById(id)) throw new ResourceNotFoundException("Notice", id);
        noticeRepository.deleteById(id);
    }

    // ─── Lost & Found ─────────────────────────────────────────────────────────

    @Override @Transactional
    public LostFoundResponse createLostFound(CreateLostFoundRequest request) {
        PgHouse pg = pgHouseRepository.findById(request.getPgId())
            .orElseThrow(() -> new ResourceNotFoundException("PgHouse", request.getPgId()));
        LostFound item = LostFound.builder()
            .pgHouse(pg).title(request.getTitle()).description(request.getDescription())
            .imageUrl(request.getImageUrl()).build();
        return mapLostFound(lostFoundRepository.save(item));
    }

    @Override @Transactional(readOnly = true)
    public List<LostFoundResponse> getLostFoundItems(String pgId) {
        return lostFoundRepository.findByPgHouseIdOrderByCreatedAtDesc(pgId)
            .stream().map(this::mapLostFound).toList();
    }

    @Override @Transactional
    public LostFoundResponse updateLostFound(String id, CreateLostFoundRequest request) {
        LostFound item = lostFoundRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("LostFound", id));
        // Used for claim: set status/claimedBy via request description field hack — or just expose dedicated fields
        if (request.getTitle() != null) item.setTitle(request.getTitle());
        if (request.getDescription() != null) item.setDescription(request.getDescription());
        return mapLostFound(lostFoundRepository.save(item));
    }

    // ─── Complaints ───────────────────────────────────────────────────────────

    @Override @Transactional
    public ComplaintResponse createComplaint(String tenantId, CreateComplaintRequest request) {
        Tenant tenant = tenantRepository.findById(tenantId)
            .orElseThrow(() -> new ResourceNotFoundException("Tenant", tenantId));
        Room room = roomRepository.findById(request.getRoomId())
            .orElseThrow(() -> new ResourceNotFoundException("Room", request.getRoomId()));
        Complaint complaint = Complaint.builder()
            .tenant(tenant).room(room).category(request.getCategory())
            .description(request.getDescription()).imageUrl(request.getImageUrl()).build();
        return mapComplaint(complaintRepository.save(complaint));
    }

    @Override @Transactional(readOnly = true)
    public List<ComplaintResponse> getComplaints(String pgId, ComplaintStatus status) {
        List<Complaint> complaints = status != null
            ? complaintRepository.findByPgIdAndStatus(pgId, status)
            : complaintRepository.findByPgId(pgId);
        return complaints.stream().map(this::mapComplaint).toList();
    }

    @Override @Transactional
    public ComplaintResponse updateComplaint(String id, UpdateComplaintRequest request) {
        Complaint complaint = complaintRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Complaint", id));
        complaint.setStatus(request.getStatus());
        if (request.getResolution() != null) complaint.setResolution(request.getResolution());
        return mapComplaint(complaintRepository.save(complaint));
    }

    // ─── Mappers ──────────────────────────────────────────────────────────────

    private NoticeResponse mapNotice(Notice n) {
        return NoticeResponse.builder()
            .id(n.getId()).title(n.getTitle()).body(n.getBody())
            .isPinned(n.getIsPinned()).createdAt(n.getCreatedAt()).build();
    }

    private LostFoundResponse mapLostFound(LostFound l) {
        return LostFoundResponse.builder()
            .id(l.getId()).title(l.getTitle()).description(l.getDescription())
            .imageUrl(l.getImageUrl()).status(l.getStatus()).foundDate(l.getFoundDate())
            .claimedBy(l.getClaimedBy()).createdAt(l.getCreatedAt()).build();
    }

    private ComplaintResponse mapComplaint(Complaint c) {
        return ComplaintResponse.builder()
            .id(c.getId()).tenantId(c.getTenant().getId()).tenantName(c.getTenant().getName())
            .roomId(c.getRoom().getId()).roomNumber(c.getRoom().getRoomNumber())
            .category(c.getCategory()).description(c.getDescription()).imageUrl(c.getImageUrl())
            .status(c.getStatus()).resolution(c.getResolution())
            .createdAt(c.getCreatedAt()).updatedAt(c.getUpdatedAt()).build();
    }
}
