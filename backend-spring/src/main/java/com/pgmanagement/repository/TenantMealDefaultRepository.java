package com.pgmanagement.repository;

import com.pgmanagement.entity.TenantMealDefault;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface TenantMealDefaultRepository extends JpaRepository<TenantMealDefault, String> {
    Optional<TenantMealDefault> findByTenantIdAndMealPostId(String tenantId, String mealPostId);
    List<TenantMealDefault> findByMealPostId(String mealPostId);

    @Query("SELECT di.id, COUNT(d) FROM TenantMealDefault d JOIN d.defaultItems di WHERE d.mealPost.id = :postId GROUP BY di.id")
    List<Object[]> countDefaultByItemForPost(@Param("postId") String postId);
}