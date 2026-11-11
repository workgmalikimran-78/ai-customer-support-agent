package com.smartify.support.integration;

import com.smartify.support.client.AiServiceClient;
import com.smartify.support.client.dto.AiChatResponse;
import com.smartify.support.client.dto.SentimentResponse;
import com.smartify.support.dto.request.LoginRequest;
import com.smartify.support.dto.request.SendMessageRequest;
import com.smartify.support.dto.response.AuthResponse;
import com.smartify.support.model.Channel;
import com.smartify.support.model.Contact;
import com.smartify.support.model.Conversation;
import com.smartify.support.model.enums.ChannelType;
import com.smartify.support.model.enums.ConversationStatus;
import com.smartify.support.model.enums.MessageSender;
import com.smartify.support.repository.ChannelRepository;
import com.smartify.support.repository.ContactRepository;
import com.smartify.support.repository.ConversationRepository;
import com.smartify.support.repository.MessageRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

/**
 * Boots the real application context against a throwaway Postgres container, runs the real
 * Flyway migrations, and exercises: login -> create conversation -> send a customer message
 * -> AI reply (via mocked AiServiceClient) -> assert persisted state. The AiServiceClient bean
 * is mocked so this test never makes a real network call to the Python service.
 *
 * NOTE: requires a Docker-capable environment (Testcontainers pulls and starts a postgres
 * container). It will fail/skip in sandboxed environments without Docker - that's expected
 * and acceptable per the task spec.
 */
@Testcontainers
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
class ConversationFlowIntegrationTest {

    @Container
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:16-alpine")
            .withDatabaseName("support_platform_test")
            .withUsername("postgres")
            .withPassword("postgres");

    @DynamicPropertySource
    static void overrideProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", postgres::getJdbcUrl);
        registry.add("spring.datasource.username", postgres::getUsername);
        registry.add("spring.datasource.password", postgres::getPassword);
    }

    @Autowired
    private TestRestTemplate restTemplate;

    @Autowired
    private ChannelRepository channelRepository;

    @Autowired
    private ContactRepository contactRepository;

    @Autowired
    private ConversationRepository conversationRepository;

    @Autowired
    private MessageRepository messageRepository;

    @MockBean
    private AiServiceClient aiServiceClient;

    @Test
    void sendingCustomerMessage_persistsAiReplyAndUpdatesConversation() {
        when(aiServiceClient.chat(any())).thenReturn(AiChatResponse.builder()
                .reply("Thanks for reaching out, how can I help?")
                .shouldEscalate(false)
                .build());
        when(aiServiceClient.sentiment(any())).thenReturn(SentimentResponse.builder()
                .score(0.5)
                .label("neutral")
                .emoji("🙂")
                .build());

        // V2 seed migration already created a demo admin user with password "password123".
        LoginRequest loginRequest = new LoginRequest();
        loginRequest.setEmail("admin@smartify.demo");
        loginRequest.setPassword("password123");

        ResponseEntity<AuthResponse> loginResponse = restTemplate.postForEntity(
                "/api/auth/login", loginRequest, AuthResponse.class);
        assertThat(loginResponse.getStatusCode()).isEqualTo(HttpStatus.OK);
        String token = loginResponse.getBody().getToken();
        assertThat(token).isNotBlank();

        Channel channel = channelRepository.save(Channel.builder()
                .type(ChannelType.WEB_CHAT)
                .displayName("Web Chat - Integration Test")
                .isActive(true)
                .build());

        Contact contact = contactRepository.save(Contact.builder()
                .channelId(channel.getId())
                .externalId("integration-test-contact")
                .displayName("Test Contact")
                .build());

        Conversation conversation = conversationRepository.save(Conversation.builder()
                .contactId(contact.getId())
                .channelId(channel.getId())
                .status(ConversationStatus.OPEN)
                .unreadCount(0)
                .build());

        SendMessageRequest request = new SendMessageRequest();
        request.setContent("Hello, I need some help");
        request.setSender(MessageSender.CUSTOMER);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(token);

        ResponseEntity<String> response = restTemplate.postForEntity(
                "/api/conversations/" + conversation.getId() + "/messages",
                new HttpEntity<>(request, headers),
                String.class);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.CREATED);

        List<com.smartify.support.model.Message> messages =
                messageRepository.findByConversationIdOrderByCreatedAtDesc(conversation.getId(),
                        org.springframework.data.domain.PageRequest.of(0, 10));

        // Customer message + AI reply should both be persisted.
        assertThat(messages).hasSize(2);
        assertThat(messages).anySatisfy(m -> assertThat(m.getSender()).isEqualTo(MessageSender.CUSTOMER));
        assertThat(messages).anySatisfy(m -> assertThat(m.getSender()).isEqualTo(MessageSender.AI));

        Conversation updated = conversationRepository.findById(conversation.getId()).orElseThrow();
        assertThat(updated.getLastMessagePreview()).isNotBlank();
        assertThat(updated.getLastMessageAt()).isNotNull();
    }
}
