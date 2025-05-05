package com.stayswap.domains.review.controller;

import com.stayswap.domains.review.model.dto.request.ReviewRequest;
import com.stayswap.domains.review.model.dto.response.ReviewResponse;
import com.stayswap.domains.review.service.ReviewService;
import com.stayswap.global.model.RestApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
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
} 