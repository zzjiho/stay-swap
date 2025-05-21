package com.stayswap.domains.house.repository;

import com.querydsl.core.QueryResults;
import com.querydsl.core.types.Order;
import com.querydsl.core.types.OrderSpecifier;
import com.querydsl.core.types.Projections;
import com.querydsl.core.types.dsl.BooleanExpression;
import com.querydsl.core.types.dsl.Expressions;
import com.querydsl.core.types.dsl.NumberExpression;
import com.querydsl.jpa.impl.JPAQueryFactory;
import com.stayswap.domains.house.model.dto.request.HouseSearchRequest;
import com.stayswap.domains.house.model.dto.response.*;
import jakarta.persistence.EntityManager;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.util.CollectionUtils;

import java.util.ArrayList;
import java.util.List;

import static com.stayswap.domains.house.model.entity.QHouse.house;
import static com.stayswap.domains.house.model.entity.QHouseImage.houseImage;
import static com.stayswap.domains.house.model.entity.QHouseOption.houseOption;
import static com.stayswap.domains.review.model.entity.QReview.review;
import static com.stayswap.domains.user.model.entity.QUser.user;
import static org.springframework.util.StringUtils.hasText;

@RequiredArgsConstructor
public class HouseRepositoryImpl implements HouseRepositoryCustom {

    private final JPAQueryFactory queryFactory;
    private final EntityManager entityManager;

    @Override
    public Page<HouseListResponse> getHouseList(HouseSearchRequest request, Pageable pageable) {
        QueryResults<HouseListResponse> results = queryFactory
                .select(Projections.constructor(
                        HouseListResponse.class,
                        house.id,
                        house.title,
                        house.houseType,
                        house.city,
                        house.district,
                        house.bedrooms,
                        house.bed,
                        house.maxGuests,
                        houseImage.imageUrl,
                        queryFactory.select(review.rating.avg().coalesce(0.0))
                                .from(review)
                                .where(review.targetHouse.id.eq(house.id))
                                .where(review.rating.isNotNull()),
                        queryFactory.select(review.count().coalesce(0L))
                                .from(review)
                                .where(review.targetHouse.id.eq(house.id))
                ))
                .from(house)
                .leftJoin(house.houseOption, houseOption)
                .leftJoin(houseImage).on(houseImage.house.id.eq(house.id))
                .where(
                        wholeKeyword(request.getKeyword()),
                        cityEq(request.getCity()),
                        houseTypeEq(request.getHouseType()),
                        amenitiesContains(request.getAmenities()),
                        isActive(),
                        isMainImage()
                )
                .offset(pageable.getOffset())
                .limit(pageable.getPageSize())
                .orderBy(getOrderSpecifier(pageable, request.getSortBy()))
                .fetchResults();

        List<HouseListResponse> content = results.getResults();
        long total = results.getTotal();

        return new PageImpl<>(content, pageable, total);
    }

    @Override
    public HouseDetailResponse getHouseDetail(Long houseId) {
        return queryFactory
                .select(Projections.constructor(
                        HouseDetailResponse.class,
                        house.id,
                        house.title,
                        house.description,
                        house.rule,
                        house.houseType,
                        house.size,
                        house.bedrooms,
                        house.bed,
                        house.bathrooms,
                        house.maxGuests,
                        house.city,
                        house.district,
                        house.petsAllowed,
                        // 평점
                        queryFactory.select(review.rating.avg().coalesce(0.0))
                                .from(review)
                                .where(review.targetHouse.id.eq(house.id))
                                .where(review.rating.isNotNull()),
                        // 리뷰 수
                        queryFactory.select(review.count().coalesce(0L))
                                .from(review)
                                .where(review.targetHouse.id.eq(house.id)),
                        house.user.id,
                        // 편의시설 - 순서 수정
                        Projections.constructor(
                                HouseDetailResponse.AmenityInfo.class,
                                houseOption.hasFreeWifi,
                                houseOption.hasAirConditioner,
                                houseOption.hasTV,
                                houseOption.hasWashingMachine,
                                houseOption.hasKitchen,
                                houseOption.hasDryer,
                                houseOption.hasIron,
                                houseOption.hasRefrigerator,
                                houseOption.hasMicrowave,
                                houseOption.hasFreeParking,
                                houseOption.hasBalconyTerrace,
                                houseOption.hasPetsAllowed,
                                houseOption.hasSmokingAllowed,
                                houseOption.hasElevator,
                                houseOption.otherAmenities,
                                houseOption.otherFeatures
                        )
                ))
                .from(house)
                .join(house.user, user)
                .join(house.houseOption, houseOption)
                .where(house.id.eq(houseId)
                        .and(house.isDelete.isFalse()))
                .fetchOne();
    }

    @Override
    public Long getHostIdByHouseId(Long houseId) {
        return queryFactory
            .select(house.user.id)
            .from(house)
            .where(house.id.eq(houseId))
            .fetchOne();
    }

    @Override
    public HostDetailResponse getHostDetailById(Long hostId) {
        // 리뷰
        NumberExpression<Long> reviewCount = Expressions.numberTemplate(Long.class,
                "COALESCE({0}, 0)", 
                queryFactory
                    .select(review.count())
                    .from(review)
                    .join(house).on(review.targetHouse.id.eq(house.id))
                    .where(house.user.id.eq(hostId)));
        // 평점
        NumberExpression<Double> avgRating = Expressions.numberTemplate(Double.class, 
                "COALESCE({0}, 0.0)", 
                queryFactory
                    .select(review.rating.avg())
                    .from(review)
                    .join(house).on(review.targetHouse.id.eq(house.id))
                    .where(house.user.id.eq(hostId))
                    .where(review.rating.isNotNull()));

        // 호스트 정보 조회
        return queryFactory
            .select(Projections.constructor(
                HostDetailResponse.class,
                user.id,
                user.nickname,
                user.profile,
                user.regTime.year(),
                reviewCount,
                avgRating
            ))
            .from(user)
            .where(user.id.eq(hostId))
            .fetchOne();
    }

    @Override
    public List<HouseImageResponse> getHouseImages(Long houseId) {
        return queryFactory
                .select(Projections.constructor(
                        HouseImageResponse.class,
                        houseImage.id,
                        houseImage.imageUrl,
                        houseImage.house.id
                ))
                .from(houseImage)
                .where(houseImage.house.id.eq(houseId))
                .fetch();
    }

    @Override
    public Page<MyHouseResponse> getMyHouses(Long userId, Pageable pageable) {
        QueryResults<MyHouseResponse> results = queryFactory
                .select(Projections.constructor(
                        MyHouseResponse.class,
                        house.id,
                        house.title,
                        houseImage.imageUrl,
                        queryFactory.select(review.rating.avg().coalesce(0.0))
                                .from(review)
                                .where(review.targetHouse.id.eq(house.id))
                                .where(review.rating.isNotNull()),
                        queryFactory.select(review.count().coalesce(0L))
                                .from(review)
                                .where(review.targetHouse.id.eq(house.id)),
                        house.regTime
                ))
                .from(house)
                .leftJoin(houseImage).on(houseImage.house.id.eq(house.id))
                .where(
                        house.user.id.eq(userId),
                        house.isDelete.isFalse(),
                        isMainImage()
                )
                .offset(pageable.getOffset())
                .limit(pageable.getPageSize())
                .orderBy(house.updateTime.desc())
                .fetchResults();

        List<MyHouseResponse> content = results.getResults();
        long total = results.getTotal();

        return new PageImpl<>(content, pageable, total);
    }

    /**
     * 검색 조건
     */
    private BooleanExpression wholeKeyword(String keyword) {
        return hasText(keyword) ? house.title.containsIgnoreCase(keyword)
                .or(house.description.containsIgnoreCase(keyword))
                .or(house.address.containsIgnoreCase(keyword))
                .or(house.city.containsIgnoreCase(keyword))
                .or(house.district.containsIgnoreCase(keyword))
                : null;
    }

    private BooleanExpression cityEq(String city) {
        return hasText(city) ? house.city.eq(city) : null;
    }

    private BooleanExpression houseTypeEq(com.stayswap.domains.house.constant.HouseType houseType) {
        return houseType != null ? house.houseType.eq(houseType) : null;
    }

    private BooleanExpression isActive() {
        return house.isActive.isTrue().and(house.isDelete.isFalse());
    }

    private BooleanExpression isMainImage() {
        return houseImage.id.in(
                queryFactory.select(houseImage.id.min())
                        .from(houseImage)
                        .where(houseImage.house.id.eq(house.id))
                        .groupBy(houseImage.house.id)
        );
    }

    private BooleanExpression amenitiesContains(List<String> amenities) {
        if (CollectionUtils.isEmpty(amenities)) {
            return null;
        }

        BooleanExpression expression = null;

        for (String amenity : amenities) {
            BooleanExpression condition = null;

            switch (amenity) {
                case "WIFI":
                    condition = houseOption.hasFreeWifi.isTrue();
                    break;
                case "AIRCON":
                    condition = houseOption.hasAirConditioner.isTrue();
                    break;
                case "KITCHEN":
                    condition = houseOption.hasKitchen.isTrue();
                    break;
                case "WASHER":
                    condition = houseOption.hasWashingMachine.isTrue();
                    break;
                case "PARKING":
                    condition = houseOption.hasFreeParking.isTrue();
                    break;
                case "PETS":
                    condition = houseOption.hasPetsAllowed.isTrue();
                    break;
                case "TV":
                    condition = houseOption.hasTV.isTrue();
                    break;
            }

            // 각 조건을 expression에 and 연산으로 추가
            if (condition != null) {
                expression = (expression == null) ? condition : expression.and(condition);
            }
        }

        return expression;
    }

    private OrderSpecifier<?>[] getOrderSpecifier(Pageable pageable, String sortBy) {
        List<OrderSpecifier<?>> orderSpecifiers = new ArrayList<>();

        // 페이지 정렬 조건 적용
        if (pageable.getSort().isSorted()) {
            for (Sort.Order order : pageable.getSort()) {
                Order direction = order.isAscending() ? Order.ASC : Order.DESC;

                switch (order.getProperty()) {
                    case "houseId":
                        orderSpecifiers.add(new OrderSpecifier<>(direction, house.id));
                        break;
                    case "title":
                        orderSpecifiers.add(new OrderSpecifier<>(direction, house.title));
                        break;
                    case "city":
                        orderSpecifiers.add(new OrderSpecifier<>(direction, house.city));
                        break;
                }
            }
        }
        // 요청 파라미터 정렬 조건 적용
        else if (sortBy != null) {
            switch (sortBy) {
                case "price_low":
                    orderSpecifiers.add(new OrderSpecifier<>(Order.ASC, house.id)); // todo: 아직 가격 어떻게 할지 모름
                    break;
                case "price_high":
                    orderSpecifiers.add(new OrderSpecifier<>(Order.DESC, house.id));
                    break;
                case "rating":
                    orderSpecifiers.add(new OrderSpecifier<>(Order.DESC,
                        queryFactory.select(review.rating.avg())
                            .from(review)
                            .where(review.targetHouse.id.eq(house.id))
                            .where(review.rating.isNotNull())));
                    break;
                case "review_count":
                    orderSpecifiers.add(new OrderSpecifier<>(Order.DESC,
                        queryFactory.select(review.count())
                            .from(review)
                            .where(review.targetHouse.id.eq(house.id))));
                    break;
                default:
                    orderSpecifiers.add(new OrderSpecifier<>(Order.DESC, house.id));
                    break;
            }
        } else {
            // 기본 정렬: 리뷰순
            orderSpecifiers.add(new OrderSpecifier<>(Order.DESC,
                queryFactory.select(review.count())
                    .from(review)
                    .where(review.targetHouse.id.eq(house.id))));
        }

        return orderSpecifiers.toArray(new OrderSpecifier[0]);
    }
}