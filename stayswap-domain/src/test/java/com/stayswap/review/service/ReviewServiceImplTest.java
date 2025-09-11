package com.stayswap.review.service;

import com.stayswap.IntegrationTest;
import com.stayswap.error.exception.BusinessException;
import com.stayswap.error.exception.ForbiddenException;
import com.stayswap.error.exception.NotFoundException;
import com.stayswap.house.model.entity.House;
import com.stayswap.house.model.entity.HouseImage;
import com.stayswap.house.repository.HouseImageRepository;
import com.stayswap.house.repository.HouseRepository;
import com.stayswap.jwt.constant.Role;
import com.stayswap.review.model.dto.request.ReviewRequest;
import com.stayswap.review.model.dto.response.HouseReviewResponse;
import com.stayswap.review.model.dto.response.ReceivedReviewResponse;
import com.stayswap.review.model.dto.response.ReviewResponse;
import com.stayswap.review.model.dto.response.WrittenReviewResponse;
import com.stayswap.review.model.entity.Review;
import com.stayswap.review.repository.ReviewRepository;
import com.stayswap.swap.constant.SwapStatus;
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
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Slice;

import java.time.LocalDate;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class ReviewServiceImplTest extends IntegrationTest {

    @Autowired
    private ReviewService reviewService;

    @Autowired
    private ReviewRepository reviewRepository;

    @Autowired
    private SwapRepository swapRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private HouseRepository houseRepository;
    
    @Autowired
    private HouseImageRepository houseImageRepository;

    @BeforeEach
    void setUp() {
        reviewRepository.deleteAll();
        swapRepository.deleteAll();
        houseImageRepository.deleteAll();
        houseRepository.deleteAll();
        userRepository.deleteAll();
    }

    @Nested
    @DisplayName("리뷰 생성")
    class CreateReview {

        @Test
        @DisplayName("요청자가 숙소에 대한 리뷰를 정상적으로 작성한다")
        void createReviewRequesterReviewsHouseSuccess() {
            // given
            User requester = createUser("requester@test.com", "요청자", "요청자닉네임");
            User houseOwner = createUser("owner@test.com", "집주인", "집주인닉네임");
            
            House house = createHouse("테스트 숙소", houseOwner);
            Swap completedSwap = createCompletedSwap(requester, house);
            
            ReviewRequest request = new ReviewRequest(completedSwap.getId(), 5, "정말 좋았습니다!");

            // when
            ReviewResponse response = reviewService.createReview(requester.getId(), request);

            // then
            assertThat(response).isNotNull();
            assertThat(response.getSwapId()).isEqualTo(completedSwap.getId());
            assertThat(response.getUserId()).isEqualTo(requester.getId());
            assertThat(response.getTargetHouseId()).isEqualTo(house.getId());
            assertThat(response.getRating()).isEqualTo(5);
            assertThat(response.getComment()).isEqualTo("정말 좋았습니다!");
        }

        @Test
        @DisplayName("존재하지 않는 사용자가 리뷰를 작성하려고 한다")
        void createReviewUserNotExistsThrowsNotFoundException() {
            // given
            Long nonExistentUserId = 999L;
            ReviewRequest request = new ReviewRequest(1L, 5, "좋았습니다");

            // when & then
            assertThatThrownBy(() -> reviewService.createReview(nonExistentUserId, request))
                    .isInstanceOf(NotFoundException.class);
        }

        @Test
        @DisplayName("존재하지 않는 스왑에 대해 리뷰를 작성하려고 한다")
        void createReviewSwapNotExistsThrowsNotFoundException() {
            // given
            User user = createUser("user@test.com", "사용자", "사용자닉네임");
            Long nonExistentSwapId = 999L;
            ReviewRequest request = new ReviewRequest(nonExistentSwapId, 5, "좋았습니다");

            // when & then
            assertThatThrownBy(() -> reviewService.createReview(user.getId(), request))
                    .isInstanceOf(NotFoundException.class);
        }

        @Test
        @DisplayName("완료되지 않은 스왑에 대해 리뷰를 작성하려고 한다")
        void createReviewSwapNotCompletedThrowsBusinessException() {
            // given
            User requester = createUser("requester@test.com", "요청자", "요청자닉네임");
            User houseOwner = createUser("owner@test.com", "집주인", "집주인닉네임");
            
            House house = createHouse("테스트 숙소", houseOwner);
            Swap pendingSwap = createSwap(requester, house, SwapStatus.ACCEPTED);
            
            ReviewRequest request = new ReviewRequest(pendingSwap.getId(), 5, "좋았습니다");

            // when & then
            assertThatThrownBy(() -> reviewService.createReview(requester.getId(), request))
                    .isInstanceOf(BusinessException.class);
        }

        @Test
        @DisplayName("스왑과 관련없는 사용자가 리뷰를 작성하려고 한다")
        void createReviewUnauthorizedUserThrowsForbiddenException() {
            // given
            User requester = createUser("requester@test.com", "요청자", "요청자닉네임");
            User houseOwner = createUser("owner@test.com", "집주인", "집주인닉네임");
            User unauthorizedUser = createUser("unauthorized@test.com", "무관한사용자", "무관한사용자닉네임");
            
            House house = createHouse("테스트 숙소", houseOwner);
            Swap completedSwap = createCompletedSwap(requester, house);
            
            ReviewRequest request = new ReviewRequest(completedSwap.getId(), 5, "좋았습니다");

            // when & then
            assertThatThrownBy(() -> reviewService.createReview(unauthorizedUser.getId(), request))
                    .isInstanceOf(ForbiddenException.class);
        }

        @Test
        @DisplayName("이미 리뷰를 작성한 스왑에 대해 중복 리뷰를 작성하려고 한다")
        void createReviewDuplicateReviewThrowsBusinessException() {
            // given
            User requester = createUser("requester@test.com", "요청자", "요청자닉네임");
            User houseOwner = createUser("owner@test.com", "집주인", "집주인닉네임");
            
            House house = createHouse("테스트 숙소", houseOwner);
            Swap completedSwap = createCompletedSwap(requester, house);
            
            ReviewRequest firstRequest = new ReviewRequest(completedSwap.getId(), 5, "첫 번째 리뷰");
            ReviewRequest secondRequest = new ReviewRequest(completedSwap.getId(), 4, "두 번째 리뷰");

            reviewService.createReview(requester.getId(), firstRequest);

            // when & then
            assertThatThrownBy(() -> reviewService.createReview(requester.getId(), secondRequest))
                    .isInstanceOf(BusinessException.class);
        }
    }

    @Nested
    @DisplayName("리뷰 조회")
    class GetReview {

        @Test
        @DisplayName("내가(숙소 주인) 받은 리뷰 조회에 성공한다")
        void getReceivedReviewsSuccess() {
            // given
            User requester = createUser("requester@test.com", "요청자", "요청자닉네임");
            User houseOwner = createUser("owner@test.com", "집주인", "집주인닉네임");

            House house = createHouse("테스트 숙소", houseOwner);
            Swap completedSwap = createCompletedSwap(requester, house);

            ReviewRequest request = new ReviewRequest(completedSwap.getId(), 5, "정말 좋았습니다!");
            reviewService.createReview(requester.getId(), request);

            // when
            Slice<ReceivedReviewResponse> result =
                    reviewService.getReceivedReviews(houseOwner.getId(), Pageable.ofSize(10));

            // then
            assertThat(result.getContent()).hasSize(1);
            assertThat(result.getContent().get(0).getComment()).isEqualTo("정말 좋았습니다!");
            assertThat(result.getContent().get(0).getRating()).isEqualTo(5);
        }
        
        @Test
        @DisplayName("내가 작성한 리뷰 조회에 성공한다")
        void getWrittenReviewsSuccess() {
            // given
            User requester = createUser("requester@test.com", "요청자", "요청자닉네임");
            User houseOwner = createUser("owner@test.com", "집주인", "집주인닉네임");

            House house = createHouse("테스트 숙소", houseOwner);
            Swap completedSwap = createCompletedSwap(requester, house);

            ReviewRequest request = new ReviewRequest(completedSwap.getId(), 5, "정말 좋았습니다!");
            reviewService.createReview(requester.getId(), request);

            // when
            Slice<WrittenReviewResponse> result =
                    reviewService.getWrittenReviews(requester.getId(), Pageable.ofSize(10));

            // then
            assertThat(result.getContent()).hasSize(1);
            assertThat(result.getContent().get(0).getComment()).isEqualTo("정말 좋았습니다!");
            assertThat(result.getContent().get(0).getRating()).isEqualTo(5);
        }

        @Test
        @DisplayName("특정 숙소(숙소 상세에서)의 리뷰조회 테스트에 성공한다.")
        void getHouseReviewsSuccess() {
            //given
            User requester = createUser("requester@test.com", "요청자", "요청자닉네임");
            User houseOwner = createUser("owner@test.com", "집주인", "집주인닉네임");

            House house = createHouse("테스트 숙소", houseOwner);
            Swap completedSwap = createCompletedSwap(requester, house);

            ReviewRequest request = new ReviewRequest(completedSwap.getId(), 5, "정말 좋았습니다!");
            reviewService.createReview(requester.getId(), request);

            //when
            Slice<HouseReviewResponse> result =
                    reviewService.getHouseReviews(house.getId(), Pageable.ofSize(10));

            //then
            assertThat(result.getContent()).hasSize(1);
            assertThat(result.getContent().get(0).getComment()).isEqualTo("정말 좋았습니다!");
            assertThat(result.getContent().get(0).getRating()).isEqualTo(5);
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

    private House createHouse(String title, User owner) {
        House house = House.builder()
                .title(title)
                .user(owner)
                .isActive(true)
                .isDelete(false)
                .build();
        House savedHouse = houseRepository.save(house);
        
        HouseImage houseImage = HouseImage.builder()
                .house(savedHouse)
                .imageUrl("https://test-image.jpg")
                .build();
        houseImageRepository.save(houseImage);
        
        return savedHouse;
    }

    private Swap createSwap(User requester, House house, SwapStatus status) {
        Swap swap = Swap.builder()
                .requester(requester)
                .house(house)
                .startDate(LocalDate.now())
                .endDate(LocalDate.now().plusDays(1))
                .swapStatus(status)
                .build();
        return swapRepository.save(swap);
    }

    private Swap createCompletedSwap(User requester, House house) {
        return createSwap(requester, house, SwapStatus.COMPLETED);
    }
}