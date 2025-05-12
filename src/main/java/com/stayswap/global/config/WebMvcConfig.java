package com.stayswap.global.config;

import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;
import org.springframework.web.servlet.ModelAndView;
import org.springframework.web.servlet.HandlerInterceptor;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

@Configuration
@RequiredArgsConstructor
public class WebMvcConfig implements WebMvcConfigurer {

    private final FirebaseConfig firebaseConfig;

    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        registry.addInterceptor(new FirebaseConfigInterceptor(firebaseConfig));
    }

    /**
     * Firebase 설정을 모든 뷰에 추가하는 인터셉터
     */
    public static class FirebaseConfigInterceptor implements HandlerInterceptor {

        private final FirebaseConfig firebaseConfig;

        public FirebaseConfigInterceptor(FirebaseConfig firebaseConfig) {
            this.firebaseConfig = firebaseConfig;
        }

        @Override
        public void postHandle(HttpServletRequest request, HttpServletResponse response, 
                              Object handler, ModelAndView modelAndView) {
            if (modelAndView != null) {
                modelAndView.addObject("firebaseConfig", firebaseConfig);
            }
        }
    }
} 