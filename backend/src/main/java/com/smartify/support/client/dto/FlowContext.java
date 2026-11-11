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
public class FlowContext {

    private String flowId;
    private String currentNodeId;
    private Map<String, Object> variables;
}
