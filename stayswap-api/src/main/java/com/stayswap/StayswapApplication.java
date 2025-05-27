package com.stayswap;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.EnableConfigurationProperties;

@SpringBootApplication
@EnableConfigurationProperties
public class StayswapApplication {

	public static void main(String[] args) {
		SpringApplication.run(StayswapApplication.class, args);
	}

}
