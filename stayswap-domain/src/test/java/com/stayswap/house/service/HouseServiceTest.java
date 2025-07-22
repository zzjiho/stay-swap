package com.stayswap.house.service;

import com.stayswap.IntegrationTest;
import com.stayswap.error.exception.NotFoundException;
import com.stayswap.house.constant.HouseType;
import com.stayswap.house.model.dto.request.CreateHouseRequest;
import com.stayswap.house.model.dto.response.CountryResponse;
import com.stayswap.house.model.dto.response.CreateHouseResponse;
import com.stayswap.house.model.dto.response.HouseDetailResponse;
import com.stayswap.house.model.dto.response.HostDetailResponse;
import com.stayswap.house.model.dto.response.HouseImageResponse;
import com.stayswap.house.model.dto.response.MyHouseResponse;
import com.stayswap.house.model.dto.response.UpdateHouseStatusResponse;
import com.stayswap.house.model.entity.House;
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
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.web.multipart.MultipartFile;

import jakarta.validation.ConstraintViolationException;

import java.io.IOException;
import java.util.Arrays;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Slice;
import com.stayswap.error.exception.ForbiddenException;


class HouseServiceTest extends IntegrationTest {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private HouseRepository houseRepository;

    @Autowired
    private HouseService houseService;

    @Autowired
    private HouseLikeService houseLikeService;

    private User testUser;
    private House testHouse;
    private CreateHouseRequest validRequest;
    private List<MultipartFile> testImages;

    @BeforeEach
    void setUp() throws IOException {
        // 기존 데이터 정리
        houseRepository.deleteAll();
        userRepository.deleteAll();

        // 더미유저
        User user = User.builder()
                .userName("홍길동")
                .email("test@test.com")
                .nickname("까만까마귀")
                .userType(UserType.KAKAO)
                .role(Role.ROLE_USER)
                .build();

        testUser = userRepository.save(user);

        validRequest = createhousebuilder(
                "서울 강남 아늑한 아파트",
                "서울 강남에 위치한 아늑한 아파트입니다.",
                HouseType.APT,
                2,
                4,
                "서울특별시 강남구 테헤란로 123",
                37.5665,
                126.9780,
                "대한민국",
                "South Korea");

        // 이미지
        testImages = Arrays.asList(
                new MockMultipartFile("image1", "test1.jpg", "image/jpeg", "test1".getBytes()),
                new MockMultipartFile("image2", "test2.jpg", "image/jpeg", "test2".getBytes())
        );

        CreateHouseResponse response = houseService.createHouse(testUser.getId(), validRequest, testImages);
        testHouse = houseRepository.findById(response.getHouseId()).orElse(null);
    }

    @Nested
    @DisplayName("정상적으로 숙소를 등록한다.")
    class SuccessCreateHouse {

        @Test
        @DisplayName("이미지와 함께 숙소를 등록한다.")
        void createHouseWithImg() throws IOException {
            //given
            //when
            CreateHouseResponse response = houseService.createHouse(testUser.getId(), validRequest, testImages);

            //then
            assertThat(response.getHouseId()).isNotNull();
            House house = houseRepository.findById(response.getHouseId()).orElse(null);
            assertThat(house).isNotNull();
            assertThat(house.getTitle()).isEqualTo("서울 강남 아늑한 아파트");
            assertThat(house.getPetsAllowed()).isTrue();
        }

        @Test
        @DisplayName("다양한 숙소 타입으로 등록이 가능하다.")
        void createHouseDifferentTypes() throws Exception {
            //given
            CreateHouseRequest villaRequest = createhousebuilder("제주도 전원주택", "제주도 한적한 마을에 위치한 전원주택입니다.", HouseType.HOUSE, 3, 6, "제주특별자치도 제주시 한림읍 한림로 123", 33.4996, 126.5312, "대한민국", "South Korea");

            //when
            CreateHouseResponse response = houseService.createHouse(testUser.getId(), villaRequest, testImages);

            //then
            assertThat(response.getHouseId()).isNotNull();
            House house = houseRepository.findById(response.getHouseId()).orElse(null);
            assertThat(house.getTitle()).isEqualTo("제주도 전원주택");
            assertThat(house.getHouseType()).isEqualTo(HouseType.HOUSE);
        }
    }

    @Nested
    @DisplayName("필수값을 작성하지 않은채로 숙소를 등록할 수 없다.")
    class FailureCreateHouse {

        @Test
        @DisplayName("제목이 없으면 숙소 등록이 실패한다.")
        void createHouseWithoutTitle() {
            // given
            CreateHouseRequest requestWithoutTitle = createhousebuilder(null, "숙소 설명", HouseType.APT, 2, 4, "서울특별시 강남구", 37.5665, 126.9780, "대한민국", "South Korea");

            // when & then
            assertThatThrownBy(() -> houseService.createHouse(testUser.getId(), requestWithoutTitle, testImages))
                    .isInstanceOf(ConstraintViolationException.class)
                    .hasMessageContaining("숙소 제목은 필수 입력값입니다.");
        }

        @Test
        @DisplayName("설명이 없으면 숙소 등록이 실패한다.")
        void createHouseWithoutDescription() {
            // given
            CreateHouseRequest requestWithoutDescription = createhousebuilder("집 이름", null, HouseType.APT, 2, 4, "서울특별시 강남구", 37.5665, 126.9780, "대한민국", "South Korea");

            // when & then
            assertThatThrownBy(() -> houseService.createHouse(testUser.getId(), requestWithoutDescription, testImages))
                    .isInstanceOf(ConstraintViolationException.class)
                    .hasMessageContaining("숙소 설명은 필수 입력값입니다.");
        }

        @Test
        @DisplayName("숙소 타입이 없으면 숙소 등록이 실패한다.")
        void createHouseWithoutHouseType() {
            // given
            CreateHouseRequest requestWithoutType = createhousebuilder("집 이름", "숙소 설명", null, 2, 4, "서울특별시 강남구", 37.5665, 126.9780, "대한민국", "South Korea");

            // when & then
            assertThatThrownBy(() -> houseService.createHouse(testUser.getId(), requestWithoutType, testImages))
                    .isInstanceOf(ConstraintViolationException.class)
                    .hasMessageContaining("숙소 유형은 필수 입력값입니다.");
        }

        @Test
        @DisplayName("침실 수가 없으면 숙소 등록이 실패한다.")
        void createHouseWithoutBedrooms() {
            // given
            CreateHouseRequest requestWithoutBedrooms = createhousebuilder("집 이름", "숙소 설명", HouseType.APT, null, 4, "서울특별시 강남구", 37.5665, 126.9780, "대한민국", "South Korea");

            // when & then
            assertThatThrownBy(() -> houseService.createHouse(testUser.getId(), requestWithoutBedrooms, testImages))
                    .isInstanceOf(ConstraintViolationException.class)
                    .hasMessageContaining("침실 수는 필수 입력값입니다.");
        }

        @Test
        @DisplayName("최대 수용 인원이 없으면 숙소 등록이 실패한다.")
        void createHouseWithoutMaxGuests() {
            // given
            CreateHouseRequest requestWithoutMaxGuests = createhousebuilder("집 이름", "숙소 설명", HouseType.APT, 2, null, "서울특별시 강남구", 37.5665, 126.9780, "대한민국", "South Korea");

            // when & then
            assertThatThrownBy(() -> houseService.createHouse(testUser.getId(), requestWithoutMaxGuests, testImages))
                    .isInstanceOf(ConstraintViolationException.class)
                    .hasMessageContaining("최대 수용 인원은 필수 입력값입니다.");
        }

        @Test
        @DisplayName("주소가 없으면 숙소 등록이 실패한다.")
        void createHouseWithoutAddress() {
            // given
            CreateHouseRequest requestWithoutAddress = createhousebuilder("집 이름", "숙소 설명", HouseType.APT, 2, 4, null, 37.5665, 126.9780, "대한민국", "South Korea");

            // when & then
            assertThatThrownBy(() -> houseService.createHouse(testUser.getId(), requestWithoutAddress, testImages))
                    .isInstanceOf(ConstraintViolationException.class)
                    .hasMessageContaining("한국어 상세 주소는 필수 입력값입니다.");
        }

        @Test
        @DisplayName("위도가 없으면 숙소 등록이 실패한다.")
        void createHouseWithoutLatitude() {
            // given
            CreateHouseRequest requestWithoutLatitude = createhousebuilder("집 이름", "숙소 설명", HouseType.APT, 2, 4, "서울특별시 강남구", null, 126.9780, "대한민국", "South Korea");

            // when & then
            assertThatThrownBy(() -> houseService.createHouse(testUser.getId(), requestWithoutLatitude, testImages))
                    .isInstanceOf(ConstraintViolationException.class);
        }

        @Test
        @DisplayName("경도가 없으면 숙소 등록이 실패한다.")
        void createHouseWithoutLongitude() {
            // given
            CreateHouseRequest requestWithoutLongitude = createhousebuilder("집 이름", "숙소 설명", HouseType.APT, 2, 4, "서울특별시 강남구", 37.5665, null, "대한민국", "South Korea");

            // when & then
            assertThatThrownBy(() -> houseService.createHouse(testUser.getId(), requestWithoutLongitude, testImages))
                    .isInstanceOf(ConstraintViolationException.class);
        }

        @Test
        @DisplayName("모든 필수값이 없으면 숙소 등록이 실패한다.")
        void createHouseWithoutAllRequiredFields() {
            // given
            CreateHouseRequest requestWithoutAll = createhousebuilder(null, null, null, null, null, null, null, null, "대한민국", "South Korea");

            // when & then
            assertThatThrownBy(() -> houseService.createHouse(testUser.getId(), requestWithoutAll, testImages))
                    .isInstanceOf(ConstraintViolationException.class)
                    .hasMessageContaining("숙소 제목은 필수 입력값입니다.");
        }
    }

    @Nested
    @DisplayName("숙소 상세 정보를 조회에 성공한다.")
    class GetHouseDetail {

        @Test
        @DisplayName("사용자가 숙소 상세 정보를 조회에 성공한다.")
        void getHouseDetailLoggedInUser() {
            //given
            //when
            HouseDetailResponse response = houseService.getHouseDetail(testHouse.getId(), testUser.getId());

            //then
            assertThat(response).isNotNull();
            assertThat(response.getHouseId()).isEqualTo(testHouse.getId());
            assertThat(response.getTitle()).isEqualTo(testHouse.getTitle());
            assertThat(response.getDescription()).isEqualTo(testHouse.getDescription());
            assertThat(response.getHouseType()).isEqualTo(testHouse.getHouseType());
            assertThat(response.getIsLiked()).isFalse();
        }

        @Test
        @DisplayName("비로그인 사용자가 숙소 상세 정보를 조회에 성공한다.")
        void getHouseDetailWithoutLoggedInUser() {
            //given
            //when
            HouseDetailResponse response = houseService.getHouseDetail(testHouse.getId(), null);

            //then
            assertThat(response).isNotNull();
            assertThat(response.getHouseId()).isEqualTo(testHouse.getId());
            assertThat(response.getTitle()).isEqualTo(testHouse.getTitle());
            assertThat(response.getIsLiked()).isFalse(); // 비로그인 사용자는 좋아요 상태가 false
        }

    }

    @Nested
    @DisplayName("숙소 상세 정보에 실패한다.")
    class GetHouseDetailFailure {

        @Test
        @DisplayName("존재하지 않는 숙소 ID로 조회시 예외가 발생한다.")
        void getHouseDetailNotExistedHouse() {
            //given
            Long testId = 9999L;

            //when & then
            assertThatThrownBy(() -> houseService.getHouseDetail(testId, testUser.getId()))
                    .isInstanceOf(NotFoundException.class);
        }

        @Test
        @DisplayName("비활성화된 숙소 ID로 조회시 예외가 발생한다.")
        void getHouseDetailInactiveHouse() {
            //given
            testHouse.updateActiveStatus(false);

            //when & then
            assertThatThrownBy(() -> houseService.getHouseDetail(testHouse.getId(), testUser.getId()))
                    .isInstanceOf(NotFoundException.class);
        }
    }

    @Nested
    @DisplayName("등록된 숙소들의 국가 목록을 조회한다.")
    class GetDistinctCountries {

        @Test
        @DisplayName("등록된 숙소들의 국가 목록을 중복 제거하여 조회한다.")
        void getDistinctCountries() {
            // given
            CreateHouseRequest koreaRequest = createhousebuilder(
                    "서울 아파트", "서울에 위치한 아파트", HouseType.APT, 2, 4,
                    "서울특별시 강남구", 37.5665, 126.9780, "대한민국", "South Korea");
            houseRepository.save(koreaRequest.toEntity(testUser, koreaRequest.getHouseType()));

            CreateHouseRequest japanRequest = createhousebuilder(
                    "도쿄 아파트", "도쿄에 위치한 아파트", HouseType.APT, 1, 2,
                    "도쿄도 시부야구", 35.6762, 139.6503, "일본", "Japan");
            houseRepository.save(japanRequest.toEntity(testUser, japanRequest.getHouseType()));

            CreateHouseRequest usaRequest = createhousebuilder(
                    "뉴욕 아파트", "뉴욕에 위치한 아파트", HouseType.APT, 3, 6,
                    "뉴욕 맨해튼", 40.7128, -74.0060, "미국", "United States");
            houseRepository.save(usaRequest.toEntity(testUser, usaRequest.getHouseType()));

            CreateHouseRequest koreaRequest2 = createhousebuilder(
                    "부산 아파트", "부산에 위치한 아파트", HouseType.APT, 2, 4,
                    "부산광역시 해운대구", 35.1796, 129.0756, "대한민국", "South Korea");
            houseRepository.save(koreaRequest2.toEntity(testUser, koreaRequest2.getHouseType()));

            // when
            List<CountryResponse> countries = houseService.getDistinctCountries();

            // then
            assertThat(countries).isNotNull();
            assertThat(countries).hasSize(3);

            // 국가명 확인
            List<String> countryNames = countries.stream()
                    .map(CountryResponse::getCountryKo)
                    .toList();
            assertThat(countryNames).containsExactlyInAnyOrder("대한민국", "일본", "미국");
        }

        @Test
        @DisplayName("등록된 숙소가 없으면 빈 리스트를 반환한다.")
        void getDistinctCountriesWhenNoHouses() {
            // given
            houseRepository.deleteAll(); // 모든 숙소 삭제

            // when
            List<CountryResponse> countries = houseService.getDistinctCountries();

            // then
            assertThat(countries).isNotNull();
            assertThat(countries).isEmpty();
        }

        @Test
        @DisplayName("같은 국가의 숙소가 여러 개 있어도 중복 제거하여 반환한다.")
        void getDistinctCountriesWithDuplicates() {
            // given
            houseRepository.deleteAll(); // 기존 데이터 정리

            // 같은 국가의 숙소들을 여러 개 등록
            for (int i = 1; i <= 5; i++) {
                CreateHouseRequest request = createhousebuilder(
                        "숙소 " + i, "설명 " + i, HouseType.APT, 2, 4,
                        "서울특별시 강남구", 37.5665, 126.9780, "대한민국", "South Korea");
                houseRepository.save(request.toEntity(testUser, request.getHouseType()));
            }

            // when
            List<CountryResponse> countries = houseService.getDistinctCountries();

            // then
            assertThat(countries).isNotNull();
            assertThat(countries).hasSize(1); // 중복 제거되어 1개만 반환
            assertThat(countries.get(0).getCountryKo()).isEqualTo("대한민국");
            assertThat(countries.get(0).getCountryEn()).isEqualTo("South Korea");
        }
    }

    @Nested
    @DisplayName("숙소 상세조회시 호스트의 상세 정보를 정상적으로 조회한다.")
    class GetHostDetail {

        @Test
        @DisplayName("숙소 ID로 호스트 상세 정보를 정상적으로 조회한다.")
        void getHostDetailByHouseId() {
            // given
            // when
            HostDetailResponse hostDetail = houseService.getHostDetailByHouseId(testHouse.getId());

            // then
            assertThat(hostDetail).isNotNull();
            assertThat(hostDetail.getHostId()).isEqualTo(testUser.getId());
            assertThat(hostDetail.getHostName()).isEqualTo(testUser.getNickname());
            assertThat(hostDetail.getProfile()).isEqualTo(testUser.getProfile());
            assertThat(hostDetail.getJoinedAt()).isNotNull();
        }

        @Test
        @DisplayName("존재하지 않는 숙소 ID로 조회시 예외가 발생한다.")
        void getHostDetailByNonExistentHouseId() {
            // given
            Long nonExistentHouseId = 9999L;

            // when & then
            assertThatThrownBy(() -> houseService.getHostDetailByHouseId(nonExistentHouseId))
                    .isInstanceOf(NotFoundException.class)
                    .hasMessageContaining("존재하지 않는 숙소입니다");
        }
    }

    @Nested
    @DisplayName("숙소상세 조회시 이미지를 정상 조회한다.")
    class GetHouseImages {

        @Test
        @DisplayName("숙소 ID로 이미지 목록을 정상적으로 조회한다.")
        void getHouseImages() {
            // given
            // when
            List<HouseImageResponse> images = houseService.getHouseImages(testHouse.getId());

            // then
            assertThat(images).isNotNull();
            // 이미지가 있다면 각 이미지의 정보를 확인
            if (!images.isEmpty()) {
                images.forEach(image -> {
                    assertThat(image.getImageId()).isNotNull();
                    assertThat(image.getImageUrl()).isNotNull();
                    assertThat(image.getHouseId()).isEqualTo(testHouse.getId());
                });
            }
        }

        @Test
        @DisplayName("존재하지 않는 숙소 ID로 조회시 예외가 발생한다.")
        void getHouseImagesByNonExistentHouseId() {
            // given
            Long nonExistentHouseId = 9999L;

            // when & then
            assertThatThrownBy(() -> houseService.getHouseImages(nonExistentHouseId))
                    .isInstanceOf(NotFoundException.class)
                    .hasMessageContaining("존재하지 않는 숙소입니다");
        }
    }

    @Nested
    @DisplayName("내 숙소 목록을 조회한다.")
    class GetMyHouses {

        @Test
        @DisplayName("내 숙소 목록을 정상적으로 조회한다.")
        void getMyHouses() {
            // given
            Pageable pageable = PageRequest.of(0, 10);

            // when
            Slice<MyHouseResponse> myHouses = houseService.getMyHouses(testUser.getId(), pageable);

            // then
            assertThat(myHouses).isNotNull();
            assertThat(myHouses.getContent()).isNotEmpty();
            assertThat(myHouses.getContent().get(0).getId()).isEqualTo(testHouse.getId());
            assertThat(myHouses.getContent().get(0).getTitle()).isEqualTo(testHouse.getTitle());
        }

        @Test
        @DisplayName("여러 개의 숙소가 있을 때 페이지네이션이 정상 동작한다.")
        void getMyHousesWithMultipleHouses() throws IOException {
            // given
            CreateHouseRequest house2Request = createhousebuilder(
                    "서울 강남 두 번째 아파트", "두 번째 아파트입니다", HouseType.APT, 1, 2,
                    "서울특별시 강남구", 37.5665, 126.9780, "대한민국", "South Korea");
            houseService.createHouse(testUser.getId(), house2Request, testImages);

            CreateHouseRequest house3Request = createhousebuilder(
                    "서울 강남 세 번째 아파트", "세 번째 아파트입니다", HouseType.HOUSE, 3, 6,
                    "서울특별시 강남구", 37.5665, 126.9780, "대한민국", "South Korea");
            houseService.createHouse(testUser.getId(), house3Request, testImages);

            Pageable pageable = PageRequest.of(0, 2);

            // when
            Slice<MyHouseResponse> myHouses = houseService.getMyHouses(testUser.getId(), pageable);

            // then
            assertThat(myHouses).isNotNull();
            assertThat(myHouses.getContent()).hasSize(2);
            assertThat(myHouses.hasNext()).isTrue();
        }

        @Test
        @DisplayName("존재하지 않는 사용자 ID로 조회시 예외가 발생한다.")
        void getMyHousesByNonExistentUserId() {
            // given
            Long nonExistentUserId = 9999L;
            Pageable pageable = PageRequest.of(0, 10);

            // when & then
            assertThatThrownBy(() -> houseService.getMyHouses(nonExistentUserId, pageable))
                    .isInstanceOf(NotFoundException.class)
                    .hasMessageContaining("존재하지 않는 회원입니다");
        }

        @Test
        @DisplayName("숙소가 없는 사용자도 빈 슬라이스를 반환한다.")
        void getMyHousesWhenNoHouses() {
            // given
            User newUser = User.builder()
                    .userName("새사용자")
                    .email("new@test.com")
                    .nickname("새사용자")
                    .userType(UserType.KAKAO)
                    .role(Role.ROLE_USER)
                    .build();
            User savedNewUser = userRepository.save(newUser);
            Pageable pageable = PageRequest.of(0, 10);

            // when
            Slice<MyHouseResponse> myHouses = houseService.getMyHouses(savedNewUser.getId(), pageable);

            // then
            assertThat(myHouses).isNotNull();
            assertThat(myHouses.getContent()).isEmpty();
            assertThat(myHouses.hasNext()).isFalse();
        }
    }

    @Nested
    @DisplayName("좋아요 누른 숙소 목록을 조회한다.")
    class GetLikedHouses {

        private User otherUser;
        private House otherHouse;

        @BeforeEach
        void setUpLikedHouses() throws IOException {
            // 다른 사용자 생성 (한 번만 생성하여 재사용)
            otherUser = createTestUser("다른사용자", "other@test.com", "다른사용자");

            // 다른 사용자의 숙소 생성
            otherHouse = createTestHouse(otherUser, "부산 해운대 전망 좋은 아파트");
        }

        @Test
        @DisplayName("자신이 좋아요를 누른 숙소 목록을 정상적으로 조회한다.")
        void getLikedHousesSuccessfully() {
            // given
            houseLikeService.addLike(otherHouse.getId(), testUser.getId());
            Pageable pageable = PageRequest.of(0, 10);

            // when
            Slice<MyHouseResponse> likedHouses = houseService.getLikedHouses(testUser.getId(), pageable);

            // then
            assertThat(likedHouses).isNotNull();
            assertThat(likedHouses.getContent()).hasSize(1);
            assertThat(likedHouses.getContent().get(0).getId()).isEqualTo(otherHouse.getId());
            assertThat(likedHouses.getContent().get(0).getTitle()).isEqualTo("부산 해운대 전망 좋은 아파트");
            assertThat(likedHouses.hasNext()).isFalse();
        }

        @Test
        @DisplayName("여러 개의 좋아요 숙소가 있을 때 페이지네이션이 정상 동작한다.")
        void getLikedHousesWithMultipleHousesAndPagination() throws IOException {
            // given
            User secondUser = createTestUser("두번째사용자", "second@test.com", "두번째사용자");
            House secondHouse = createTestHouse(secondUser, "서울 강남 럭셔리 아파트");

            houseLikeService.addLike(otherHouse.getId(), testUser.getId());
            houseLikeService.addLike(secondHouse.getId(), testUser.getId());

            Pageable pageable = PageRequest.of(0, 1); // 페이지 크기를 1로 설정

            // when
            Slice<MyHouseResponse> likedHouses = houseService.getLikedHouses(testUser.getId(), pageable);

            // then
            assertThat(likedHouses).isNotNull();
            assertThat(likedHouses.getContent()).hasSize(1);
            assertThat(likedHouses.hasNext()).isTrue();
        }

        @Test
        @DisplayName("존재하지 않는 사용자 ID로 조회시 예외가 발생한다.")
        void getLikedHousesByNonExistentUserId() {
            // given
            Long nonExistentUserId = 9999L;
            Pageable pageable = PageRequest.of(0, 10);

            // when & then
            assertThatThrownBy(() -> houseService.getLikedHouses(nonExistentUserId, pageable))
                    .isInstanceOf(NotFoundException.class)
                    .hasMessageContaining("존재하지 않는 회원입니다");
        }

        @Test
        @DisplayName("좋아요를 누른 숙소가 없는 사용자는 빈 슬라이스를 반환한다.")
        void getLikedHousesWhenNoLikedHouses() {
            // given
            Pageable pageable = PageRequest.of(0, 10);

            // when
            Slice<MyHouseResponse> likedHouses = houseService.getLikedHouses(testUser.getId(), pageable);

            // then
            assertThat(likedHouses).isNotNull();
            assertThat(likedHouses.getContent()).isEmpty();
            assertThat(likedHouses.hasNext()).isFalse();
        }

        @Test
        @DisplayName("좋아요를 취소한 숙소는 목록에 포함되지 않는다.")
        void getLikedHousesExcludesCancelledLikes() {
            // given
            houseLikeService.addLike(otherHouse.getId(), testUser.getId());
            houseLikeService.cancelLike(otherHouse.getId(), testUser.getId());

            Pageable pageable = PageRequest.of(0, 10);

            // when
            Slice<MyHouseResponse> likedHouses = houseService.getLikedHouses(testUser.getId(), pageable);

            // then
            assertThat(likedHouses).isNotNull();
            assertThat(likedHouses.getContent()).isEmpty();
            assertThat(likedHouses.hasNext()).isFalse();
        }

        @Test
        @DisplayName("비활성화된 숙소는 좋아요 목록에 포함되지 않는다.")
        void getLikedHousesExcludesInactiveHouses() {
            // given
            houseLikeService.addLike(otherHouse.getId(), testUser.getId());
            houseService.updateHouseStatus(otherHouse.getId(), otherUser.getId(), false);

            Pageable pageable = PageRequest.of(0, 10);

            // when
            Slice<MyHouseResponse> likedHouses = houseService.getLikedHouses(testUser.getId(), pageable);

            // then
            assertThat(likedHouses).isNotNull();
            assertThat(likedHouses.getContent()).isEmpty();
            assertThat(likedHouses.hasNext()).isFalse();
        }

        @Test
        @DisplayName("삭제된 숙소는 좋아요 목록에 포함되지 않는다.")
        void getLikedHousesExcludesDeletedHouses() {
            // given
            houseLikeService.addLike(otherHouse.getId(), testUser.getId());
            houseRepository.delete(otherHouse);

            Pageable pageable = PageRequest.of(0, 10);

            // when
            Slice<MyHouseResponse> likedHouses = houseService.getLikedHouses(testUser.getId(), pageable);

            // then
            assertThat(likedHouses).isNotNull();
            assertThat(likedHouses.getContent()).isEmpty();
            assertThat(likedHouses.hasNext()).isFalse();
        }
    }

    @Nested
    @DisplayName("숙소 활성화/비활성화 상태를 변경한다.")
    class UpdateHouseStatus {

        @Test
        @DisplayName("호스트는 활성화 상태를 비활성화로 변경할 수 있다.")
        void updateHouseStatusFromActiveToInactive() {
            // given
            assertThat(testHouse.getIsActive()).isTrue();

            // when
            UpdateHouseStatusResponse response = houseService.updateHouseStatus(testHouse.getId(), testUser.getId(), false);

            // then
            assertThat(response).isNotNull();
            assertThat(response.getHouseId()).isEqualTo(testHouse.getId());
            assertThat(response.getIsActive()).isFalse();
            House updatedHouse = houseRepository.findById(testHouse.getId()).orElse(null);
            assertThat(updatedHouse).isNotNull();
            assertThat(updatedHouse.getIsActive()).isFalse();
        }

        @Test
        @DisplayName("호스트는 비활성화 상태를 활성화로 변경할 수 있다.")
        void updateHouseStatusFromInactiveToActive() {
            // given
            houseService.updateHouseStatus(testHouse.getId(), testUser.getId(), false);

            // when
            UpdateHouseStatusResponse response =
                    houseService.updateHouseStatus(testHouse.getId(), testUser.getId(), true);

            // then
            assertThat(response).isNotNull();
            assertThat(response.getHouseId()).isEqualTo(testHouse.getId());
            assertThat(response.getIsActive()).isTrue();
            House updatedHouse = houseRepository.findById(testHouse.getId()).orElse(null);
            assertThat(updatedHouse).isNotNull();
            assertThat(updatedHouse.getIsActive()).isTrue();
        }

        @Test
        @DisplayName("같은 상태로 변경해도 정상적으로 처리된다.")
        void updateHouseStatusToSameStatus() {
            // given
            assertThat(testHouse.getIsActive()).isTrue();

            // when
            UpdateHouseStatusResponse response = houseService.updateHouseStatus(testHouse.getId(), testUser.getId(), true);

            // then
            assertThat(response).isNotNull();
            assertThat(response.getHouseId()).isEqualTo(testHouse.getId());
            assertThat(response.getIsActive()).isTrue();
        }

        @Test
        @DisplayName("존재하지 않는 숙소 ID로 상태 변경시 예외가 발생한다.")
        void updateHouseStatusWithNonExistentHouseId() {
            // given
            Long nonExistentHouseId = 9999L;

            // when & then
            assertThatThrownBy(() -> houseService.updateHouseStatus(nonExistentHouseId, testUser.getId(), false))
                    .isInstanceOf(NotFoundException.class)
                    .hasMessageContaining("존재하지 않는 숙소입니다");
        }

        @Test
        @DisplayName("숙소 소유자가 아닌 사용자가 상태 변경시 예외가 발생한다.")
        void updateHouseStatusByNonOwner() {
            // given
            User otherUser = createTestUser("다른사용자", "other@test.com", "다른사용자");

            // when & then
            assertThatThrownBy(() -> houseService.updateHouseStatus(testHouse.getId(), otherUser.getId(), false))
                    .isInstanceOf(ForbiddenException.class)
                    .hasMessageContaining("권한이 없습니다");
        }


        // 헬퍼 메서드
        private User createTestUser(String userName, String email, String nickname) {
            User user = User.builder()
                    .userName(userName)
                    .email(email)
                    .nickname(nickname)
                    .userType(UserType.KAKAO)
                    .role(Role.ROLE_USER)
                    .build();
            return userRepository.save(user);
        }
    }

    public CreateHouseRequest createhousebuilder(String title, String dec, HouseType houseType,
                                                 Integer bedrooms, Integer maxGuests,
                                                 String addressKo, Double latitude, Double longitude,
                                                 String countryKo, String countryEn) {
        return CreateHouseRequest.builder()
                .title(title)
                .description(dec)
                .rule("뛰어다니지 마세요!")
                .houseType(houseType)
                .size(85.5f)
                .bedrooms(bedrooms)
                .bed(bedrooms != null ? bedrooms + 1 : null)
                .bathrooms(1)
                .maxGuests(maxGuests)
                .addressKo(addressKo)
                .cityKo("서울")
                .districtKo("강남구")
                .countryKo(countryKo)
                .addressEn("123 Teheran-ro, Gangnam-gu, Seoul")
                .cityEn("Seoul")
                .districtEn("Gangnam-gu")
                .countryEn(countryEn)
                .latitude(latitude)
                .longitude(longitude)
                .petsAllowed(true)
                .options(CreateHouseRequest.HouseOptionRequest.builder()
                        .hasFreeWifi(true)
                        .hasAirConditioner(true)
                        .hasTV(true)
                        .hasWashingMachine(true)
                        .hasKitchen(true)
                        .hasFreeParking(true)
                        .hasDryer(false)
                        .hasIron(false)
                        .hasRefrigerator(false)
                        .hasMicrowave(false)
                        .hasBalconyTerrace(false)
                        .hasPetsAllowed(false)
                        .hasSmokingAllowed(false)
                        .hasElevator(false)
                        .build())
                .build();
    }

    // 헬퍼 메서드들
    private User createTestUser(String userName, String email, String nickname) {
        User user = User.builder()
                .userName(userName)
                .email(email)
                .nickname(nickname)
                .userType(UserType.KAKAO)
                .role(Role.ROLE_USER)
                .build();
        return userRepository.save(user);
    }

    private House createTestHouse(User user, String title) throws IOException {
        CreateHouseRequest houseRequest = createhousebuilder(
                title,
                title + "에 대한 설명입니다.",
                HouseType.APT,
                2,
                4,
                "서울특별시 강남구 테헤란로 123",
                37.5665,
                126.9780,
                "대한민국",
                "South Korea"
        );

        CreateHouseResponse response = houseService.createHouse(user.getId(), houseRequest, testImages);
        return houseRepository.findById(response.getHouseId()).orElse(null);
    }


}