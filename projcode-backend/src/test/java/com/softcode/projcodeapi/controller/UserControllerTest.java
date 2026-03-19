package com.softcode.projcodeapi.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.softcode.projcodeapi.dto.UserUpdateDto;
import com.softcode.projcodeapi.model.User;
import com.softcode.projcodeapi.model.enums.UserStatus;
import com.softcode.projcodeapi.repository.UserRepository;
import com.softcode.projcodeapi.security.CustomUserDetailsService;
import com.softcode.projcodeapi.security.JwtService;
import com.softcode.projcodeapi.security.SecurityConfig;
import com.softcode.projcodeapi.service.UserService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;
import java.util.Optional;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(UserController.class)
@Import(SecurityConfig.class)
class UserControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private UserService userService;

    @MockBean
    private JwtService jwtService;

    @MockBean
    private CustomUserDetailsService customUserDetailsService;

    @MockBean
    private UserRepository userRepository;

    @MockBean
    private PasswordEncoder passwordEncoder;

    @Test
    @WithMockUser(roles = "ADMIN")
    void getAllUsers_shouldReturnList() throws Exception {
        User user = new User();
        user.setId(1L);
        user.setUsername("test");
        user.setEmail("t@t.com");
        user.setNombre("Test");
        user.setEstado(UserStatus.ACTIVE);
        when(userService.getAllUsers(any(), any(), any())).thenReturn(List.of(user));

        mockMvc.perform(get("/api/usuarios"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].username").value("test"));
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void getUserById_shouldReturn200_whenFound() throws Exception {
        User user = new User();
        user.setId(1L);
        user.setUsername("test");
        user.setEmail("t@t.com");
        user.setNombre("Test");
        user.setEstado(UserStatus.ACTIVE);
        when(userService.getUserById(1L)).thenReturn(Optional.of(user));

        mockMvc.perform(get("/api/usuarios/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.username").value("test"));
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void getUserById_shouldReturn404_whenNotFound() throws Exception {
        when(userService.getUserById(99L)).thenReturn(Optional.empty());

        mockMvc.perform(get("/api/usuarios/99"))
                .andExpect(status().isNotFound());
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void createUser_shouldReturn201() throws Exception {
        User user = new User();
        user.setId(1L);
        user.setUsername("newuser");
        user.setEmail("new@test.com");
        user.setNombre("New User");
        user.setEstado(UserStatus.ACTIVE);
        user.setRole("ROLE_USER");
        user.setPassword("pass");
        when(userService.saveUser(any(User.class))).thenReturn(user);

        mockMvc.perform(post("/api/usuarios")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(user)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.username").value("newuser"));
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void updateUser_shouldReturn200_whenFound() throws Exception {
        User updatedUser = new User();
        updatedUser.setId(1L);
        updatedUser.setUsername("updated");
        updatedUser.setEmail("u@t.com");
        updatedUser.setNombre("Updated");
        updatedUser.setEstado(UserStatus.ACTIVE);
        when(userService.updateUser(eq(1L), any(UserUpdateDto.class))).thenReturn(updatedUser);

        UserUpdateDto dto = new UserUpdateDto("updated", "u@t.com", "Updated", "ACTIVE", "ROLE_USER", null);

        mockMvc.perform(put("/api/usuarios/1")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.username").value("updated"));
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void updateUser_shouldReturn404_whenNotFound() throws Exception {
        when(userService.updateUser(eq(99L), any(UserUpdateDto.class))).thenReturn(null);

        UserUpdateDto dto = new UserUpdateDto("user", "e@m.com", "Name", "ACTIVE", "ROLE_USER", null);

        mockMvc.perform(put("/api/usuarios/99")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isNotFound());
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void deleteUser_shouldReturn204() throws Exception {
        mockMvc.perform(delete("/api/usuarios/1").with(csrf()))
                .andExpect(status().isNoContent());
    }
}
