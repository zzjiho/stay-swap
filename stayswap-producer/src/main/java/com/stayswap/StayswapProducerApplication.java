package com.stayswap;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.ComponentScan;

@SpringBootApplication
@ComponentScan(basePackages = {
    "com.stayswap.notification.producer",
    "com.stayswap.chat.producer"
})
public class StayswapProducerApplication {

	public static void main(String[] args) {
		SpringApplication.run(StayswapProducerApplication.class, args);
	}

}
