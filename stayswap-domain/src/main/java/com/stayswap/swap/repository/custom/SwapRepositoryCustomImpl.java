package com.stayswap.swap.repository.custom;

import com.querydsl.core.types.Projections;
import com.querydsl.core.types.dsl.BooleanExpression;
import com.querydsl.jpa.JPAExpressions;
import com.querydsl.jpa.impl.JPAQueryFactory;
import com.stayswap.swap.constant.SwapStatus;
import com.stayswap.swap.constant.SwapType;
import com.stayswap.swap.model.dto.response.SwapListForGuestResponse;
import com.stayswap.swap.model.dto.response.SwapListForHostResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Slice;
import org.springframework.data.domain.SliceImpl;

import java.util.List;

import static com.stayswap.house.model.entity.QHouse.house;
import static com.stayswap.house.model.entity.QHouseImage.houseImage;
import static com.stayswap.review.model.entity.QReview.review;
import static com.stayswap.swap.model.entity.QSwap.swap;

@RequiredArgsConstructor
public class SwapRepositoryCustomImpl implements SwapRepositoryCustom {

    private final JPAQueryFactory queryFactory;

    @Override
    public Slice<SwapListForGuestResponse> getSwapListByRequester(Long userId, SwapStatus swapStatus, SwapType swapType, Pageable pageable) {
        List<SwapListForGuestResponse> content = queryFactory
                .select(Projections.constructor(
                        SwapListForGuestResponse.class,
                        swap.id.as("swapId"),
                        swap.requester.id.as("requesterId"),
                        swap.startDate,
                        swap.endDate,
                        swap.swapType,
                        swap.swapStatus,
                        swap.message,
                        swap.responseAt,
                        swap.house.id.as("hostHouseId"),
                        house.title.as("houseTitle"),
                        swap.requesterHouseId.id.as("requesterHouseId"),
                        house.houseType,
                        JPAExpressions
                                .select(houseImage.imageUrl.min())
                                .from(houseImage)
                                .where(houseImage.house.eq(house)),
                        JPAExpressions
                                .selectOne()
                                .from(review)
                                .where(review.swap.eq(swap)
                                        .and(review.user.id.eq(userId))
                                        .and(review.targetHouse.eq(swap.house)))
                                .exists()
                ))
                .from(swap)
                .join(swap.house, house)
                .where(
                        requesterIdEq(userId),
                        statusEq(swapStatus),
                        typeEq(swapType),
                        notCanceled()
                )
                .orderBy(swap.id.desc())
                .offset(pageable.getOffset())
                .limit(pageable.getPageSize() + 1)
                .fetch();

        return checkLastPage(pageable, content);
    }

    @Override
    public Slice<SwapListForHostResponse> getSwapListByHost(Long userId, SwapStatus swapStatus, SwapType swapType, Pageable pageable) {
        List<SwapListForHostResponse> content = queryFactory
                .select(Projections.constructor(
                        SwapListForHostResponse.class,
                        swap.id.as("swapId"),
                        swap.requester.id.as("requesterId"),
                        swap.requester.nickname.as("requesterName"),
                        swap.startDate,
                        swap.endDate,
                        swap.swapType,
                        swap.swapStatus,
                        swap.message,
                        swap.responseAt,
                        swap.house.id.as("hostHouseId"),
                        swap.house.title.as("houseTitle"),
                        swap.requesterHouseId.id.as("requesterHouseId"),
//                        swap.requesterHouseId.title.as("requesterHouseTitle"),
                        swap.house.houseType,
                        JPAExpressions
                                .select(houseImage.imageUrl.min())
                                .from(houseImage)
                                .where(houseImage.house.eq(swap.house)),
                        JPAExpressions
                                .selectOne()
                                .from(review)
                                .where(review.swap.eq(swap)
                                        .and(review.user.id.eq(userId))
                                        .and(swap.swapType.eq(SwapType.SWAP))
                                        .and(review.targetHouse.eq(swap.requesterHouseId)))
                                .exists()
                ))
                .from(swap)
                .join(swap.house).on(swap.house.user.id.eq(userId))
                .leftJoin(house).on(house.eq(swap.requesterHouseId))
                .where(
                        statusEq(swapStatus),
                        typeEq(swapType),
                        notCanceled()
                )
                .orderBy(swap.id.desc())
                .offset(pageable.getOffset())
                .limit(pageable.getPageSize() + 1)
                .fetch();

        return checkLastPage(pageable, content);
    }

    private <T> Slice<T> checkLastPage(Pageable pageable, List<T> results) {
        boolean hasNext = false;

        if (results.size() > pageable.getPageSize()) {
            hasNext = true;
            results.remove(pageable.getPageSize());
        }

        return new SliceImpl<>(results, pageable, hasNext);
    }

    private BooleanExpression requesterIdEq(Long requesterId) {
        return requesterId != null ? swap.requester.id.eq(requesterId) : null;
    }

    private BooleanExpression hostIdEq(Long userId) {
        return userId != null ? swap.house.user.id.eq(userId) : null;
    }

    private BooleanExpression statusEq(SwapStatus status) {
        return status != null ? swap.swapStatus.eq(status) : null;
    }

    private BooleanExpression typeEq(SwapType type) {
        return type != null ? swap.swapType.eq(type) : null;
    }

    private BooleanExpression notCanceled() {
        return swap.swapStatus.ne(SwapStatus.CANCELED);
    }
}