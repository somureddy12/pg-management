package com.pgmanagement.repository;

import com.pgmanagement.entity.MealPost;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface MealPostRepository extends JpaRepository<MealPost, String> {
    List<MealPost> findByPgHouseIdAndDateOrderByWindowOpenAsc(String pgHouseId, LocalDate date);
    List<MealPost> findByPgHouseIdOrderByDateDescWindowOpenAsc(String pgHouseId);
}