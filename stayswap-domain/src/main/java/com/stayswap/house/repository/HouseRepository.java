package com.stayswap.house.repository;

import com.stayswap.house.model.entity.House;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface HouseRepository extends JpaRepository<House, Long>, HouseRepositoryCustom {
    
    List<House> findTop10ByIsActiveTrueAndIsDeleteFalseOrderByRegTimeDesc();
    
    @Query(value = "select h.* from house h " +
            "join (select r.target_house_id, avg(r.rating) as avg_rating, count(r.review_id) as review_count " +
            "      from review r " +
            "      group by r.target_house_id " +
            "      having avg(r.rating) >= :minRating) as ratings " +
            "on h.house_id = ratings.target_house_id " +
            "where h.is_active = true and h.is_delete = false " +
            "order by ratings.review_count desc, ratings.avg_rating desc " +
            "limit 10", nativeQuery = true)
    List<House> findPopularHousesByRatingAndReviewCount(@Param("minRating") Double minRating);
    
    @Query(value = "select coalesce(avg(r.rating), 0.0) from review r where r.target_house_id = :houseId", nativeQuery = true)
    Double getAverageRatingByHouseId(@Param("houseId") Long houseId);
    
    @Query(value = "select count(r.review_id) from review r where r.target_house_id = :houseId", nativeQuery = true)
    Long getReviewCountByHouseId(@Param("houseId") Long houseId);
    
    @Query(value = "select count(hl.house_like_id) from house_like hl where hl.house_id = :houseId", nativeQuery = true)
    Long getLikeCountByHouseId(@Param("houseId") Long houseId);
    
    @Query(value = "select h.* from house h " +
            "join house_like hl on h.house_id = hl.house_id " +
            "where hl.user_id = :userId " +
            "and h.is_active = true and h.is_delete = false", nativeQuery = true)
    List<House> findLikedHousesByUserId(@Param("userId") Long userId);
}
