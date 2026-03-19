package com.softcode.projcodeapi.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import org.springframework.lang.Nullable;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UserUpdateDto {
    private String username;
    private String email;
    private String nombre;
    private String estado;
    private String role;
    @Nullable
    private String password; // This will be optional
}
