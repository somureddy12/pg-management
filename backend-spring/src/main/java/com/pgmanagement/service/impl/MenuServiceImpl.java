package com.pgmanagement.service.impl;

import com.pgmanagement.dto.request.CreateWeeklyMenuRequest;
import com.pgmanagement.dto.response.WeeklyMenuResponse;
import com.pgmanagement.entity.MenuItem;
import com.pgmanagement.entity.PgHouse;
import com.pgmanagement.entity.WeeklyMenu;
import com.pgmanagement.exception.ResourceNotFoundException;
import com.pgmanagement.repository.PgHouseRepository;
import com.pgmanagement.repository.WeeklyMenuRepository;
import com.pgmanagement.service.MenuService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.temporal.TemporalAdjusters;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class MenuServiceImpl implements MenuService {

    private final WeeklyMenuRepository weeklyMenuRepository;
    private final PgHouseRepository pgHouseRepository;

    private static final Map<DayOfWeek, String> DAY_MAP = Map.of(
        DayOfWeek.MONDAY, "MON", DayOfWeek.TUESDAY, "TUE",
        DayOfWeek.WEDNESDAY, "WED", DayOfWeek.THURSDAY, "THU",
        DayOfWeek.FRIDAY, "FRI", DayOfWeek.SATURDAY, "SAT", DayOfWeek.SUNDAY, "SUN"
    );

    @Override
    @Transactional
    public WeeklyMenuResponse createWeeklyMenu(CreateWeeklyMenuRequest request) {
        PgHouse pg = pgHouseRepository.findById(request.getPgId())
            .orElseThrow(() -> new ResourceNotFoundException("PgHouse", request.getPgId()));
        List<MenuItem> items = request.getMenuItems().stream().map(i -> MenuItem.builder()
            .day(i.getDay()).mealType(i.getMealType()).items(i.getItems())
            .isVeg(i.getIsVeg() != null ? i.getIsVeg() : true).timing(i.getTiming())
            .build()).toList();
        WeeklyMenu menu = WeeklyMenu.builder()
            .pgHouse(pg).weekStartDate(request.getWeekStartDate())
            .build();
        // set menu on items
        final WeeklyMenu savedMenu = menu;
        items.forEach(it -> it.setWeeklyMenu(savedMenu));
        menu.setMenuItems(new java.util.ArrayList<>(items));
        return mapToResponse(weeklyMenuRepository.save(menu));
    }

    @Override
    @Transactional(readOnly = true)
    public WeeklyMenuResponse getCurrentMenu(String pgId) {
        LocalDate weekStart = LocalDate.now().with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));
        return weeklyMenuRepository
            .findFirstByPgHouseIdAndWeekStartDateGreaterThanEqualOrderByWeekStartDateDesc(pgId, weekStart)
            .map(this::mapToResponse).orElse(null);
    }

    @Override
    @Transactional(readOnly = true)
    public List<WeeklyMenuResponse.MenuItemResponse> getTodayMenu(String pgId) {
        String today = DAY_MAP.get(LocalDate.now().getDayOfWeek());
        LocalDate weekStart = LocalDate.now().with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));
        return weeklyMenuRepository
            .findFirstByPgHouseIdAndWeekStartDateGreaterThanEqualOrderByWeekStartDateDesc(pgId, weekStart)
            .map(menu -> menu.getMenuItems().stream()
                .filter(i -> today.equals(i.getDay()))
                .map(this::mapItemToResponse).toList())
            .orElse(List.of());
    }

    private WeeklyMenuResponse mapToResponse(WeeklyMenu m) {
        return WeeklyMenuResponse.builder()
            .id(m.getId()).weekStartDate(m.getWeekStartDate())
            .menuItems(m.getMenuItems().stream().map(this::mapItemToResponse).toList())
            .build();
    }

    private WeeklyMenuResponse.MenuItemResponse mapItemToResponse(MenuItem i) {
        return WeeklyMenuResponse.MenuItemResponse.builder()
            .id(i.getId()).day(i.getDay()).mealType(i.getMealType())
            .items(i.getItems()).isVeg(i.getIsVeg()).timing(i.getTiming()).build();
    }
}
