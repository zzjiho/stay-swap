package com.stayswap.house.service;

import com.stayswap.IntegrationTest;
import com.stayswap.error.exception.NotFoundException;
import com.stayswap.house.model.entity.House;
import com.stayswap.house.repository.HouseLikeRepository;
import com.stayswap.house.repository.HouseRepository;
import com.stayswap.jwt.constant.Role;
import com.stayswap.user.constant.UserType;
import com.stayswap.user.model.entity.User;
import com.stayswap.user.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class HouseLikeServiceTest extends IntegrationTest {

    @Autowired
    private HouseLikeService houseLikeService;

    @Autowired
    private HouseLikeRepository houseLikeRepository;

    @Autowired
    private HouseRepository houseRepository;

    @Autowired
    private UserRepository userRepository;

    private User houseOwner;
    private User likingUser;
    private House house;

    @BeforeEach
    void setUp() {
        houseLikeRepository.deleteAll();
        houseRepository.deleteAll();
        userRepository.deleteAll();

        // given
        houseOwner = User.builder()
                .email("owner@test.com")
                .userName("집주인")
                .nickname("집주인닉네임")
                .role(Role.ROLE_USER)
                .userType(UserType.NORMAL)
                .build();

        likingUser = User.builder()
                .email("liker@test.com")
                .userName("좋아요맨")
                .nickname("좋아요누르는사람")
                .role(Role.ROLE_USER)
                .userType(UserType.NORMAL)
                .build();

        userRepository.saveAll(java.util.List.of(houseOwner, likingUser));

        house = House.builder()
                .user(houseOwner)
                .title("테스트 숙소")
                .addressKo("테스트 주소")
                .isDelete(false)
                .isActive(true)
                .build();

        houseRepository.save(house);
    }

    @Nested
    @DisplayName("숙소 좋아요 등록")
    class AddLike {

        @Test
        @DisplayName("사용자가 다른 사람의 숙소에 '좋아요'를 누른다")
        void addLikeSuccess() {
            // when
            boolean result = houseLikeService.addLike(house.getId(), likingUser.getId());

            // then
            assertThat(result).isTrue();
            boolean isLiked = houseLikeRepository.existsByUserAndHouse(likingUser, house);
            assertThat(isLiked).isTrue();
        }

        @Test
        @DisplayName("같은 사용자가 이미 '좋아요'를 누른 숙소에 다시 요청하면 false를 반환한다. " +
                "좋아요 개수가 1개에서 늘어나지 않는지 확인을 해서 테스트를 진행한다.")
        void addLikeToAlreadyLikedHouse() {
            // given
            houseLikeService.addLike(house.getId(), likingUser.getId());

            // when
            boolean result = houseLikeService.addLike(house.getId(), likingUser.getId());

            // then
            assertThat(result).isFalse();
            long likeCount = houseLikeRepository.count();
            assertThat(likeCount).isEqualTo(1);
        }

        @Test
        @DisplayName("존재하지 않는 숙소에 '좋아요'를 누르면 NotFoundException이 발생한다")
        void addLikeToNonExistentHouse() {
            // given
            Long nonExistentHouseId = 9999L;

            // when & then
            assertThatThrownBy(() -> houseLikeService.addLike(nonExistentHouseId, likingUser.getId()))
                    .isInstanceOf(NotFoundException.class)
                    .hasMessageContaining("존재하지 않는 숙소입니다");
        }

        @Test
        @DisplayName("존재하지 않는 사용자가 '좋아요'를 누르면 NotFoundException이 발생한다")
        void addLikeByNonExistentUser() {
            // given
            Long nonExistentUserId = 9999L;

            // when & then
            assertThatThrownBy(() -> houseLikeService.addLike(house.getId(), nonExistentUserId))
                    .isInstanceOf(NotFoundException.class)
                    .hasMessageContaining("존재하지 않는 회원입니다");
        }

        @Test
        @DisplayName("사용자가 자신의 숙소에 '좋아요'를 누를 수 있다")
        void addLikeToOwnHouse() {
            // when
            boolean result = houseLikeService.addLike(house.getId(), houseOwner.getId());

            // then
            assertThat(result).isTrue();
            boolean isLiked = houseLikeRepository.existsByUserAndHouse(houseOwner, house);
            assertThat(isLiked).isTrue();
        }
    }

    @Nested
    @DisplayName("좋아요 취소")
    class CancelLike {

        @Test
        @DisplayName("좋아요 취소가 정상적으로 성공한다." +
                "좋아요 눌러져있는 숙소에 좋아요 취소시 정상 작동하며 houseLike 엔티티에 남지않는다.")
        void successCancelLike() {
            //given
            houseLikeService.addLike(house.getId(), likingUser.getId());

            //when
            boolean result = houseLikeService.cancelLike(house.getId(), likingUser.getId());

            //then
            assertThat(result).isTrue();
            assertThat(houseLikeRepository.existsByUserAndHouse(likingUser, house)).isFalse();
        }

        @Test
        @DisplayName("좋아요를 누르지 않은 숙소를 취소 요청시 false를 반환")
        void failCancelLikeForNonLikedHouse() {
            //given
            //when
            boolean result = houseLikeService.cancelLike(house.getId(), likingUser.getId());

            //then
            assertThat(result).isFalse();
        }
    }

    @Nested
    @DisplayName("숙소 좋아요 상태 조회")
    class LikeStatus {

        @Test
        @DisplayName("좋아요를 누르지 않은 숙소의 상태를 조회하면 false를 반환한다")
        void isLikedForNonLikedHouseReturnsFalse() {
            //given
            //when
            boolean result = houseLikeService.isLiked(house.getId(), likingUser.getId());

            //then
            assertThat(result).isFalse();
        }

        @Test
        @DisplayName("좋아요를 누른 숙소의 상태를 조회하면 true를 반환한다")
        void isLikedForLikedHouseReturnsTrue() {
            //given
            houseLikeService.addLike(house.getId(), likingUser.getId());

            //when
            boolean result = houseLikeService.isLiked(house.getId(), likingUser.getId());

            //then
            assertThat(result).isTrue();
        }

        @Test
        @DisplayName("존재하지 않는 숙소의 상태를 조회하면 NotFoundException 예외가 발생한다")
        void isLikedForNonExistentHouseThrowsNotFoundException() {
            // given
            Long nonExistentHouseId = 9999L;

            // when & then
            assertThatThrownBy(() -> houseLikeService.isLiked(nonExistentHouseId, likingUser.getId()))
                    .isInstanceOf(NotFoundException.class);
        }

        @Test
        @DisplayName("존재하지 않는 사용자로 상태를 조회하면 NotFoundException 예외가 발생한다")
        void isLikedForNonExistentUserThrowsNotFoundException() {
            // given
            Long nonExistentUserId = 9999L;

            // when & then
            assertThatThrownBy(() -> houseLikeService.isLiked(house.getId(), nonExistentUserId))
                    .isInstanceOf(NotFoundException.class);
        }
    }




}
