package com.pgmanagement.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class AuthResponse {
    private String token;
    private UserDto user;

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class UserDto {
        private String id;
        private String name;
        private String email;
        private String phone;
        private String role;
    }
}
