package com.smartify.support.controller;

import com.smartify.support.dto.response.ContactDto;
import com.smartify.support.exception.ResourceNotFoundException;
import com.smartify.support.model.Contact;
import com.smartify.support.repository.ContactRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequestMapping("/api/contacts")
@RequiredArgsConstructor
public class ContactController {

    private final ContactRepository contactRepository;

    @GetMapping("/{id}")
    public ResponseEntity<ContactDto> get(@PathVariable UUID id) {
        Contact contact = contactRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Contact not found: " + id));

        return ResponseEntity.ok(ContactDto.builder()
                .id(contact.getId())
                .channelId(contact.getChannelId())
                .externalId(contact.getExternalId())
                .displayName(contact.getDisplayName())
                .avatarUrl(contact.getAvatarUrl())
                .email(contact.getEmail())
                .phone(contact.getPhone())
                .build());
    }
}
