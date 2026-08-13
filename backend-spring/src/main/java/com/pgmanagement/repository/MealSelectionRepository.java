package com.pgmanagement.repository;

import com.pgmanagement.entity.MealSelection;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface MealSelectionRepository extends JpaRepository<MealSelection, String> {
    Optional<MealSelection> findByTenantIdAndMealPostId(String tenantId, String mealPostId);

    @Query("SELECT si.id, COUNT(s) FROM MealSelection s JOIN s.selectedItems si WHERE s.mealPost.id = :postId GROUP BY si.id")
    List<Object[]> countByItemForPost(@Param("postId") String postId);

    List<MealSelection> findByMealPostId(String mealPostId);
}