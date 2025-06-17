package com.stayswap;

import com.amazonaws.services.s3.AmazonS3Client;
import com.stayswap.config.JpaConfig;
import org.springframework.boot.autoconfigure.EnableAutoConfiguration;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;

@SpringBootTest
@ActiveProfiles("test")
//@SpringBootApplication
@EnableAutoConfiguration
@ComponentScan(basePackages = {
        "com.stayswap.notification.repository",
        "com.stayswap.config.test"
})
public abstract class IntegrationTest {

    @MockitoBean
    private AmazonS3Client amazonS3Client;

    @MockitoBean
    private JpaConfig jpaConfig;

}
