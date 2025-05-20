package com.stayswap.domains.review.repository;

import com.querydsl.core.QueryResults;
import com.querydsl.core.types.Projections;
import com.querydsl.core.types.dsl.BooleanExpression;
import com.querydsl.jpa.impl.JPAQueryFactory;
import com.stayswap.domains.review.model.dto.response.WrittenReviewResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;

import java.util.List;

import static com.stayswap.domains.house.model.entity.QHouse.house;
import static com.stayswap.domains.house.model.entity.QHouseImage.houseImage;
import static com.stayswap.domains.review.model.entity.QReview.review;

@RequiredArgsConstructor
public class ReviewRepositoryCustomImpl implements ReviewRepositoryCustom {

    private final JPAQueryFactory queryFactory;

    @Override
    public Page<WrittenReviewResponse> findWrittenReviewsWithQueryDsl(Long userId, Pageable pageable) {
        QueryResults<WrittenReviewResponse> results = queryFactory
                .select(Projections.constructor(
                        WrittenReviewResponse.class,
                        review.id,
                        review.targetHouse.id,
                        review.targetHouse.title,
                        houseImage.imageUrl,
                        review.rating,
                        review.comment,
                        review.regTime
                ))
                .from(review)
                .innerJoin(review.targetHouse, house)
                .leftJoin(houseImage).on(houseImage.house.id.eq(review.targetHouse.id))
                .where(
                        review.user.id.eq(userId),
                        isMainImage()
                )
                .offset(pageable.getOffset())
                .limit(pageable.getPageSize())
                .orderBy(review.regTime.desc())
                .fetchResults();

        List<WrittenReviewResponse> content = results.getResults();
        long total = results.getTotal();

        return new PageImpl<>(content, pageable, total);
    }
    
    /**
     * 대표 이미지 여부 (첫 번째 이미지)
     */
    private BooleanExpression isMainImage() {
        return houseImage.id.in(
                queryFactory
                        .select(houseImage.id.min())
                        .from(houseImage)
                        .groupBy(houseImage.house.id)
        );
    }
} 