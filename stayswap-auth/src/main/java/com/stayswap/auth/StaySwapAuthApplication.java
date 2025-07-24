package com.stayswap.auth;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.domain.EntityScan;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;

@SpringBootApplication(scanBasePackages = {
    "com.stayswap.auth",                           // Authorization Server 전용 컴포넌트
    "com.stayswap.user.repository",                // User 관련 Repository만
    "com.stayswap.user.repository.nickname",       // 닉네임 생성기만
    "com.stayswap.config"                          // JPAQueryFactory를 위한 JpaConfig
})
@EntityScan(basePackages = {
    "com.stayswap"
})
@EnableJpaRepositories(basePackages = {
    "com.stayswap.user.repository"                 // User Repository만
})
public class StaySwapAuthApplication {
    public static void main(String[] args) {
        SpringApplication.run(StaySwapAuthApplication.class, args);
    }
}