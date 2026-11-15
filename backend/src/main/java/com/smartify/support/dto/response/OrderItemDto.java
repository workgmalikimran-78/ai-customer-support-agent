package com.smartify.support.dto.response;

import lombok.Builder;
import lombok.Data;

import java.util.UUID;

@Data
@Builder
public class OrderItemDto {

    private UUID id;
    private UUID productId;
    private String productName;
    private int unitPriceCents;
    private int quantity;
}
