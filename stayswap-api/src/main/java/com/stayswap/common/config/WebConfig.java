package com.stayswap.common.config;

import com.stayswap.common.resolver.UserInfoArgumentResolver;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.env.Environment;
import org.springframework.http.HttpMethod;
import org.springframework.web.method.support.HandlerMethodArgumentResolver;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.util.Arrays;
import java.util.List;

@Configuration
@RequiredArgsConstructor
public class WebConfig implements WebMvcConfigurer {

    private final UserInfoArgumentResolver userInfoArgumentResolver;
    private final Environment environment;

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        // 프로필에 따라 허용할 도메인 결정
        String[] activeProfiles = environment.getActiveProfiles();
        boolean isProduction = Arrays.stream(activeProfiles)
                .anyMatch(profile -> profile.equals("prod") || profile.equals("prd"));

        String[] allowedOrigins;
        if (isProduction) {
            allowedOrigins = new String[]{
                    "https://stayzzle.com",
                    "https://www.stayzzle.com"
            };
        } else {
            // 개발 환경에서는 로컬호스트와 개발 서버 허용
            allowedOrigins = new String[]{
                    "http://localhost:8080",
                    "http://127.0.0.1:8080",
                    "https://dev.stayswap.com",
                    "https://stayzzle.com",
                    "https://www.stayzzle.com"
            };
        }

        registry.addMapping("/**") // 모든 경로에 대해 CORS 설정 적용
                .allowedOrigins(allowedOrigins)
                .allowedMethods(
                        HttpMethod.GET.name(),
                        HttpMethod.POST.name(),
                        HttpMethod.PUT.name(),
                        HttpMethod.PATCH.name(),
                        HttpMethod.DELETE.name(),
                        HttpMethod.OPTIONS.name()
                )
                .allowedHeaders("*") // 모든 헤더 허용
                .allowCredentials(true) // 인증 정보 허용
                .maxAge(3600); // 1시간 동안 preflight 요청 캐시
    }

    @Override
    public void addArgumentResolvers(List<HandlerMethodArgumentResolver> resolvers) {
        resolvers.add(userInfoArgumentResolver);
    }

}
