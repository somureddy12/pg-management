package com.pgmanagement.service;

import com.pgmanagement.dto.request.*;
import com.pgmanagement.dto.response.*;
import com.pgmanagement.enums.ComplaintStatus;

import java.util.List;

public interface CommunicationService {
    // Notices
    NoticeResponse createNotice(CreateNoticeRequest request);
    List<NoticeResponse> getNotices(String pgId);
    NoticeResponse updateNotice(String id, CreateNoticeRequest request);
    void deleteNotice(String id);

    // Lost & Found
    LostFoundResponse createLostFound(CreateLostFoundRequest request);
    List<LostFoundResponse> getLostFoundItems(String pgId);
    LostFoundResponse updateLostFound(String id, CreateLostFoundRequest request);

    // Complaints
    ComplaintResponse createComplaint(String tenantId, CreateComplaintRequest request);
    List<ComplaintResponse> getComplaints(String pgId, ComplaintStatus status);
    ComplaintResponse updateComplaint(String id, UpdateComplaintRequest request);
}
