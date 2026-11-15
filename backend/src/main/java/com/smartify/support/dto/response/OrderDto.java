package com.smartify.support.dto.response;

import lombok.Builder;
import lombok.Data;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Data
@Builder
public class OrderDto {

    private UUID id;
    private String status;
    private int totalCents;
    private List<OrderItemDto> items;
    private Instant createdAt;
}
