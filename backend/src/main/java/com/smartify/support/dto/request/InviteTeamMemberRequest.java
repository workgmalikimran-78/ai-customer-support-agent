package com.smartify.support.dto.request;

import com.smartify.support.model.enums.UserRole;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class InviteTeamMemberRequest {

    @NotBlank
    @Email
    private String email;

    @NotBlank
    private String displayName;

    private UserRole role = UserRole.AGENT;
}
