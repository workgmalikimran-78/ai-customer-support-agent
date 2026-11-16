package com.smartify.support.exception;

import com.smartify.support.client.dto.FlowValidationErrorDto;
import lombok.Getter;

import java.util.List;

@Getter
public class FlowValidationException extends RuntimeException {

    private final List<FlowValidationErrorDto> errors;

    public FlowValidationException(List<FlowValidationErrorDto> errors) {
        super("Bot flow graph failed validation");
        this.errors = errors;
    }
}
