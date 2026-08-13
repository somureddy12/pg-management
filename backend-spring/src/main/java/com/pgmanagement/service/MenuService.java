package com.pgmanagement.service;

import com.pgmanagement.dto.request.CreateWeeklyMenuRequest;
import com.pgmanagement.dto.response.WeeklyMenuResponse;

import java.util.List;

public interface MenuService {
    WeeklyMenuResponse createWeeklyMenu(CreateWeeklyMenuRequest request);
    WeeklyMenuResponse getCurrentMenu(String pgId);
    List<WeeklyMenuResponse.MenuItemResponse> getTodayMenu(String pgId);
}
