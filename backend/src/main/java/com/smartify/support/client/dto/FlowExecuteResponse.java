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
public class FlowExecuteResponse {

    private String nextNodeId;
    private String nodeType;
    private FlowOutput output;
    private Map<String, Object> sessionVariables;
    private boolean isTerminal;
    private boolean escalate;
}
