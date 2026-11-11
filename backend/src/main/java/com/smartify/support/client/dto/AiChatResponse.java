package com.smartify.support.client.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AiChatResponse {

    private String reply;
    private String intent;
    private Double confidence;
    private String nextNodeId;
    private List<Object> toolCalls;
    private boolean shouldEscalate;
}
