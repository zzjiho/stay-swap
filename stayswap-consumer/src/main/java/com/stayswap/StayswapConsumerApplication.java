package com.stayswap;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.scheduling.annotation.EnableScheduling;

@EnableScheduling
@SpringBootApplication
@ComponentScan({
		"com.stayswap.notification.service.integration",
		"com.stayswap.user.service.device",
		"com.stayswap.user.repository",
		"com.stayswap.config",
		"com.stayswap.common.config.firebase",
		"com.stayswap.notification.consumer",
		"com.stayswap.chat.consumer"
})
public class StayswapConsumerApplication {

	public static void main(String[] args) {
		SpringApplication.run(StayswapConsumerApplication.class, args);
	}

}
