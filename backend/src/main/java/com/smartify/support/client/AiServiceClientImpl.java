package com.smartify.support.client;

import com.smartify.support.client.dto.AiChatRequest;
import com.smartify.support.client.dto.AiChatResponse;
import com.smartify.support.client.dto.FlowExecuteRequest;
import com.smartify.support.client.dto.FlowExecuteResponse;
import com.smartify.support.client.dto.FlowValidateRequest;
import com.smartify.support.client.dto.FlowValidateResponse;
import com.smartify.support.client.dto.SentimentRequest;
import com.smartify.support.client.dto.SentimentResponse;
import com.smartify.support.exception.AiServiceException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientResponseException;

import java.time.Duration;

@Slf4j
@Component
@RequiredArgsConstructor
public class AiServiceClientImpl implements AiServiceClient {

    // /v1/chat now runs a classify step plus a specialist ReAct loop that can chain
    // multiple tool calls (e.g. a RAG lookup followed by a final generation) -- each
    // step is a full Claude round-trip, so this needs real headroom or requests that
    // are just slow (not stuck) surface as timeouts.
    //
    // This MUST stay equal to (or larger than) the Netty-level responseTimeout set on
    // the WebClient's HttpClient in AiServiceClientConfig -- that one fires first and
    // silently makes this value a no-op if it's shorter, which is exactly what
    // happened when this was 60s here but 30s there.
    private static final Duration TIMEOUT = Duration.ofSeconds(90);

    private final WebClient aiServiceWebClient;

    @Override
    public AiChatResponse chat(AiChatRequest request) {
        try {
            return aiServiceWebClient.post()
                    .uri("/v1/chat")
                    .bodyValue(request)
                    .retrieve()
                    .bodyToMono(AiChatResponse.class)
                    .block(TIMEOUT);
        } catch (WebClientResponseException e) {
            throw new AiServiceException("Chat call failed with status " + e.getStatusCode(), e);
        } catch (Exception e) {
            throw new AiServiceException("Chat call failed: " + e.getMessage(), e);
        }
    }

    @Override
    public FlowExecuteResponse executeFlow(FlowExecuteRequest request) {
        try {
            return aiServiceWebClient.post()
                    .uri("/v1/flows/execute")
                    .bodyValue(request)
                    .retrieve()
                    .bodyToMono(FlowExecuteResponse.class)
                    .block(TIMEOUT);
        } catch (WebClientResponseException e) {
            throw new AiServiceException("Flow execution call failed with status " + e.getStatusCode(), e);
        } catch (Exception e) {
            throw new AiServiceException("Flow execution call failed: " + e.getMessage(), e);
        }
    }

    @Override
    public FlowValidateResponse validateFlow(FlowValidateRequest request) {
        try {
            return aiServiceWebClient.post()
                    .uri("/v1/flows/validate")
                    .bodyValue(request)
                    .retrieve()
                    .bodyToMono(FlowValidateResponse.class)
                    .block(TIMEOUT);
        } catch (WebClientResponseException e) {
            throw new AiServiceException("Flow validation call failed with status " + e.getStatusCode(), e);
        } catch (Exception e) {
            throw new AiServiceException("Flow validation call failed: " + e.getMessage(), e);
        }
    }

    @Override
    public SentimentResponse sentiment(SentimentRequest request) {
        try {
            return aiServiceWebClient.post()
                    .uri("/v1/sentiment")
                    .bodyValue(request)
                    .retrieve()
                    .bodyToMono(SentimentResponse.class)
                    .block(TIMEOUT);
        } catch (WebClientResponseException e) {
            throw new AiServiceException("Sentiment call failed with status " + e.getStatusCode(), e);
        } catch (Exception e) {
            throw new AiServiceException("Sentiment call failed: " + e.getMessage(), e);
        }
    }
}
