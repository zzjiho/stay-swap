package com.stayswap.swap.repository.custom;

import com.querydsl.core.types.Projections;
import com.querydsl.core.types.dsl.BooleanExpression;
import com.querydsl.jpa.JPAExpressions;
import com.querydsl.jpa.impl.JPAQueryFactory;
import com.stayswap.swap.constant.SwapStatus;
import com.stayswap.swap.constant.SwapType;
import com.stayswap.swap.model.dto.response.SwapListResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Slice;
import org.springframework.data.domain.SliceImpl;

import java.util.List;

@RequiredArgsConstructor
public class SwapRepositoryCustomImpl implements SwapRepositoryCustom {

    private final JPAQueryFactory queryFactory;

    @Override
    public Slice<SwapListResponse> getSwapListByRequester(Long userId, SwapStatus swapStatus, SwapType swapType, Pageable pageable) {
        List<SwapListResponse> content = queryFactory
                .select(Projections.constructor(
                        SwapListResponse.class,
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
                                .where(houseImage.house.eq(house))
                ))
                .from(swap)
                .join(swap.house, house)
                .where(
                        requesterIdEq(userId),
                        statusEq(swapStatus),
                        typeEq(swapType)
                )
                .orderBy(swap.id.desc())
                .offset(pageable.getOffset())
                .limit(pageable.getPageSize() + 1)
                .fetch();

        return checkLastPage(pageable, content);
    }

    @Override
    public Slice<SwapListResponse> getSwapListByHost(Long userId, SwapStatus swapStatus, SwapType swapType, Pageable pageable) {
        List<SwapListResponse> content = queryFactory
                .select(Projections.constructor(
                        SwapListResponse.class,
                        swap.id.as("swapId"),
                        swap.requester.id.as("requesterId"),
                        swap.startDate,
                        swap.endDate,
                        swap.swapType,
                        swap.swapStatus,
                        swap.message,
                        swap.responseAt,
                        swap.house.id.as("hostHouseId"),
                        swap.house.title.as("houseTitle"),
                        house.id.as("requesterHouseId"),
                        house.houseType,
                        JPAExpressions
                                .select(houseImage.imageUrl.min())
                                .from(houseImage)
                                .where(houseImage.house.eq(swap.house))
                ))
                .from(swap)
                .join(swap.house).on(swap.house.user.id.eq(userId))
                .leftJoin(house).on(house.eq(swap.requesterHouseId))
                .where(
                        statusEq(swapStatus),
                        typeEq(swapType)
                )
                .orderBy(swap.id.desc())
                .offset(pageable.getOffset())
                .limit(pageable.getPageSize() + 1)
                .fetch();

        return checkLastPage(pageable, content);
    }

    private Slice<SwapListResponse> checkLastPage(Pageable pageable, List<SwapListResponse> results) {
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
}