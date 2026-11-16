package com.smartify.support.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.Map;

@Data
public class ValidateBotFlowRequest {

    @NotNull
    private Map<String, Object> graphJson;
}
