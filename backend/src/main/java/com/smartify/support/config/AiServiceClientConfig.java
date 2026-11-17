package com.smartify.support.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.client.reactive.ReactorClientHttpConnector;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.netty.http.client.HttpClient;

import java.time.Duration;

@Configuration
public class AiServiceClientConfig {

    @Bean
    public WebClient aiServiceWebClient(
            @Value("${ai-service.base-url:http://localhost:8000}") String baseUrl,
            @Value("${ai-service.api-key:}") String apiKey) {

        // Must stay equal to (or larger than) AiServiceClientImpl's TIMEOUT -- this
        // Netty-level timeout fires first on the connection itself, so a shorter value
        // here silently overrides that one regardless of what it's set to.
        HttpClient httpClient = HttpClient.create()
                .responseTimeout(Duration.ofSeconds(90));

        return WebClient.builder()
                .baseUrl(baseUrl)
                .clientConnector(new ReactorClientHttpConnector(httpClient))
                .defaultHeader("X-API-Key", apiKey)
                .build();
    }
}
