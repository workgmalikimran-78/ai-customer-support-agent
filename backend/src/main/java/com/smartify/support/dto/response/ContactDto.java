package com.smartify.support.dto.response;

import lombok.Builder;
import lombok.Data;

import java.util.UUID;

@Data
@Builder
public class ContactDto {

    private UUID id;
    private UUID channelId;
    private String externalId;
    private String displayName;
    private String avatarUrl;
    private String email;
    private String phone;
}
