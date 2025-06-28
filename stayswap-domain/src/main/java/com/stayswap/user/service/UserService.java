package com.stayswap.user.service;

import com.stayswap.error.exception.AuthenticationException;
import com.stayswap.error.exception.BusinessException;
import com.stayswap.error.exception.ForbiddenException;
import com.stayswap.error.exception.NotFoundException;
import com.stayswap.review.repository.ReviewRepository;
import com.stayswap.user.model.dto.request.UpdateIntroductionRequest;
import com.stayswap.user.model.dto.request.UpdateNicknameRequest;
import com.stayswap.user.model.dto.response.*;
import com.stayswap.user.model.entity.User;
import com.stayswap.user.repository.UserRepository;
import com.stayswap.user.repository.nickname.GenerateRandomNicknameRepository;
import com.stayswap.util.FileUploadUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.Optional;

import static com.stayswap.code.ErrorCode.*;

@Slf4j
@Service
@Transactional
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final GenerateRandomNicknameRepository nicknameRepository;
    private final ReviewRepository reviewRepository;
    private final FileUploadUtil fileUploadUtil;

    /**
     * 회원가입
     */
    public User registerUser(User user) {
        validateDuplicateUser(user);
        return userRepository.save(user);
    }

    /**
     * 회원 중복 검사
     */
    @Transactional(readOnly = true)
    public void validateDuplicateUser(User user) {
        Optional<User> optionalUser = userRepository.findByEmail(user.getEmail());

        if (optionalUser.isPresent()) {
            throw new BusinessException(ALREADY_REGISTERED_USER);
        }
    }

    /**
     * 이메일로 회원 찾기
     */
    @Transactional(readOnly = true)
    public Optional<User> findUserByEmail(String email) {
        return userRepository.findByEmail(email);
    }

    /**
     * 랜덤 닉네임 생성
     */
    public String generateRandomNickname() {
        while (true) {
            String nickname = nicknameRepository.generate();
            if (!userRepository.existsByNickname(nickname)) {
                return nickname;
            }
        }
    }

    /**
     * 사용자 정보 조회
     */
    @Transactional(readOnly = true)
    public UserInfoResponse getUserInfo(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new NotFoundException(NOT_EXISTS_USER));
        
        Integer joinYear = user.getRegTime().getYear();
        
        Long reviewCount = reviewRepository.countByTargetHouseUserId(userId);
        
        return UserInfoResponse.from(user, joinYear, reviewCount);
    }

    /**
     * 사용자 닉네임 조회
     */
    @Transactional(readOnly = true)
    public GetNicknameResponse getNickname(Long userId) {

        User user = userRepository.findNicknameAndProfileById(userId)
            .orElseThrow(() -> new NotFoundException(NOT_EXISTS_USER));

        return GetNicknameResponse.of(user);
    }

    /**
     * 사용자 닉네임 수정
     */
    public UpdateNicknameResponse updateNickname(UpdateNicknameRequest request, Long userId) {

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new NotFoundException(NOT_EXISTS_USER));

        if (!user.getId().equals(userId)) {
            throw new ForbiddenException(NOT_MY_NICKNAME);
        }

        if (userRepository.existsByNickname(request.getNickname())) {
            throw new BusinessException(ALREADY_EXISTED_NICKNAME);
        }

        user.updateNickname(request.getNickname());

        return UpdateNicknameResponse.of(user.getNickname());
    }

    /**
     * accessToken 재발급
     */
    @Transactional(readOnly = true)
    public User findUserByRefreshToken(String refreshToken) {
        User user = userRepository.findByRefreshToken(refreshToken)
            .orElseThrow(() -> new AuthenticationException(NOT_FOUND_REFRESH_TOKEN));

        LocalDateTime tokenExpireTime = user.getTokenExpirationTime();
        if (tokenExpireTime.isBefore(LocalDateTime.now())) {
            throw new AuthenticationException(REFRESH_TOKEN_EXPIRED);
        }

        return user;
    }

    /**
     * 로그아웃
     */
    public LogoutResponse logout(Long userId) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new NotFoundException(NOT_EXISTS_USER));

        LocalDateTime now = LocalDateTime.now();

        user.updateRefreshTokenNow(now);

        return LogoutResponse.of(user);
    }

    /**
     * 사용자 소개 수정
     */
    public UpdateIntroductionResponse updateIntroduction(UpdateIntroductionRequest request, Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new NotFoundException(NOT_EXISTS_USER));

        if (!user.getId().equals(userId)) {
            throw new ForbiddenException(NOT_MY_INTRODUCTION);
        }

        user.updateIntroduction(request.getIntroduction());

        return UpdateIntroductionResponse.from(user.getIntroduction());
    }

    /**
     * 사용자 프로필 이미지 수정
     */
    public UpdateProfileImageResponse updateProfileImage(MultipartFile profileImage, Long userId) throws IOException {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new NotFoundException(NOT_EXISTS_USER));

        if (!user.getId().equals(userId)) {
            throw new ForbiddenException(NOT_MY_PROFILE);
        }

        // 기존 프로필 이미지가 S3에 저장된 것이라면 삭제
        String oldProfile = user.getProfile();
        if (oldProfile != null && oldProfile.contains("amazonaws.com")) {
            try {
                // S3 URL에서 파일 경로 추출
                String filePath = oldProfile.substring(oldProfile.indexOf(".com/") + 5);
                fileUploadUtil.deleteFile(filePath);
            } catch (Exception e) {
                log.warn("기존 프로필 이미지 삭제 실패: {}", e.getMessage());
            }
        }

        var uploadResponse = fileUploadUtil.uploadFile("profile", profileImage);
        
        user.updateProfile(uploadResponse.getFileUrl());

        return UpdateProfileImageResponse.of(uploadResponse.getFileUrl());
    }
}
