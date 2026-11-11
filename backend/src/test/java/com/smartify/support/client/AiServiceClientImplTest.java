package com.smartify.support.client;

import com.github.tomakehurst.wiremock.WireMockServer;
import com.github.tomakehurst.wiremock.client.WireMock;
import com.github.tomakehurst.wiremock.core.WireMockConfiguration;
import com.smartify.support.client.dto.AiChatRequest;
import com.smartify.support.client.dto.AiChatResponse;
import com.smartify.support.client.dto.ChatHistoryEntry;
import com.smartify.support.client.dto.FlowExecuteRequest;
import com.smartify.support.client.dto.FlowExecuteResponse;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.client.reactive.ReactorClientHttpConnector;
import org.springframework.web.reactive.function.client.WebClient;

import java.util.List;
import java.util.Map;

import static com.github.tomakehurst.wiremock.client.WireMock.*;
import static org.assertj.core.api.Assertions.assertThat;

class AiServiceClientImplTest {

    private WireMockServer wireMockServer;
    private AiServiceClientImpl client;

    @BeforeEach
    void setUp() {
        wireMockServer = new WireMockServer(WireMockConfiguration.wireMockConfig().dynamicPort());
        wireMockServer.start();
        WireMock.configureFor("localhost", wireMockServer.port());

        WebClient webClient = WebClient.builder()
                .baseUrl("http://localhost:" + wireMockServer.port())
                .defaultHeader("X-API-Key", "test-api-key")
                .build();

        client = new AiServiceClientImpl(webClient);
    }

    @AfterEach
    void tearDown() {
        wireMockServer.stop();
    }

    @Test
    void chat_parsesResponseAndSendsApiKeyHeader() {
        wireMockServer.stubFor(post(urlEqualTo("/v1/chat"))
                .withHeader("X-API-Key", equalTo("test-api-key"))
                .willReturn(aResponse()
                        .withStatus(200)
                        .withHeader("Content-Type", "application/json")
                        .withBody("""
                                {
                                  "reply": "Sure, I can help with that.",
                                  "intent": "sales_inquiry",
                                  "confidence": 0.92,
                                  "nextNodeId": "n2",
                                  "toolCalls": [],
                                  "shouldEscalate": false
                                }
                                """)));

        AiChatRequest request = AiChatRequest.builder()
                .conversationId("conv-1")
                .contactId("contact-1")
                .message("Hello")
                .history(List.of(ChatHistoryEntry.builder().sender("CUSTOMER").content("Hello").build()))
                .flowContext(null)
                .build();

        AiChatResponse response = client.chat(request);

        assertThat(response.getReply()).isEqualTo("Sure, I can help with that.");
        assertThat(response.getIntent()).isEqualTo("sales_inquiry");
        assertThat(response.getConfidence()).isEqualTo(0.92);
        assertThat(response.getNextNodeId()).isEqualTo("n2");
        assertThat(response.isShouldEscalate()).isFalse();

        wireMockServer.verify(postRequestedFor(urlEqualTo("/v1/chat"))
                .withHeader("X-API-Key", equalTo("test-api-key")));
    }

    @Test
    void executeFlow_parsesResponseAndSendsApiKeyHeader() {
        wireMockServer.stubFor(post(urlEqualTo("/v1/flows/execute"))
                .withHeader("X-API-Key", equalTo("test-api-key"))
                .willReturn(aResponse()
                        .withStatus(200)
                        .withHeader("Content-Type", "application/json")
                        .withBody("""
                                {
                                  "nextNodeId": "n3",
                                  "nodeType": "textBlock",
                                  "output": {
                                    "text": "Here is our pricing...",
                                    "quickReplies": null,
                                    "apiResult": null
                                  },
                                  "sessionVariables": {"intent": "sales_inquiry"},
                                  "isTerminal": false,
                                  "escalate": false
                                }
                                """)));

        FlowExecuteRequest request = FlowExecuteRequest.builder()
                .flowId("flow-1")
                .graphJson(Map.of("nodes", List.of()))
                .currentNodeId("n2")
                .sessionVariables(Map.of())
                .incomingMessage("I want pricing info")
                .build();

        FlowExecuteResponse response = client.executeFlow(request);

        assertThat(response.getNextNodeId()).isEqualTo("n3");
        assertThat(response.getNodeType()).isEqualTo("textBlock");
        assertThat(response.getOutput().getText()).isEqualTo("Here is our pricing...");
        assertThat(response.getSessionVariables()).containsEntry("intent", "sales_inquiry");
        assertThat(response.isEscalate()).isFalse();

        wireMockServer.verify(postRequestedFor(urlEqualTo("/v1/flows/execute"))
                .withHeader("X-API-Key", equalTo("test-api-key")));
    }
}
