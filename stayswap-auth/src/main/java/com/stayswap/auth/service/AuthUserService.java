package com.stayswap.auth.service;

import com.stayswap.jwt.constant.Role;
import com.stayswap.user.constant.UserType;
import com.stayswap.user.model.entity.User;
import com.stayswap.user.repository.UserRepository;
import com.stayswap.user.repository.nickname.GenerateRandomNicknameRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

@Service
@Transactional
@RequiredArgsConstructor
@Slf4j
public class AuthUserService {

    private final UserRepository userRepository;
    private final GenerateRandomNicknameRepository nicknameRepository;

    /**
     * 소셜 로그인 사용자 생성
     */
    public User createSocialUser(String email, String userName, String profile) {
        log.info("Creating social user: email={}, nickname={}", email, userName);
        
        User newUser = User.builder()
                .email(email)
                .userName(userName)
                .nickname(generateRandomNickname())
                .profile(profile)
                .userType(UserType.KAKAO)
                .role(Role.ROLE_USER)
                .pushNotificationYN(true)
                .build();
        
        User savedUser = userRepository.save(newUser);
        log.info("Social user created successfully: userId={}", savedUser.getId());
        
        return savedUser;
    }

    /**
     * 사용자 ID로 조회
     */
    @Transactional(readOnly = true)
    public Optional<User> findById(Long id) {
        return userRepository.findById(id);
    }

    /**
     * 랜덤 닉네임 생성
     */
    private String generateRandomNickname() {
        while (true) {
            String nickname = nicknameRepository.generate();
            if (!userRepository.existsByNickname(nickname)) {
                return nickname;
            }
        }
    }
}