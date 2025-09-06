package com.stayswap.house.service;

import com.stayswap.IntegrationTest;
import com.stayswap.house.model.dto.response.PopularHouseResponse;
import com.stayswap.house.model.entity.House;
import com.stayswap.house.repository.HouseRepository;
import com.stayswap.jwt.constant.Role;
import com.stayswap.review.model.entity.Review;
import com.stayswap.review.repository.ReviewRepository;
import com.stayswap.swap.model.entity.Swap;
import com.stayswap.swap.repository.SwapRepository;
import com.stayswap.user.constant.UserType;
import com.stayswap.user.model.entity.User;
import com.stayswap.user.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.core.RedisTemplate;

import java.time.LocalDate;
import java.util.List;
import java.util.Objects;

import static org.assertj.core.api.Assertions.assertThat;

class HouseRedisServiceTest extends IntegrationTest {

    @Autowired
    private HouseRedisService houseRedisService;

    @Autowired
    private HouseRepository houseRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private SwapRepository swapRepository;

    @Autowired
    private ReviewRepository reviewRepository;

    @Autowired
    private RedisTemplate<String, Object> redisTemplate;

    private static final String POPULAR_HOUSES_KEY = "popular:houses";


    @BeforeEach
    void setUp() {
        // 연관된 모든 테이블 및 Redis 데이터 초기화
        reviewRepository.deleteAll();
        swapRepository.deleteAll();
        houseRepository.deleteAll();
        userRepository.deleteAll();
        Objects.requireNonNull(redisTemplate.getConnectionFactory()).getConnection().flushAll();
    }

    @Nested
    @DisplayName("인기 숙소 조회 시 (getPopularHouses)")
    class GetPopularHouses {

        @Test
        @DisplayName("Cache Miss: 캐시가 비어있으면, DB에서 데이터를 조회하고 Redis에 캐싱한다")
        void getPopularHousesCacheMiss() {
            // given
            User houseOwner = createUser("owner@test.com", "집주인", "집주인닉네임");
            User reviewer1 = createUser("reviewer1@test.com", "리뷰어1", "리뷰어1닉네임");
            User reviewer2 = createUser("reviewer2@test.com", "리뷰어2", "리뷰어2닉네임");

            House popularHouse = createPopularHouse("인기 숙소", houseOwner);
            createPopularHouse("비인기 숙소", houseOwner);

            // 인기 숙소에 대한 리뷰 2개 생성 (평점 5, 5 -> 평균 5.0)
            Swap swap1 = createSwap(reviewer1, popularHouse);
            reviewRepository.save(Review.builder().swap(swap1).user(reviewer1).targetHouse(popularHouse).rating(5).comment("최고에요").build());

            Swap swap2 = createSwap(reviewer2, popularHouse);
            reviewRepository.save(Review.builder().swap(swap2).user(reviewer2).targetHouse(popularHouse).rating(5).comment("또 오고 싶어요").build());

            Double actualRating = houseRepository.getAverageRatingByHouseId(popularHouse.getId());
            Long actualReviewCount = houseRepository.getReviewCountByHouseId(popularHouse.getId());
            assertThat(actualRating).isEqualTo(5.0);
            assertThat(actualReviewCount).isEqualTo(2L);

            // when
            List<PopularHouseResponse> popularHouses = houseRedisService.getPopularHouses(5);

            // then
            assertThat(popularHouses).hasSize(1);
            assertThat(popularHouses.get(0).getTitle()).isEqualTo("인기 숙소");
            assertThat(popularHouses.get(0).getRating()).isEqualTo(5.0);
            assertThat(popularHouses.get(0).getReviewCount()).isEqualTo(2);

            // Redis에 결과가 캐싱되었는지 확인
            Boolean hasKey = redisTemplate.hasKey(POPULAR_HOUSES_KEY);
            assertThat(hasKey).isTrue();
        }

        @Test
        @DisplayName("Cache Hit: 캐시에 데이터가 있으면, DB를 조회하지 않고 캐시 데이터를 반환한다")
        void getPopularHouses_CacheHit() {
            // given
            User houseOwner = createUser("owner@test.com", "집주인", "집주인닉네임");
            User reviewer1 = createUser("reviewer1@test.com", "리뷰어1", "리뷰어1닉네임");
            House house = createPopularHouse("실제 숙소", houseOwner);
            Swap swap = createSwap(reviewer1, house);
            reviewRepository.save(Review.builder().swap(swap).user(reviewer1).targetHouse(house).rating(5).comment("좋아요").build());

            List<PopularHouseResponse> firstResult = houseRedisService.getPopularHouses(5);
            
            // 캐시가 생성되었는지 확인
            assertThat(redisTemplate.hasKey(POPULAR_HOUSES_KEY)).isTrue();

            // when: 두번째 호출
            List<PopularHouseResponse> secondResult = houseRedisService.getPopularHouses(5);

            // then
            assertThat(secondResult).isNotNull();
            assertThat(secondResult).hasSize(1);
            // 캐시가 계속 유지되고 있는지 확인
            assertThat(redisTemplate.hasKey(POPULAR_HOUSES_KEY)).isTrue();
        }
    }

    @Nested
    @DisplayName("인기 숙소 캐시 무효화 시 (invalidatePopularHousesCache)")
    class InvalidatePopularHousesCache {

        @Test
        @DisplayName("Redis에 저장된 인기 숙소 캐시를 정상적으로 삭제한다")
        void invalidatePopularHousesCache_Success() {
            // given
            // 캐시를 미리 저장해 둠
            PopularHouseResponse cachedHouse = PopularHouseResponse.builder().houseId(999L).title("캐시된 인기 숙소").build();
            redisTemplate.opsForValue().set(POPULAR_HOUSES_KEY, List.of(cachedHouse));
            assertThat(redisTemplate.hasKey(POPULAR_HOUSES_KEY)).isTrue();

            // when
            houseRedisService.invalidatePopularHousesCache();

            // then
            // 캐시가 삭제되었는지 확인
            Boolean hasKey = redisTemplate.hasKey(POPULAR_HOUSES_KEY);
            assertThat(hasKey).isFalse();
        }
    }

    private User createUser(String email, String userName, String nickname) {
        User user = User.builder()
                .email(email)
                .userName(userName)
                .nickname(nickname)
                .role(Role.ROLE_USER)
                .userType(UserType.NORMAL)
                .build();
        return userRepository.save(user);
    }

    private Swap createSwap(User reviewer1, House popularHouse) {
        Swap swap = Swap.builder()
                .requester(reviewer1)
                .house(popularHouse)
                .startDate(LocalDate.now())
                .endDate(LocalDate.now().plusDays(1))
                .build();

        return swapRepository.save(swap);
    }

    private House createPopularHouse(String houseTitle, User houseOwner) {
        return houseRepository.save(
                House.builder()
                        .title(houseTitle)
                        .user(houseOwner)
                        .isActive(true)
                        .isDelete(false)
                        .build());
    }
}