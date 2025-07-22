package com.stayswap;

import com.amazonaws.services.s3.AmazonS3Client;
import com.stayswap.house.service.HouseImgService;
import com.stayswap.notification.service.integration.FCMService;
import com.stayswap.util.EnvironmentUtil;
import org.springframework.boot.autoconfigure.EnableAutoConfiguration;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;

@SpringBootTest
@ActiveProfiles("test")
@EnableAutoConfiguration
@ComponentScan(basePackages = {
        "com.stayswap"
})
public abstract class IntegrationTest {

    @MockitoBean
    private AmazonS3Client amazonS3Client;

    @MockitoBean
    private FCMService fcmService;

    @MockitoBean
    private EnvironmentUtil environmentUtil;

    @MockitoBean
    private HouseImgService houseImgService;

}

