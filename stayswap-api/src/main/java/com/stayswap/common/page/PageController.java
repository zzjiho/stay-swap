package com.stayswap.common.page;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class PageController {

    @GetMapping("/page/index")
    public String home() {
        return "index";
    }

    @GetMapping("/page/auth")
    public String auth() {
        return "auth";
    }

    @GetMapping("/page/new")
    public String new1() {
        return "/host/listings/new";
    }

    @GetMapping("/page/listing-detail")
    public String listingDetail() {
        return "listing-detail";
    }

    @GetMapping("/page/listings")
    public String listings() {
        return "listings";
    }

    @GetMapping("/page/exchanges")
    public String exchanges() {
        return "/my/exchanges";
    }

    @GetMapping("/page/profile")
    public String profile() {
        return "profile";
    }

    @GetMapping("/page/subscription")
    public String subscription() {
        return "subscription";
    }

    @GetMapping("/page/fcm-debug")
    public String fcmDebug() {
        return "fcm-debug";
    }

    @GetMapping("/page/debug/fcm-test")
    public String fcmTest() {
        return "debug/fcm-test";
    }

}
