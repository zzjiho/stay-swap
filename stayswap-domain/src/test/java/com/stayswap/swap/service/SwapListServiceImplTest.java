package com.stayswap.swap.service;

import com.stayswap.IntegrationTest;
import com.stayswap.house.model.entity.House;
import com.stayswap.house.model.entity.HouseImage;
import com.stayswap.house.repository.HouseImageRepository;
import com.stayswap.house.repository.HouseRepository;
import com.stayswap.jwt.constant.Role;
import com.stayswap.swap.constant.SwapStatus;
import com.stayswap.swap.constant.SwapType;
import com.stayswap.swap.model.dto.response.SwapListForGuestResponse;
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

import static org.assertj.core.api.Assertions.assertThat;

class SwapListServiceImplTest extends IntegrationTest {

    @Autowired
    private SwapRepository swapRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private HouseRepository houseRepository;

    @Autowired
    private HouseImageRepository houseImageRepository;

    @Autowired
    private SwapListService swapListService;

    @BeforeEach
    void setUp() {
        swapRepository.deleteAll();
        houseImageRepository.deleteAll();
        houseRepository.deleteAll();
        userRepository.deleteAll();
    }

    @Nested
    @DisplayName("교환/숙박 목록 조회")
    class getSwap {

        @Test
        @DisplayName("요청자일때 교환/숙박 목록 조회 성공")
        void successGetSwapList() {
            // given
            User requester = createUser("requester@test.com", "요청자", "요청자닉네임");
            User houseOwner = createUser("owner@test.com", "집주인", "집주인닉네임");

            House house = createHouse("테스트 숙소", houseOwner);
            Swap completedSwap = createCompletedSwap(requester, house);

            //when
            Slice<SwapListForGuestResponse> result =
                    swapListService.getSwapListByRequester(requester.getId(), SwapStatus.COMPLETED, SwapType.SWAP, Pageable.ofSize(10));

            //then
            assertThat(result.getContent()).hasSize(1);
            
            SwapListForGuestResponse swapResponse = result.getContent().get(0);
            assertThat(swapResponse.getSwapId()).isEqualTo(completedSwap.getId());
            assertThat(swapResponse.getRequesterId()).isEqualTo(requester.getId());
            assertThat(swapResponse.getHouseTitle()).isEqualTo("테스트 숙소");
            assertThat(swapResponse.getSwapType()).isEqualTo(SwapType.SWAP);
            assertThat(swapResponse.getSwapStatus()).isEqualTo(SwapStatus.COMPLETED);
            assertThat(swapResponse.getStartDate()).isEqualTo(LocalDate.now());
            assertThat(swapResponse.getEndDate()).isEqualTo(LocalDate.now().plusDays(1));
        }

        @Test
        @DisplayName("다른 상태의 스왑은 조회되지 않는다")
        void getSwapList_DifferentStatus_NotIncluded() {
            // given
            User requester = createUser("requester@test.com", "요청자", "요청자닉네임");
            User houseOwner = createUser("owner@test.com", "집주인", "집주인닉네임");

            House house = createHouse("테스트 숙소", houseOwner);
            createSwap(requester, house, SwapStatus.PENDING);
            createSwap(requester, house, SwapStatus.ACCEPTED);

            //when
            Slice<SwapListForGuestResponse> result =
                    swapListService.getSwapListByRequester(requester.getId(), SwapStatus.COMPLETED, SwapType.SWAP, Pageable.ofSize(10));

            //then
            assertThat(result.getContent()).hasSize(0);
        }

        @Test
        @DisplayName("다른 타입의 스왑은 조회되지 않는다")
        void getSwapList_DifferentType_NotIncluded() {
            // given
            User requester = createUser("requester@test.com", "요청자", "요청자닉네임");
            User houseOwner = createUser("owner@test.com", "집주인", "집주인닉네임");

            House house = createHouse("테스트 숙소", houseOwner);
            Swap staySwap = Swap.builder()
                    .requester(requester)
                    .house(house)
                    .startDate(LocalDate.now())
                    .endDate(LocalDate.now().plusDays(1))
                    .swapStatus(SwapStatus.COMPLETED)
                    .swapType(SwapType.STAY)
                    .build();
            swapRepository.save(staySwap);

            //when
            Slice<SwapListForGuestResponse> result =
                    swapListService.getSwapListByRequester(requester.getId(), SwapStatus.COMPLETED, SwapType.SWAP, Pageable.ofSize(10));

            //then
            assertThat(result.getContent()).hasSize(0);
        }

        @Test
        @DisplayName("다른 사용자의 스왑은 조회되지 않는다")
        void getSwapList_DifferentUser_NotIncluded() {
            // given
            User requester1 = createUser("requester1@test.com", "요청자1", "요청자1닉네임");
            User requester2 = createUser("requester2@test.com", "요청자2", "요청자2닉네임");
            User houseOwner = createUser("owner@test.com", "집주인", "집주인닉네임");

            House house = createHouse("테스트 숙소", houseOwner);
            createCompletedSwap(requester2, house);

            //when
            Slice<SwapListForGuestResponse> result =
                    swapListService.getSwapListByRequester(requester1.getId(), SwapStatus.COMPLETED, SwapType.SWAP, Pageable.ofSize(10));

            //then
            assertThat(result.getContent()).hasSize(0);
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
                .swapType(SwapType.SWAP)
                .build();
        return swapRepository.save(swap);
    }

    private Swap createCompletedSwap(User requester, House house) {
        return createSwap(requester, house, SwapStatus.COMPLETED);
    }




}