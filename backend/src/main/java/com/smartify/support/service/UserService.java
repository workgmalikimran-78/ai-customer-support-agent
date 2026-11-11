package com.smartify.support.service;

import com.smartify.support.dto.request.InviteTeamMemberRequest;
import com.smartify.support.dto.request.RegisterRequest;
import com.smartify.support.dto.response.UserDto;
import com.smartify.support.exception.ResourceNotFoundException;
import com.smartify.support.model.Team;
import com.smartify.support.model.User;
import com.smartify.support.model.enums.UserRole;
import com.smartify.support.repository.TeamRepository;
import com.smartify.support.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class UserService implements UserDetailsService {

    private final UserRepository userRepository;
    private final TeamRepository teamRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("No user with email " + email));
        return toUserDetails(user);
    }

    public UserDetails loadUserById(UUID userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new UsernameNotFoundException("No user with id " + userId));
        return toUserDetails(user);
    }

    private UserDetails toUserDetails(User user) {
        return org.springframework.security.core.userdetails.User.builder()
                .username(user.getId().toString())
                .password(user.getPasswordHash())
                .authorities("ROLE_" + user.getRole().name())
                .disabled(!user.isActive())
                .build();
    }

    public User getUserByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("No user with email " + email));
    }

    public User getUserById(UUID id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("No user with id " + id));
    }

    @Transactional
    public User register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new IllegalArgumentException("A user with that email already exists");
        }
        Team team = Team.builder()
                .name(request.getTeamName() != null ? request.getTeamName() : request.getDisplayName() + "'s Team")
                .build();
        team = teamRepository.save(team);

        User user = User.builder()
                .teamId(team.getId())
                .email(request.getEmail())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .displayName(request.getDisplayName())
                .role(UserRole.ADMIN)
                .isActive(true)
                .build();
        return userRepository.save(user);
    }

    @Transactional
    public User invite(UUID teamId, InviteTeamMemberRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new IllegalArgumentException("A user with that email already exists");
        }
        User user = User.builder()
                .teamId(teamId)
                .email(request.getEmail())
                .passwordHash(passwordEncoder.encode(UUID.randomUUID().toString()))
                .displayName(request.getDisplayName())
                .role(request.getRole() != null ? request.getRole() : UserRole.AGENT)
                .isActive(true)
                .build();
        return userRepository.save(user);
    }

    @Transactional
    public User updateRole(UUID userId, UserRole role) {
        User user = getUserById(userId);
        user.setRole(role);
        return userRepository.save(user);
    }

    public List<UserDto> listTeam(UUID teamId) {
        return userRepository.findByTeamId(teamId).stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    public UserDto toDto(User user) {
        return UserDto.builder()
                .id(user.getId())
                .email(user.getEmail())
                .displayName(user.getDisplayName())
                .avatarUrl(user.getAvatarUrl())
                .role(user.getRole().name())
                .isActive(user.isActive())
                .build();
    }
}
