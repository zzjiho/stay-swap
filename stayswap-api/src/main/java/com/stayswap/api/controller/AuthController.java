package com.stayswap.api.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController("apiWebController")
public class AuthController {

    // 임시
    @GetMapping("/auth")
    public String authSuccess() {
        return "Authentication successful!";
    }
}