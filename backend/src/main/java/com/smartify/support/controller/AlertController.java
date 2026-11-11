package com.smartify.support.controller;

import com.smartify.support.dto.response.AlertDto;
import com.smartify.support.model.User;
import com.smartify.support.service.AlertService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/alerts")
@RequiredArgsConstructor
public class AlertController {

    private final AlertService alertService;
    private final AuthenticatedUserResolver authenticatedUserResolver;

    @GetMapping
    public List<AlertDto> list(@RequestParam(defaultValue = "false") boolean unreadOnly) {
        User user = authenticatedUserResolver.currentUser();
        return alertService.list(user.getTeamId(), unreadOnly);
    }
}
