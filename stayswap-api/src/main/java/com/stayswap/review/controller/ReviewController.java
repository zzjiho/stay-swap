package com.stayswap.review.controller;

import com.stayswap.model.RestApiResponse;
import com.stayswap.common.resolver.userinfo.UserInfo;
import com.stayswap.common.resolver.userinfo.UserInfoDto;
import com.stayswap.review.model.dto.request.ReviewRequest;
import com.stayswap.review.model.dto.response.ReceivedReviewResponse;
import com.stayswap.review.model.dto.response.ReviewResponse;
import com.stayswap.review.model.dto.response.WrittenReviewResponse;
import com.stayswap.review.service.ReviewService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Slice;
import org.springframework.data.web.PageableDefault;
import org.springframework.validation.BindingResult;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
@RequestMapping("api/review")
@Tag(name = "review", description = "리뷰 API")
public class ReviewController {

    private final ReviewService reviewService;

    @Operation(
            summary = "리뷰 작성 API",
            description = "완료된(COMPLETED) 숙소 교환 또는 숙박에 대한 리뷰, 평점을 작성합니다."
    )
    @PostMapping
    public RestApiResponse<ReviewResponse> createReview(
            @RequestParam("userId") Long userId,
            @Valid @RequestBody ReviewRequest request,
            BindingResult bindingResult) {
        
        return RestApiResponse.success(reviewService.createReview(userId, request));
    }
    
    @Operation(
            summary = "내가 받은 리뷰 목록 조회 API",
            description = "내 숙소에 대해 받은 리뷰 목록을 조회합니다. 무한 스크롤 구현을 위한 페이징 기능을 제공합니다."
    )
    @GetMapping("/received")
    public RestApiResponse<Slice<ReceivedReviewResponse>> getReceivedReviews(
            @UserInfo UserInfoDto userInfo,
            @PageableDefault(size = 10) Pageable pageable) {
            
        return RestApiResponse.success(
                reviewService.getReceivedReviews(userInfo.getUserId(), pageable));
    }
    
    @Operation(
            summary = "내가 작성한 리뷰 목록 조회 API",
            description = "내가 작성한 리뷰 목록을 조회합니다. 리뷰 대상 숙소 정보(이름, 이미지)를 포함합니다. 무한 스크롤 구현을 위한 페이징 기능을 제공합니다."
    )
    @GetMapping("/written")
    public RestApiResponse<Slice<WrittenReviewResponse>> getWrittenReviews(
            @UserInfo UserInfoDto userInfo,
            @PageableDefault(size = 10) Pageable pageable) {
            
        return RestApiResponse.success(
                reviewService.getWrittenReviews(userInfo.getUserId(), pageable));
    }
} 