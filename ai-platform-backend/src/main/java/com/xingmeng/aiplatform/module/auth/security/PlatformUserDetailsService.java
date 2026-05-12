package com.xingmeng.aiplatform.module.auth.security;

import com.xingmeng.aiplatform.module.user.entity.User;
import com.xingmeng.aiplatform.module.user.repository.UserRepository;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

@Service
public class PlatformUserDetailsService implements UserDetailsService {
    private final UserRepository userRepository;

    public PlatformUserDetailsService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        User user = userRepository.findByUsername(username)
                .or(() -> userRepository.findByEmail(username))
                .orElseThrow(() -> new UsernameNotFoundException("User not found"));
        return toUserDetails(user);
    }

    public AuthenticatedUser toUserDetails(User user) {
        return new AuthenticatedUser(
                user.getId(),
                user.getUsername(),
                user.getPasswordHash(),
                user.getRoles().stream()
                        .map(role -> new SimpleGrantedAuthority("ROLE_" + role.getName()))
                        .toList()
        );
    }
}

