package com.smartify.support.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.smartify.support.config.JwtService;
import com.smartify.support.dto.request.SendMessageRequest;
import com.smartify.support.dto.response.ConversationSummaryDto;
import com.smartify.support.dto.response.MessageDto;
import com.smartify.support.dto.response.PagedResponse;
import com.smartify.support.model.Conversation;
import com.smartify.support.model.Message;
import com.smartify.support.model.enums.ConversationStatus;
import com.smartify.support.model.enums.MessageSender;
import com.smartify.support.service.ConversationService;
import com.smartify.support.service.FlowExecutionOrchestrator;
import com.smartify.support.service.MessageService;
import com.smartify.support.service.UserService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(controllers = ConversationController.class)
@AutoConfigureMockMvc(addFilters = false)
class ConversationControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private ConversationService conversationService;

    @MockBean
    private MessageService messageService;

    @MockBean
    private FlowExecutionOrchestrator flowExecutionOrchestrator;

    // JwtAuthFilter is component-scanned by the WebMvcTest slice (Spring Security's filter
    // auto-configuration picks it up); its dependencies must be satisfiable even though
    // addFilters = false means the filter itself never actually runs in these tests.
    @MockBean
    private JwtService jwtService;

    @MockBean
    private UserService userService;

    @Test
    void listConversations_returnsPagedResults() throws Exception {
        UUID conversationId = UUID.randomUUID();
        ConversationSummaryDto summary = ConversationSummaryDto.builder()
                .id(conversationId)
                .status("OPEN")
                .unreadCount(1)
                .build();
        PagedResponse<ConversationSummaryDto> page = PagedResponse.<ConversationSummaryDto>builder()
                .items(List.of(summary))
                .page(0)
                .size(20)
                .totalElements(1)
                .totalPages(1)
                .build();

        when(conversationService.search(any(), any(), any(), anyInt(), anyInt())).thenReturn(page);

        mockMvc.perform(get("/api/conversations").param("status", "OPEN"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items[0].id").value(conversationId.toString()))
                .andExpect(jsonPath("$.totalElements").value(1));
    }

    @Test
    void getMessages_returnsMessageList() throws Exception {
        UUID conversationId = UUID.randomUUID();
        MessageDto messageDto = MessageDto.builder()
                .id(UUID.randomUUID())
                .conversationId(conversationId)
                .sender("CUSTOMER")
                .content("Hello")
                .createdAt(Instant.now())
                .build();

        when(conversationService.getMessages(eq(conversationId), any(), anyInt()))
                .thenReturn(List.of(messageDto));

        mockMvc.perform(get("/api/conversations/{id}/messages", conversationId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].content").value("Hello"));
    }

    @Test
    void sendMessage_asAgent_persistsAndReturnsDto() throws Exception {
        UUID conversationId = UUID.randomUUID();
        Conversation conversation = Conversation.builder()
                .id(conversationId)
                .status(ConversationStatus.OPEN)
                .build();
        Message savedMessage = Message.builder()
                .id(UUID.randomUUID())
                .conversationId(conversationId)
                .sender(MessageSender.AGENT)
                .content("How can I help?")
                .createdAt(Instant.now())
                .build();
        MessageDto dto = MessageDto.builder()
                .id(savedMessage.getId())
                .conversationId(conversationId)
                .sender("AGENT")
                .content("How can I help?")
                .createdAt(savedMessage.getCreatedAt())
                .build();

        SendMessageRequest request = new SendMessageRequest();
        request.setContent("How can I help?");
        request.setSender(MessageSender.AGENT);

        when(conversationService.getById(conversationId)).thenReturn(conversation);
        when(messageService.save(eq(conversationId), eq(MessageSender.AGENT), eq("How can I help?"), any(), any(), any()))
                .thenReturn(savedMessage);
        when(messageService.toDto(savedMessage)).thenReturn(dto);

        mockMvc.perform(post("/api/conversations/{id}/messages", conversationId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.content").value("How can I help?"));
    }
}
