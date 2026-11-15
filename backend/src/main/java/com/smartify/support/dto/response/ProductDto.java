package com.smartify.support.dto.response;

import lombok.Builder;
import lombok.Data;

import java.util.UUID;

@Data
@Builder
public class ProductDto {

    private UUID id;
    private String name;
    private String description;
    private int priceCents;
    private int stockQuantity;
    private String imageUrl;
}
