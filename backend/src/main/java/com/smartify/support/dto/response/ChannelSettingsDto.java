package com.smartify.support.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ChannelSettingsDto {

    private boolean webchat;
    private boolean whatsapp;
    private boolean facebook;
    private boolean browser;
}
