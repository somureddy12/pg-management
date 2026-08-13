package com.pgmanagement.service.impl;

import com.pgmanagement.dto.request.CreateMealPostRequest;
import com.pgmanagement.dto.request.MealSelectionRequest;
import com.pgmanagement.dto.response.MealPostResponse;
import com.pgmanagement.entity.*;
import com.pgmanagement.exception.BusinessException;
import com.pgmanagement.exception.ResourceNotFoundException;
import com.pgmanagement.repository.*;
import com.pgmanagement.service.MealPostService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class MealPostServiceImpl implements MealPostService {

    private final MealPostRepository mealPostRepository;
    private final MealSelectionRepository mealSelectionRepository;
    private final TenantMealDefaultRepository tenantMealDefaultRepository;
    private final PgHouseRepository pgHouseRepository;
    private final TenantRepository tenantRepository;

    @Override
    @Transactional
    public MealPostResponse createMealPost(CreateMealPostRequest request) {
        PgHouse pg = pgHouseRepository.findById(request.getPgId())
            .orElseThrow(() -> new ResourceNotFoundException("PgHouse", request.getPgId()));
        MealPost post = MealPost.builder()
            .pgHouse(pg).date(request.getDate()).mealType(request.getMealType())
            .windowOpen(LocalDateTime.now()).windowClose(request.getWindowClose())
            .build();
        List<MealPostItem> items = request.getItems().stream().map(i ->
            MealPostItem.builder().mealPost(post).itemName(i.getItemName()).isVeg(i.getIsVeg()).isDefault(Boolean.TRUE.equals(i.getIsDefault())).build()
        ).toList();
        post.setItems(items);
        return toOwnerResponse(mealPostRepository.save(post), Collections.emptyMap(), Collections.emptyMap());
    }

    @Override
    @Transactional(readOnly = true)
    public List<MealPostResponse> getMealPostsByDate(String pgId, LocalDate date) {
        List<MealPost> posts = mealPostRepository.findByPgHouseIdAndDateOrderByWindowOpenAsc(pgId, date);
        return posts.stream().map(post -> {
            Map<String, Long> counts = mealSelectionRepository.countByItemForPost(post.getId()).stream()
                .collect(Collectors.toMap(row -> (String) row[0], row -> (Long) row[1]));
            Map<String, Long> defCounts = tenantMealDefaultRepository.countDefaultByItemForPost(post.getId()).stream()
                .collect(Collectors.toMap(row -> (String) row[0], row -> (Long) row[1]));
            return toOwnerResponse(post, counts, defCounts);
        }).toList();
    }

    @Override
    @Transactional
    public MealPostResponse updateMealPost(String id, CreateMealPostRequest request) {
        MealPost post = mealPostRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("MealPost", id));
        // Clear selections first so item FK constraints don't block deletion
        mealSelectionRepository.deleteAll(mealSelectionRepository.findByMealPostId(id));
        post.setDate(request.getDate());
        post.setMealType(request.getMealType());
        post.setWindowClose(request.getWindowClose());
        post.getItems().clear();
        List<MealPostItem> newItems = request.getItems().stream().map(i ->
            MealPostItem.builder().mealPost(post).itemName(i.getItemName()).isVeg(i.getIsVeg()).isDefault(Boolean.TRUE.equals(i.getIsDefault())).build()
        ).toList();
        post.getItems().addAll(newItems);
        return toOwnerResponse(mealPostRepository.save(post), Collections.emptyMap(), Collections.emptyMap());
    }

    @Override
    @Transactional
    public void deleteMealPost(String id) {
        if (!mealPostRepository.existsById(id)) throw new ResourceNotFoundException("MealPost", id);
        tenantMealDefaultRepository.deleteAll(tenantMealDefaultRepository.findByMealPostId(id));
        mealSelectionRepository.deleteAll(mealSelectionRepository.findByMealPostId(id));
        mealPostRepository.deleteById(id);
    }

    @Override
    @Transactional
    public List<MealPostResponse> getTenantMealPosts(String tenantId, LocalDate date) {
        Tenant tenant = tenantRepository.findById(tenantId)
            .orElseThrow(() -> new ResourceNotFoundException("Tenant", tenantId));
        String pgId = tenant.getBed().getRoom().getFloor().getPgHouse().getId();
        List<MealPost> posts = mealPostRepository.findByPgHouseIdAndDateOrderByWindowOpenAsc(pgId, date);
        LocalDateTime now = LocalDateTime.now();
        return posts.stream().map(post -> {
            Optional<MealSelection> sel = mealSelectionRepository.findByTenantIdAndMealPostId(tenantId, post.getId());
            // Auto-submit from default when window expired and no manual submission
            if (now.isAfter(post.getWindowClose()) && sel.isEmpty()) {
                Optional<TenantMealDefault> def = tenantMealDefaultRepository.findByTenantIdAndMealPostId(tenantId, post.getId());
                List<MealPostItem> itemsToSubmit = null;
                if (def.isPresent() && !def.get().getDefaultItems().isEmpty()) {
                    // Tenant-set default takes priority
                    itemsToSubmit = new ArrayList<>(def.get().getDefaultItems());
                } else {
                    // Fall back to owner-marked default item
                    List<MealPostItem> ownerDefaults = post.getItems().stream()
                        .filter(i -> Boolean.TRUE.equals(i.getIsDefault()))
                        .collect(Collectors.toList());
                    if (!ownerDefaults.isEmpty()) itemsToSubmit = ownerDefaults;
                }
                if (itemsToSubmit != null) {
                    try {
                        MealSelection autoSel = MealSelection.builder().tenant(tenant).mealPost(post).build();
                        autoSel.setSelectedItems(itemsToSubmit);
                        sel = Optional.of(mealSelectionRepository.save(autoSel));
                    } catch (Exception ignored) {
                        sel = mealSelectionRepository.findByTenantIdAndMealPostId(tenantId, post.getId());
                    }
                }
            }
            Set<String> myItemIds = sel.map(s -> s.getSelectedItems().stream()
                .map(MealPostItem::getId).collect(Collectors.toSet())).orElse(Collections.emptySet());
            Set<String> defItemIds = tenantMealDefaultRepository.findByTenantIdAndMealPostId(tenantId, post.getId())
                .map(d -> d.getDefaultItems().stream().map(MealPostItem::getId).collect(Collectors.toSet()))
                .orElse(Collections.emptySet());
            return toTenantResponse(post, myItemIds, sel.isPresent(), defItemIds);
        }).toList();
    }

    @Override
    @Transactional
    public void saveDefault(String tenantId, MealSelectionRequest request) {
        MealPost post = mealPostRepository.findById(request.getMealPostId())
            .orElseThrow(() -> new ResourceNotFoundException("MealPost", request.getMealPostId()));
        Tenant tenant = tenantRepository.findById(tenantId)
            .orElseThrow(() -> new ResourceNotFoundException("Tenant", tenantId));
        List<MealPostItem> selected = request.getItemIds() == null ? List.of() :
            post.getItems().stream()
                .filter(i -> request.getItemIds().contains(i.getId()))
                .collect(Collectors.toList());
        TenantMealDefault def = tenantMealDefaultRepository.findByTenantIdAndMealPostId(tenantId, post.getId())
            .orElse(TenantMealDefault.builder().tenant(tenant).mealPost(post).build());
        def.setDefaultItems(selected);
        tenantMealDefaultRepository.save(def);
    }

    @Override
    @Transactional
    public void submitSelection(String tenantId, MealSelectionRequest request) {
        MealPost post = mealPostRepository.findById(request.getMealPostId())
            .orElseThrow(() -> new ResourceNotFoundException("MealPost", request.getMealPostId()));
        LocalDateTime now = LocalDateTime.now();
        if (now.isBefore(post.getWindowOpen()) || now.isAfter(post.getWindowClose())) {
            throw new BusinessException("Selection window is closed");
        }
        Tenant tenant = tenantRepository.findById(tenantId)
            .orElseThrow(() -> new ResourceNotFoundException("Tenant", tenantId));
        List<MealPostItem> selected = request.getItemIds() == null ? List.of() :
            post.getItems().stream()
                .filter(i -> request.getItemIds().contains(i.getId()))
                .toList();

        if (mealSelectionRepository.findByTenantIdAndMealPostId(tenantId, post.getId()).isPresent()) {
            throw new BusinessException("You have already submitted your meal selection");
        }
        MealSelection selection = MealSelection.builder().tenant(tenant).mealPost(post).build();
        selection.setSelectedItems(selected);
        mealSelectionRepository.save(selection);
    }

    private MealPostResponse toOwnerResponse(MealPost post, Map<String, Long> counts, Map<String, Long> defCounts) {
        LocalDateTime now = LocalDateTime.now();
        List<MealPostResponse.ItemResponse> items = post.getItems().stream().map(i ->
            MealPostResponse.ItemResponse.builder()
                .id(i.getId()).itemName(i.getItemName()).isVeg(i.getIsVeg())
                .isDefault(Boolean.TRUE.equals(i.getIsDefault()))
                .selectionCount(counts.getOrDefault(i.getId(), 0L).intValue())
                .defaultCount(defCounts.getOrDefault(i.getId(), 0L).intValue())
                .build()
        ).toList();
        return MealPostResponse.builder()
            .id(post.getId()).pgHouseId(post.getPgHouse().getId())
            .date(post.getDate()).mealType(post.getMealType())
            .windowOpen(post.getWindowOpen()).windowClose(post.getWindowClose())
            .isOpen(!now.isBefore(post.getWindowOpen()) && !now.isAfter(post.getWindowClose()))
            .items(items).build();
    }

    private MealPostResponse toTenantResponse(MealPost post, Set<String> myItemIds, boolean hasSubmitted, Set<String> defItemIds) {
        LocalDateTime now = LocalDateTime.now();
        List<MealPostResponse.ItemResponse> items = post.getItems().stream().map(i ->
            MealPostResponse.ItemResponse.builder()
                .id(i.getId()).itemName(i.getItemName()).isVeg(i.getIsVeg())
                .selectedByMe(myItemIds.contains(i.getId()))
                // Tenant-set default takes priority; fall back to owner-set default
                .isDefault(defItemIds.isEmpty()
                    ? Boolean.TRUE.equals(i.getIsDefault())
                    : defItemIds.contains(i.getId()))
                .build()
        ).toList();
        return MealPostResponse.builder()
            .id(post.getId()).pgHouseId(post.getPgHouse().getId())
            .date(post.getDate()).mealType(post.getMealType())
            .windowOpen(post.getWindowOpen()).windowClose(post.getWindowClose())
            .isOpen(!now.isBefore(post.getWindowOpen()) && !now.isAfter(post.getWindowClose()))
            .hasSubmitted(hasSubmitted)
            .items(items).build();
    }
}