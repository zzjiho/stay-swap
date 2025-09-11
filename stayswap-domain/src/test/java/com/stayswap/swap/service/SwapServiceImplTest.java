package com.stayswap.swap.service;

import com.stayswap.IntegrationTest;
import com.stayswap.error.exception.BusinessException;
import com.stayswap.error.exception.ForbiddenException;
import com.stayswap.error.exception.NotFoundException;
import com.stayswap.house.model.entity.House;
import com.stayswap.house.model.entity.HouseImage;
import com.stayswap.house.repository.HouseImageRepository;
import com.stayswap.house.repository.HouseRepository;
import com.stayswap.jwt.constant.Role;
import com.stayswap.swap.constant.SwapStatus;
import com.stayswap.swap.constant.SwapType;
import com.stayswap.swap.model.dto.request.SwapRequest;
import com.stayswap.swap.model.dto.response.SwapResponse;
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

import java.time.LocalDate;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class SwapServiceImplTest extends IntegrationTest {

    @Autowired
    private SwapService swapService;

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
        swapRepository.deleteAll();
        houseImageRepository.deleteAll();
        houseRepository.deleteAll();
        userRepository.deleteAll();
    }

    @Nested
    @DisplayName("스왑 요청 생성")
    class CreateSwapRequest {

        @Test
        @DisplayName("유효한 스왑 요청을 정상적으로 생성한다.")
        void createSwapRequest_ValidRequest_Success() {
            // given
            User requester = createUser("requester@test.com", "요청자", "요청자닉네임");
            User targetOwner = createUser("target@test.com", "대상집주인", "대상집주인닉네임");

            House requesterHouse = createHouse("요청자 숙소", requester);
            House targetHouse = createHouse("대상 숙소", targetOwner);

            SwapRequest swapRequest = new SwapRequest(
                    requesterHouse.getId(),
                    targetHouse.getId(),
                    LocalDate.now().plusDays(1),
                    LocalDate.now().plusDays(3),
                    "교환 요청 메시지입니다.",
                    2
            );

            // when
            SwapResponse response = swapService.createSwapRequest(requester.getId(), swapRequest);

            // then
            assertThat(response).isNotNull();
            assertThat(response.getRequesterId()).isEqualTo(requester.getId());
            assertThat(response.getRequesterHouseId()).isEqualTo(requesterHouse.getId());
            assertThat(response.getTargetHouseId()).isEqualTo(targetHouse.getId());
            assertThat(response.getStartDate()).isEqualTo(swapRequest.getStartDate());
            assertThat(response.getEndDate()).isEqualTo(swapRequest.getEndDate());
            assertThat(response.getSwapType()).isEqualTo(SwapType.SWAP);
            assertThat(response.getSwapStatus()).isEqualTo(SwapStatus.PENDING);
            assertThat(response.getMessage()).isEqualTo("교환 요청 메시지입니다.");
            assertThat(response.getGuest()).isEqualTo(2);

            Swap savedSwap = swapRepository.findById(response.getSwapId()).orElse(null);
            assertThat(savedSwap).isNotNull();
            assertThat(savedSwap.getSwapStatus()).isEqualTo(SwapStatus.PENDING);
        }

        @Test
        @DisplayName("존재하지 않는 요청자 ID로 스왑 요청을 생성시 예외 발생한다.")
        void createSwapRequest_NonExistentRequester_ThrowsNotFoundException() {
            // given
            Long nonExistentRequesterId = 999L;
            SwapRequest swapRequest = new SwapRequest(1L, 2L, LocalDate.now(), LocalDate.now().plusDays(1), null, 1);

            // when & then
            assertThatThrownBy(() -> swapService.createSwapRequest(nonExistentRequesterId, swapRequest))
                    .isInstanceOf(NotFoundException.class);
        }

        @Test
        @DisplayName("존재하지 않는 요청자 숙소 ID로 스왑 요청을 생성시 예외 발생한다.")
        void createSwapRequest_NonExistentRequesterHouse_ThrowsNotFoundException() {
            // given
            User requester = createUser("requester@test.com", "요청자", "요청자닉네임");
            User targetOwner = createUser("target@test.com", "대상집주인", "대상집주인닉네임");
            House targetHouse = createHouse("대상 숙소", targetOwner);

            SwapRequest swapRequest = new SwapRequest(
                    999L,
                    targetHouse.getId(),
                    LocalDate.now(),
                    LocalDate.now().plusDays(1),
                    null,
                    1
            );

            // when & then
            assertThatThrownBy(() -> swapService.createSwapRequest(requester.getId(), swapRequest))
                    .isInstanceOf(NotFoundException.class);
        }

        @Test
        @DisplayName("존재하지 않는 대상 숙소 ID로 스왑 요청을 생성시 예외 발생한다.")
        void createSwapRequest_NonExistentTargetHouse_ThrowsNotFoundException() {
            // given
            User requester = createUser("requester@test.com", "요청자", "요청자닉네임");
            House requesterHouse = createHouse("요청자 숙소", requester);

            SwapRequest swapRequest = new SwapRequest(
                    requesterHouse.getId(),
                    999L,
                    LocalDate.now(),
                    LocalDate.now().plusDays(1),
                    null,
                    1
            );

            // when & then
            assertThatThrownBy(() -> swapService.createSwapRequest(requester.getId(), swapRequest))
                    .isInstanceOf(NotFoundException.class);
        }

        @Test
        @DisplayName("요청자가 소유하지 않은 숙소로 스왑 요청을 생성시 예외 발생한다.")
        void createSwapRequest_NotOwnerOfRequesterHouse_ThrowsForbiddenException() {
            // given
            User requester = createUser("requester@test.com", "요청자", "요청자닉네임");
            User otherUser = createUser("other@test.com", "다른사용자", "다른사용자닉네임");
            User targetOwner = createUser("target@test.com", "대상집주인", "대상집주인닉네임");

            House otherUserHouse = createHouse("다른사용자 숙소", otherUser);
            House targetHouse = createHouse("대상 숙소", targetOwner);

            SwapRequest swapRequest = new SwapRequest(
                    otherUserHouse.getId(),
                    targetHouse.getId(),
                    LocalDate.now(),
                    LocalDate.now().plusDays(1),
                    null,
                    1
            );

            // when & then
            assertThatThrownBy(() -> swapService.createSwapRequest(requester.getId(), swapRequest))
                    .isInstanceOf(ForbiddenException.class);
        }

        @Test
        @DisplayName("자신이 소유한 숙소와 스왑 요청을 생성시 예외가 발생한다.")
        void createSwapRequest_SwapWithOwnHouse_ThrowsForbiddenException() {
            // given
            User requester = createUser("requester@test.com", "요청자", "요청자닉네임");

            House requesterHouse1 = createHouse("요청자 숙소1", requester);
            House requesterHouse2 = createHouse("요청자 숙소2", requester);

            SwapRequest swapRequest = new SwapRequest(
                    requesterHouse1.getId(),
                    requesterHouse2.getId(),
                    LocalDate.now(),
                    LocalDate.now().plusDays(1),
                    null,
                    1
            );

            // when & then
            assertThatThrownBy(() -> swapService.createSwapRequest(requester.getId(), swapRequest))
                    .isInstanceOf(ForbiddenException.class);
        }

        @Test
        @DisplayName("이미 대기 중인 요청이 있는 숙소에 스왑 요청을 생성시 예외 발생한다.")
        void createSwapRequest_AlreadyPendingRequest_ThrowsBusinessException() {
            // given
            User requester1 = createUser("requester1@test.com", "요청자1", "요청자1닉네임");
            User requester2 = createUser("requester2@test.com", "요청자2", "요청자2닉네임");
            User targetOwner = createUser("target@test.com", "대상집주인", "대상집주인닉네임");

            House requester1House = createHouse("요청자1 숙소", requester1);
            House requester2House = createHouse("요청자2 숙소", requester2);
            House targetHouse = createHouse("대상 숙소", targetOwner);

            Swap existingSwap = Swap.builder()
                    .requester(requester1)
                    .requesterHouseId(requester1House)
                    .house(targetHouse)
                    .startDate(LocalDate.now())
                    .endDate(LocalDate.now().plusDays(1))
                    .swapStatus(SwapStatus.PENDING)
                    .swapType(SwapType.SWAP)
                    .guest(1)
                    .build();
            swapRepository.save(existingSwap);

            SwapRequest swapRequest = new SwapRequest(
                    requester2House.getId(),
                    targetHouse.getId(),
                    LocalDate.now().plusDays(2),
                    LocalDate.now().plusDays(4),
                    null,
                    2
            );

            // when & then
            assertThatThrownBy(() -> swapService.createSwapRequest(requester2.getId(), swapRequest))
                    .isInstanceOf(BusinessException.class);
        }

        @Test
        @DisplayName("메시지가 없는 스왑 요청을 정상적으로 생성한다.")
        void createSwapRequest_NoMessage_Success() {
            // given
            User requester = createUser("requester@test.com", "요청자", "요청자닉네임");
            User targetOwner = createUser("target@test.com", "대상집주인", "대상집주인닉네임");

            House requesterHouse = createHouse("요청자 숙소", requester);
            House targetHouse = createHouse("대상 숙소", targetOwner);

            SwapRequest swapRequest = new SwapRequest(
                    requesterHouse.getId(),
                    targetHouse.getId(),
                    LocalDate.now().plusDays(1),
                    LocalDate.now().plusDays(3),
                    null,
                    1
            );

            // when
            SwapResponse response = swapService.createSwapRequest(requester.getId(), swapRequest);

            // then
            assertThat(response).isNotNull();
            assertThat(response.getMessage()).isNull();
            assertThat(response.getSwapStatus()).isEqualTo(SwapStatus.PENDING);
        }

        @Test
        @DisplayName("최소 게스트 수(1명)로 스왑 요청을 정상적으로 생성한다.")
        void createSwapRequest_MinimumGuestCount_Success() {
            // given
            User requester = createUser("requester@test.com", "요청자", "요청자닉네임");
            User targetOwner = createUser("target@test.com", "대상집주인", "대상집주인닉네임");

            House requesterHouse = createHouse("요청자 숙소", requester);
            House targetHouse = createHouse("대상 숙소", targetOwner);

            SwapRequest swapRequest = new SwapRequest(
                    requesterHouse.getId(),
                    targetHouse.getId(),
                    LocalDate.now().plusDays(1),
                    LocalDate.now().plusDays(3),
                    null,
                    1
            );

            // when
            SwapResponse response = swapService.createSwapRequest(requester.getId(), swapRequest);

            // then
            assertThat(response).isNotNull();
            assertThat(response.getGuest()).isEqualTo(1);
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
}
