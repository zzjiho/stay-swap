package com.stayswap.common.config;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import io.swagger.v3.oas.models.servers.Server;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.env.Environment;

import java.util.Arrays;

@Configuration
@RequiredArgsConstructor
public class SwaggerConfig {

    private final Environment environment;

    @Bean
    public OpenAPI openAPI() {
        String key = "Authorization";

        // 프로필에 따라 서버 순서 결정
        String[] activeProfiles = environment.getActiveProfiles();
        boolean isProduction = Arrays.stream(activeProfiles)
                .anyMatch(profile -> profile.equals("prd") || profile.equals("prod"));

        OpenAPI openAPI = new OpenAPI()
                .addSecurityItem(new SecurityRequirement()
                        .addList(key)
                )
                .info(apiInfo())
                .components(new Components()
                        .addSecuritySchemes(key, new SecurityScheme()
                                .name(key)
                                .type(SecurityScheme.Type.HTTP)
                                .in(SecurityScheme.In.HEADER)
                                .scheme("bearer")
                                .bearerFormat("JWT"))
                );

        if (isProduction) {
            // 운영 환경에서는 프로덕션 서버를 첫 번째로
            openAPI.addServersItem(new Server().url("https://www.stayzzle.com").description("Production Server"))
                    .addServersItem(new Server().url("https://stayzzle.com").description("Production Server (without www)"));
        } else {
            // 개발 환경에서는 로컬호스트를 첫 번째로
            openAPI.addServersItem(new Server().url("http://localhost:8080").description("Local Development Server"))
                    .addServersItem(new Server().url("https://www.stayzzle.com").description("Production Server"))
                    .addServersItem(new Server().url("https://stayzzle.com").description("Production Server (without www)"));
        }

        return openAPI;
    }

    private Info apiInfo() {
        return new Info()
                .title("Springdoc")
                .description("Stay Swap API Swagger UI")
                .version("1.0.0");
    }


}


