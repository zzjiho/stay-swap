package com.stayswap.auth.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class AuthHomeController {

    @GetMapping("/")
    public String home() {
        return "redirect:http://localhost:8080"; // API 서버로 리다이렉트
    }

    @GetMapping("/login")
    public String login() {
        return "login";
    }
}