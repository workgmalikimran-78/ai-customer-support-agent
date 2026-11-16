package com.smartify.support.dto.response;

import com.smartify.support.client.dto.FlowValidationErrorDto;
import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class BotFlowValidationDto {

    private boolean valid;
    private List<FlowValidationErrorDto> errors;
}
