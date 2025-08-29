package com.stayswap.common.page;

import com.stayswap.common.config.GoogleMapsConfig;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
@RequiredArgsConstructor
public class PageController {

    private final GoogleMapsConfig googleMapsConfig;

    @GetMapping("/page/index")
    public String home() {
        return "index";
    }

    @GetMapping("/page/auth")
    public String auth() {
        return "auth";
    }

    @GetMapping("/page/new")
    public String new1(Model model) {
        model.addAttribute("googleMapsApiKey", googleMapsConfig.getApiKey());
        return "host/listings/new";
    }

    @GetMapping("/page/host/listings/{houseId}/edit")
    public String editListing() {
        return "host/listings/edit";
    }

    @GetMapping("/page/listing-detail")
    public String listingDetail(Model model) {
        model.addAttribute("googleMapsApiKey", googleMapsConfig.getApiKey());
        return "listing-detail";
    }

    @GetMapping("/page/listings")
    public String listings() {
        return "listings";
    }

    @GetMapping("/page/exchanges")
    public String exchanges() {
        return "my/exchanges";
    }

    @GetMapping("/page/profile")
    public String profile() {
        return "profile";
    }

    @GetMapping("/page/subscription")
    public String subscription() {
        return "subscription";
    }

    @GetMapping("/notifications")
    public String notifications() {
        return "notifications";
    }

    @GetMapping("/page/messages")
    public String messages() {
        return "messages";
    }

}
