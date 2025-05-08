package com.stayswap.global.config;

import com.stayswap.global.interceptor.AuthenticationInterceptor;
import com.stayswap.resolver.UserInfoArgumentResolver;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.web.method.support.HandlerMethodArgumentResolver;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.util.List;

@Configuration
@RequiredArgsConstructor
public class WebConfig implements WebMvcConfigurer {

    private final AuthenticationInterceptor authenticationInterceptor;
    private final UserInfoArgumentResolver userInfoArgumentResolver;

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("*") //허용할 url
                .allowedOrigins("*") // *: 모든 origin 허용
                .allowedMethods(
                        HttpMethod.GET.name(),
                        HttpMethod.POST.name(),
                        HttpMethod.PUT.name(),
                        HttpMethod.PATCH.name(),
                        HttpMethod.DELETE.name(),
                        HttpMethod.OPTIONS.name()
                )
                .maxAge(3600);
    }

    @Override
    public void addInterceptors(InterceptorRegistry registry) {

        registry.addInterceptor(authenticationInterceptor)
                .order(1) // interceptor 동작 순위 지정
                .addPathPatterns("/api/**") // api로 시작하는 모든 요청에 대해 인증 인터셉터 수행
                .excludePathPatterns( // 인증이 필요 없는 url
                        "/api/oauth/login",
                        "/api/logout",
                        "/api/access-token/issue",
                        "/v3/api-docs/**",
                        "/api/health-check");

    }

    @Override
    public void addArgumentResolvers(List<HandlerMethodArgumentResolver> resolvers) {
        resolvers.add(userInfoArgumentResolver);
    }

}
