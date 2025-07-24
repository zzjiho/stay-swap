package com.stayswap.login.controller;

import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;

@Controller
@Slf4j
public class AuthController {

    @GetMapping("/auth")
    public String handleAuth(@RequestParam("token") String token, HttpServletResponse response) {
        log.info("Received token: {}", token);

        // accessToken HttpOnly 쿠키에 저장
        Cookie cookie = new Cookie("accessToken", token);
        cookie.setHttpOnly(true);
        cookie.setSecure(true);
        cookie.setPath("/");
        cookie.setMaxAge(60 * 60 * 10);
        response.addCookie(cookie);

        return "redirect:/";
    }
}
