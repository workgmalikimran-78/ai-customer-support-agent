package com.smartify.support.dto.request;

import com.smartify.support.model.enums.UserRole;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class UpdateUserRoleRequest {

    @NotNull
    private UserRole role;
}
