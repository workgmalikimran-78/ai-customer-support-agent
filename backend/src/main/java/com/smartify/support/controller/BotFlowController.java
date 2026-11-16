package com.smartify.support.controller;

import com.smartify.support.dto.request.CreateBotFlowRequest;
import com.smartify.support.dto.request.UpdateBotFlowRequest;
import com.smartify.support.dto.request.ValidateBotFlowRequest;
import com.smartify.support.dto.response.BotFlowDto;
import com.smartify.support.dto.response.BotFlowValidationDto;
import com.smartify.support.service.BotFlowService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/bot-flows")
@RequiredArgsConstructor
public class BotFlowController {

    private final BotFlowService botFlowService;

    @GetMapping
    public ResponseEntity<List<BotFlowDto>> list() {
        return ResponseEntity.ok(botFlowService.listAll());
    }

    @PostMapping
    public ResponseEntity<BotFlowDto> create(@Valid @RequestBody CreateBotFlowRequest request) {
        var botFlow = botFlowService.create(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(botFlowService.toDto(botFlow));
    }

    @GetMapping("/{id}")
    public ResponseEntity<BotFlowDto> get(@PathVariable UUID id) {
        return ResponseEntity.ok(botFlowService.toDto(botFlowService.getById(id)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<BotFlowDto> update(@PathVariable UUID id, @Valid @RequestBody UpdateBotFlowRequest request) {
        var botFlow = botFlowService.update(id, request);
        return ResponseEntity.ok(botFlowService.toDto(botFlow));
    }

    @PostMapping("/{id}/publish")
    public ResponseEntity<BotFlowDto> publish(@PathVariable UUID id) {
        var botFlow = botFlowService.publish(id);
        return ResponseEntity.ok(botFlowService.toDto(botFlow));
    }

    @PostMapping("/{id}/validate")
    public ResponseEntity<BotFlowValidationDto> validate(@PathVariable UUID id,
            @Valid @RequestBody ValidateBotFlowRequest request) {
        return ResponseEntity.ok(botFlowService.validate(request.getGraphJson()));
    }
}
