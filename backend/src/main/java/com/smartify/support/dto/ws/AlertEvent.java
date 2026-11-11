package com.smartify.support.dto.ws;

import com.smartify.support.dto.response.AlertDto;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class AlertEvent {

    private AlertDto alert;
}
