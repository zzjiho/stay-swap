package com.stayswap.user.controller;

import com.stayswap.model.RestApiResponse;
import com.stayswap.user.model.dto.request.UpdateIntroductionRequest;
import com.stayswap.user.model.dto.request.UpdateNicknameRequest;
import com.stayswap.user.model.dto.response.*;
import com.stayswap.user.service.UserService;
import com.stayswap.common.resolver.userinfo.UserInfo;
import com.stayswap.common.resolver.userinfo.UserInfoDto;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/user")
@Tag(name = "user", description = "사용자 API")
public class UserController {

    private final UserService userService;

    @Operation(
            summary = "사용자 정보 조회 API",
            description = "현재 로그인한 사용자의 정보를 조회합니다."
    )
    @GetMapping("/me")
    public RestApiResponse<UserInfoResponse> getUserInfo(
            @UserInfo UserInfoDto userInfo) {

        return RestApiResponse.success(
                userService.getUserInfo(userInfo.getUserId()));
    }

    @Operation(
            summary = "사용자 닉네임, 프로필 사진 조회 API",
            description = "사용자 닉네임, 프로필 사진을 조회합니다."
    )
    @GetMapping("")
    public RestApiResponse<GetNicknameResponse> getNickname(
            @UserInfo UserInfoDto userInfo) {

        return RestApiResponse.success(
                userService.getNickname(userInfo.getUserId()));
    }

    @Operation(
            summary = "사용자 닉네임 수정 API",
            description = "사용자 닉네임을 수정합니다."
    )
    @PostMapping("")
    public RestApiResponse<UpdateNicknameResponse> updateNickName(
            @RequestBody @Valid UpdateNicknameRequest request,
            @UserInfo UserInfoDto userInfo) {

        return RestApiResponse.success(
                userService.updateNickname(request, userInfo.getUserId()));
    }

    @Operation(
            summary = "사용자 소개 수정 API",
            description = "사용자 소개를 수정합니다."
    )
    @PostMapping("/introduction")
    public RestApiResponse<UpdateIntroductionResponse> updateIntroduction(
            @RequestBody @Valid UpdateIntroductionRequest request,
            @UserInfo UserInfoDto userInfo) {

        return RestApiResponse.success(
                userService.updateIntroduction(request, userInfo.getUserId()));
    }

    @Operation(
            summary = "사용자 프로필 이미지 수정 API",
            description = "사용자 프로필 이미지를 수정합니다. 기존 이미지가 S3에 저장된 경우 자동으로 삭제됩니다."
    )
    @PostMapping(value = "/profile-image", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public RestApiResponse<UpdateProfileImageResponse> updateProfileImage(
            @RequestParam("profileImage") MultipartFile profileImage,
            @UserInfo UserInfoDto userInfo) throws IOException {

        return RestApiResponse.success(
                userService.updateProfileImage(profileImage, userInfo.getUserId()));
    }

//    @Operation(
//            summary = "사용자 로그아웃 API",
//            description = "리프레시 토큰을 만료시켜 로그아웃합니다."
//    )
//    @PostMapping("/logout")
//    public RestApiResponse<LogoutResponse> logout(
//            @UserInfo UserInfoDto userInfo) {
//
//        return RestApiResponse.success(
//                userService.logout(userInfo.getUserId()));
//    }

}
