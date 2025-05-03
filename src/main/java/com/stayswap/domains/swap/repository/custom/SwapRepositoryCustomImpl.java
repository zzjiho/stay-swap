package com.stayswap.domains.swap.repository.custom;

import com.querydsl.core.QueryResults;
import com.querydsl.core.types.Projections;
import com.querydsl.core.types.dsl.BooleanExpression;
import com.querydsl.jpa.impl.JPAQueryFactory;
import com.stayswap.domains.swap.constant.SwapStatus;
import com.stayswap.domains.swap.constant.SwapType;
import com.stayswap.domains.swap.model.dto.request.SwapSearchRequest;
import com.stayswap.domains.swap.model.dto.response.SwapListResponse;
import com.stayswap.domains.swap.model.entity.QSwap;
import com.stayswap.domains.swap.model.entity.Swap;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;

import java.util.List;

import static com.stayswap.domains.swap.model.entity.QSwap.swap;

@RequiredArgsConstructor
public class SwapRepositoryCustomImpl implements SwapRepositoryCustom {

    private final JPAQueryFactory queryFactory;
    
    @Override
    public Page<SwapListResponse> getSwapListByRequester(SwapSearchRequest request, Pageable pageable) {
        QueryResults<Swap> queryResults = queryFactory
                .selectFrom(swap)
                .where(
                    requesterIdEq(request.getUserId()),
                    statusEq(request.getSwapStatus()),
                    typeEq(request.getSwapType())
                )
                .orderBy(swap.id.desc())
                .offset(pageable.getOffset())
                .limit(pageable.getPageSize())
                .fetchResults();
        
        List<SwapListResponse> content = queryResults.getResults().stream()
                .map(SwapListResponse::of)
                .toList();
        
        return new PageImpl<>(content, pageable, queryResults.getTotal());
    }
    
    @Override
    public Page<SwapListResponse> getSwapListByHost(SwapSearchRequest request, Pageable pageable) {
        QueryResults<Swap> queryResults = queryFactory
                .selectFrom(swap)
                .leftJoin(swap.house).fetchJoin()
                .where(
                    hostIdEq(request.getUserId()),
                    statusEq(request.getSwapStatus()),
                    typeEq(request.getSwapType())
                )
                .orderBy(swap.id.desc())
                .offset(pageable.getOffset())
                .limit(pageable.getPageSize())
                .fetchResults();
        
        List<SwapListResponse> content = queryResults.getResults().stream()
                .map(SwapListResponse::of)
                .toList();
        
        return new PageImpl<>(content, pageable, queryResults.getTotal());
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