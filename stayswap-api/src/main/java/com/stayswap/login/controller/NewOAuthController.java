package com.stayswap.login.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/oauth")
@Tag(name = "OAuth2 Authentication", description = "Spring Authorization Server 기반 인증 API")
public class NewOAuthController {

    @Operation(summary = "카카오 로그인", description = "Authorization Server로 리다이렉트하여 카카오 로그인 시작")
    @GetMapping("/login/kakao")
    public String kakaoLogin() {
        return "redirect:http://localhost:8081/oauth2/authorization/kakao";
    }

    @Operation(summary = "로그인 페이지", description = "Authorization Server 로그인 페이지로 리다이렉트")
    @GetMapping("/login")
    public String login() {
        return "redirect:http://localhost:8081/login";
    }
}