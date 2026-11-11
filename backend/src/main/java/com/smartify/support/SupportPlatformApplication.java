package com.smartify.support;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class SupportPlatformApplication {

    public static void main(String[] args) {
        SpringApplication.run(SupportPlatformApplication.class, args);
    }
}
