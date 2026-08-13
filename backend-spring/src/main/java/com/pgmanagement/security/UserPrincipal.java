package com.pgmanagement.security;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collection;
import java.util.List;

@Getter
@AllArgsConstructor
@Builder
public class UserPrincipal implements UserDetails {

    private final String id;
    private final String username; // email for owner, phone for tenant
    private final String password;
    private final String role;
    private final Collection<? extends GrantedAuthority> authorities;

    public static UserPrincipal create(String id, String username, String password, String role) {
        return UserPrincipal.builder()
            .id(id)
            .username(username)
            .password(password)
            .role(role)
            .authorities(List.of(new SimpleGrantedAuthority("ROLE_" + role)))
            .build();
    }

    @Override public boolean isAccountNonExpired() { return true; }
    @Override public boolean isAccountNonLocked() { return true; }
    @Override public boolean isCredentialsNonExpired() { return true; }
    @Override public boolean isEnabled() { return true; }
}
