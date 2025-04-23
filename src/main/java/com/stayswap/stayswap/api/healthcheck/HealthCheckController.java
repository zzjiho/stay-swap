package com.stayswap.stayswap.api.healthcheck;

import io.swagger.v3.oas.annotations.tags.Tag;
import io.swagger.v3.oas.models.responses.ApiResponse;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/health-check")
@Tag(name = "health", description = "try health-check")
public class HealthCheckController {

    @GetMapping("")
    public ApiResponse healthCheck() {
        return new ApiResponse().description("health-check success!!");
    }

}
