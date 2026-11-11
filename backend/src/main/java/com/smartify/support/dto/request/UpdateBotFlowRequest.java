package com.smartify.support.dto.request;

import lombok.Data;

import java.util.Map;

@Data
public class UpdateBotFlowRequest {

    private String name;

    private String description;

    private Map<String, Object> graphJson;
}
