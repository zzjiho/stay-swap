package com.stayswap.common.config;

import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.ChannelRegistration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

@Configuration
@EnableWebSocketMessageBroker
@RequiredArgsConstructor
public class StompConfig implements WebSocketMessageBrokerConfigurer {

    private final JwtDecoder jwtDecoder;

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        // WebSocket 연결 엔드포인트 설정
        registry.addEndpoint("/stomp/chats")
                .setAllowedOriginPatterns("*") // CORS 설정 (개발환경용, 운영에서는 구체적인 도메인 지정)
                .withSockJS(); // SockJS 폴백 옵션 활성화 (WebSocket 미지원 브라우저 대응)
    }

    @Override
    public void configureMessageBroker(MessageBrokerRegistry registry) {
        // 클라이언트가 메시지를 발행할 때 사용할 prefix
        registry.setApplicationDestinationPrefixes("/pub");
        
        // 클라이언트가 구독할 때 사용할 prefix
        registry.enableSimpleBroker("/sub");
        
        // 특정 사용자에게 메시지를 보낼 때 사용할 prefix (1:1 채팅용)
        registry.setUserDestinationPrefix("/user");
    }

    @Override
    public void configureClientInboundChannel(ChannelRegistration registration) {
        registration.interceptors(new JwtWebSocketInterceptor(jwtDecoder));
    }
}
