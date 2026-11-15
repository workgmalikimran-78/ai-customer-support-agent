package com.smartify.support.dto.request;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Data;

import java.util.UUID;

@Data
public class PlaceOrderRequest {

    @NotNull
    private UUID productId;

    @Positive
    private int quantity;
}
