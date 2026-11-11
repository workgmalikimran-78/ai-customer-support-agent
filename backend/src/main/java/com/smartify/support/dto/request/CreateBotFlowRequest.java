package com.smartify.support.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

import java.util.Map;

@Data
public class CreateBotFlowRequest {

    @NotBlank
    private String name;

    private String description;

    private Map<String, Object> graphJson;
}
