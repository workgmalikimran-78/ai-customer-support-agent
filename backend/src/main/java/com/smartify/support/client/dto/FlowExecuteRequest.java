package com.smartify.support.client.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FlowExecuteRequest {

    private String flowId;
    private Map<String, Object> graphJson;
    private String currentNodeId;
    private Map<String, Object> sessionVariables;
    private String incomingMessage;
}
