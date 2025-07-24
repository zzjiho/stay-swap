package com.stayswap.auth.handler;

import com.stayswap.auth.service.AuthUserService;
import com.stayswap.user.model.entity.User;
import com.stayswap.user.repository.UserRepository;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationSuccessHandler;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.util.Map;

/**
 * 로그인 성공시 사용자 정보 엔티티에 매핑 및 로그인/회원가입 처리
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class OAuth2LoginSuccessHandler extends SimpleUrlAuthenticationSuccessHandler {

    private final UserRepository userRepository;
    private final AuthUserService authUserService;

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request, HttpServletResponse response,
                                        Authentication authentication) throws IOException, ServletException {
        
        OAuth2User oauth2User = (OAuth2User) authentication.getPrincipal();
        log.debug("OAuth2User attributes: {}", oauth2User.getAttributes());
        
        // 카카오 사용자 정보 추출
        String kakaoId = oauth2User.getAttribute("id").toString();
        String email = null;
        String userName = null;
        String profileImage = null;
        
        if (oauth2User.getAttributes().containsKey("kakao_account")) {
            @SuppressWarnings("unchecked")
            Map<String, Object> kakaoAccount = (Map<String, Object>) oauth2User.getAttribute("kakao_account");
            email = (String) kakaoAccount.get("email");
            
            if (kakaoAccount.containsKey("profile")) {
                @SuppressWarnings("unchecked")
                Map<String, Object> profile = (Map<String, Object>) kakaoAccount.get("profile");
                userName = (String) profile.get("nickname");
                profileImage = (String) profile.get("thumbnail_image_url");
            }
        }

        if (email == null || email.trim().isEmpty()) {
            email = kakaoId + "@kakao.com";
        }

        final String finalEmail = email;
        final String finalUserName = userName;
        final String finalProfileImage = profileImage;
        User user = userRepository.findByEmail(finalEmail)
                .orElseGet(() -> authUserService.createSocialUser(finalEmail, finalUserName, finalProfileImage));

        log.info("Social login success for user: {} (email: {})", user.getId(), email);
        
        // 기본 성공 처리
        super.onAuthenticationSuccess(request, response, authentication);
    }
}