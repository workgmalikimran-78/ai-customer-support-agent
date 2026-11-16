package com.smartify.support.dto.response;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Shared shape for GET/PUT /api/teams/{teamId}/settings -- matches
 * frontend's WorkspaceSettings type field-for-field (workspaceName,
 * supportEmail, timezone, channels, apiKey). Used as both the response body
 * and the PUT request body since the two are identical on the wire.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WorkspaceSettingsDto {

    @NotBlank
    private String workspaceName;

    @NotBlank
    @Email
    private String supportEmail;

    @NotBlank
    private String timezone;

    @Valid
    private ChannelSettingsDto channels;

    private String apiKey;
}
