package com.stayswap.review.repository;

import com.querydsl.core.types.Projections;
import com.querydsl.core.types.dsl.BooleanExpression;
import com.querydsl.jpa.impl.JPAQueryFactory;
import com.stayswap.review.model.dto.response.ReceivedReviewResponse;
import com.stayswap.review.model.dto.response.WrittenReviewResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Slice;
import org.springframework.data.domain.SliceImpl;

import java.util.List;

import static com.stayswap.house.model.entity.QHouse.house;
import static com.stayswap.house.model.entity.QHouseImage.houseImage;
import static com.stayswap.review.model.entity.QReview.review;
import static com.stayswap.user.model.entity.QUser.user;


@RequiredArgsConstructor
public class ReviewRepositoryCustomImpl implements ReviewRepositoryCustom {

    private final JPAQueryFactory queryFactory;

    @Override
    public Slice<WrittenReviewResponse> findWrittenReviewsWithQueryDsl(Long userId, Pageable pageable) {
        List<WrittenReviewResponse> content = queryFactory
                .select(Projections.constructor(
                        WrittenReviewResponse.class,
                        review.id,
                        review.targetHouse.id,
                        review.targetHouse.title.as("houseTitle"),
                        houseImage.imageUrl.as("houseImage"),
                        review.rating,
                        review.comment,
                        review.regTime.as("createdDate"),
                        review.user.profile.as("userProfile")
                ))
                .from(review)
                .innerJoin(review.targetHouse, house)
                .leftJoin(houseImage).on(houseImage.house.id.eq(review.targetHouse.id))
                .where(
                        review.user.id.eq(userId),
                        isMainImage()
                )
                .offset(pageable.getOffset())
                .limit(pageable.getPageSize() + 1)
                .orderBy(review.regTime.desc())
                .fetch();

        boolean hasNext = false;
        if (content.size() > pageable.getPageSize()) {
            content.remove(content.size() - 1);
            hasNext = true;
        }

        return new SliceImpl<>(content, pageable, hasNext);
    }
    
    @Override
    public Slice<ReceivedReviewResponse> findReceivedReviewsWithQueryDsl(Long userId, Pageable pageable) {
        List<ReceivedReviewResponse> content = queryFactory
                .select(Projections.constructor(
                        ReceivedReviewResponse.class,
                        review.id,
                        review.user.id,
                        review.user.nickname.as("reviewerNickname"),
                        review.user.profile.as("reviewerProfile"),
                        review.rating,
                        review.comment,
                        review.regTime.as("createdDate"),
                        review.targetHouse.title.as("houseTitle"),
                        review.targetHouse.id.stringValue().as("houseId")
                ))
                .from(review)
                .innerJoin(review.targetHouse, house)
                .innerJoin(review.user, user)
                .leftJoin(houseImage).on(houseImage.house.id.eq(review.targetHouse.id))
                .where(
                        house.user.id.eq(userId),
                        isMainImage()
                )
                .offset(pageable.getOffset())
                .limit(pageable.getPageSize() + 1)
                .orderBy(review.regTime.desc())
                .fetch();

        boolean hasNext = false;
        if (content.size() > pageable.getPageSize()) {
            content.remove(content.size() - 1);
            hasNext = true;
        }

        return new SliceImpl<>(content, pageable, hasNext);
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