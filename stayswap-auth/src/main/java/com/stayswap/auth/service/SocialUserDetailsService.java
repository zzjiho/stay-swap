package com.stayswap.auth.service;

import com.stayswap.user.model.entity.User;
import com.stayswap.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.util.Collections;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class SocialUserDetailsService implements UserDetailsService {

    private final UserRepository userRepository;

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        log.debug("Loading user details for username: {}", username);

        User user;
        try {
            // 숫자인 경우 userId로 처리
            Long userId = Long.parseLong(username);
            user = userRepository.findById(userId)
                    .orElseThrow(() -> new UsernameNotFoundException("User not found with id: " + userId));
        } catch (NumberFormatException e) {
            // 숫자가 아닌 경우 email로 처리
            user = userRepository.findByEmail(username)
                    .orElseThrow(() -> new UsernameNotFoundException("User not found with email: " + username));
        }

        List<GrantedAuthority> authorities = Collections.singletonList(
                new SimpleGrantedAuthority(user.getRole().name()) // 이미 ROLE_ 접두사 포함
        );

        return org.springframework.security.core.userdetails.User.builder()
                .username(user.getId().toString())
                .password("")
                .authorities(authorities)
                .build();
    }
}