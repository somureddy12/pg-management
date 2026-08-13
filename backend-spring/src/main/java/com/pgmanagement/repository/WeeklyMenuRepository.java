package com.pgmanagement.repository;

import com.pgmanagement.entity.WeeklyMenu;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.Optional;

@Repository
public interface WeeklyMenuRepository extends JpaRepository<WeeklyMenu, String> {
    Optional<WeeklyMenu> findFirstByPgHouseIdAndWeekStartDateGreaterThanEqualOrderByWeekStartDateDesc(String pgId, LocalDate date);
}
