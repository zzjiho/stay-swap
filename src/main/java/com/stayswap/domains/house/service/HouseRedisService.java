package com.stayswap.domains.house.service;

import com.stayswap.domains.house.model.dto.response.PopularHouseResponse;
import com.stayswap.domains.house.model.dto.response.RecentHouseResponse;
import com.stayswap.domains.house.model.entity.House;
import com.stayswap.domains.house.repository.HouseRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.concurrent.TimeUnit;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class HouseRedisService {

    private final RedisTemplate<String, Object> redisTemplate;
    private final HouseRepository houseRepository;
    private final HouseImgService houseImgService;
    
    private static final String RECENT_HOUSES_KEY = "recent:houses";
    private static final String POPULAR_HOUSES_KEY = "popular:houses";
    private static final long CACHE_TTL_MINUTES = 10;

    // 최신 숙소 조회
    public List<RecentHouseResponse> getRecentHouses(int limit) {
        // Redis에서 최근 등록된 숙소 목록 조회 시도
        List<RecentHouseResponse> cachedHouses = (List<RecentHouseResponse>) redisTemplate.opsForValue().get(RECENT_HOUSES_KEY);
        
        // 캐시에 데이터가 없으면 DB에서 조회 (Cache Miss)
        if (cachedHouses == null || cachedHouses.isEmpty()) {

            // DB에서 최근 등록된 숙소 조회
            List<House> recentHouses = houseRepository.findTop10ByIsActiveTrueOrderByRegTimeDesc();
            
            cachedHouses = recentHouses.stream()
                    .map(house -> {
                        String thumbnailUrl = null;
                        List<String> imageUrls = houseImgService.getHouseImageUrls(house.getId());
                        if (!imageUrls.isEmpty()) {
                            thumbnailUrl = imageUrls.get(0); // 첫 번째 이미지를 썸네일로 사용
                        }
                        return RecentHouseResponse.of(house, thumbnailUrl);
                    })
                    .limit(limit)
                    .collect(Collectors.toList());
            
            // Redis에 캐싱
            redisTemplate.opsForValue().set(RECENT_HOUSES_KEY, cachedHouses, CACHE_TTL_MINUTES, TimeUnit.MINUTES);

            return cachedHouses;
        }
        
        // 캐시에 데이터가 있으면 바로 반환 (Cache Hit)
        return cachedHouses.stream()
                .limit(limit)
                .collect(Collectors.toList());
    }
    
    // 인기 숙소 조회
    public List<PopularHouseResponse> getPopularHouses(int limit) {

        // Redis에서 인기 숙소 목록 조회 시도
        List<PopularHouseResponse> cachedHouses = (List<PopularHouseResponse>) redisTemplate.opsForValue().get(POPULAR_HOUSES_KEY);
        
        // cache miss
        if (cachedHouses == null || cachedHouses.isEmpty()) {
            // 평점 4점 이상, 리뷰 수 많은 순으로 인기 숙소 조회
            List<House> popularHouses = houseRepository.findPopularHousesByRatingAndReviewCount(4.0);
            
            cachedHouses = popularHouses.stream()
                    .map(house -> {
                        String thumbnailUrl = null;
                        List<String> imageUrls = houseImgService.getHouseImageUrls(house.getId());
                        if (!imageUrls.isEmpty()) {
                            thumbnailUrl = imageUrls.get(0); // 첫 번째 이미지를 썸네일로 사용
                        }
                        
                        // 평점 및 리뷰 수 조회
                        Double rating = houseRepository.getAverageRatingByHouseId(house.getId());
                        Long reviewCount = houseRepository.getReviewCountByHouseId(house.getId());
                        
                        return PopularHouseResponse.of(house, thumbnailUrl, rating, reviewCount);
                    })
                    .limit(limit)
                    .collect(Collectors.toList());
            
            // Redis에 캐싱
            redisTemplate.opsForValue().set(POPULAR_HOUSES_KEY, cachedHouses, CACHE_TTL_MINUTES, TimeUnit.MINUTES);
            
            return cachedHouses;
        }
        
        // cache hit
        return cachedHouses.stream()
                .limit(limit)
                .collect(Collectors.toList());
    }

    // 새 숙소가 등록되거나 업데이트될 때 캐시 무효화
    public void invalidateRecentHousesCache() {
        redisTemplate.delete(RECENT_HOUSES_KEY);
    }
    
    // 숙소에 새 리뷰가 등록되거나 업데이트될 때 인기 숙소 캐시 무효화
    public void invalidatePopularHousesCache() {
        redisTemplate.delete(POPULAR_HOUSES_KEY);
    }
} 