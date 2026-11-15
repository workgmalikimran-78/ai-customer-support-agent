package com.smartify.support.dto.response;

import lombok.Builder;
import lombok.Data;

import java.util.UUID;

@Data
@Builder
public class CustomerAuthResponse {

    private String token;
    private UUID customerId;
    private String email;
    private String displayName;
}
