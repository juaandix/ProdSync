package com.softcode.prodsyncapi.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.softcode.prodsyncapi.model.Task;
import com.softcode.prodsyncapi.model.enums.TaskStatus;
import com.softcode.prodsyncapi.repository.UserRepository;
import com.softcode.prodsyncapi.security.CustomUserDetailsService;
import com.softcode.prodsyncapi.security.JwtService;
import com.softcode.prodsyncapi.security.SecurityConfig;
import com.softcode.prodsyncapi.service.TaskService;
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

@WebMvcTest(TaskController.class)
@Import(SecurityConfig.class)
class TaskControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private TaskService taskService;

    @MockBean
    private JwtService jwtService;

    @MockBean
    private CustomUserDetailsService customUserDetailsService;

    @MockBean
    private UserRepository userRepository;

    @MockBean
    private PasswordEncoder passwordEncoder;

    private Task createTask() {
        Task t = new Task();
        t.setId(1L);
        t.setDescripcion("Test Task");
        t.setEstado(TaskStatus.PENDIENTE);
        return t;
    }

    @Test
    @WithMockUser
    void getAllTasks_shouldReturnAll_whenNoProjectId() throws Exception {
        when(taskService.getAllTasks()).thenReturn(List.of(createTask()));

        mockMvc.perform(get("/api/tasks"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].descripcion").value("Test Task"));
    }

    @Test
    @WithMockUser
    void getAllTasks_shouldFilterByProjectId() throws Exception {
        when(taskService.getTasksByProjectId(10L)).thenReturn(List.of(createTask()));

        mockMvc.perform(get("/api/tasks").param("projectId", "10"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].descripcion").value("Test Task"));
    }

    @Test
    @WithMockUser
    void getTaskById_shouldReturn200_whenFound() throws Exception {
        when(taskService.getTaskById(1L)).thenReturn(Optional.of(createTask()));

        mockMvc.perform(get("/api/tasks/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.descripcion").value("Test Task"));
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void createTask_shouldReturn201() throws Exception {
        Task task = createTask();
        when(taskService.saveTask(any(Task.class))).thenReturn(task);

        mockMvc.perform(post("/api/tasks")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(task)))
                .andExpect(status().isCreated());
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void updateTask_shouldReturn200_whenFound() throws Exception {
        Task task = createTask();
        when(taskService.getTaskById(1L)).thenReturn(Optional.of(task));
        when(taskService.saveTask(any(Task.class))).thenReturn(task);

        mockMvc.perform(put("/api/tasks/1")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(task)))
                .andExpect(status().isOk());
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void updateTask_shouldReturn404_whenNotFound() throws Exception {
        when(taskService.getTaskById(99L)).thenReturn(Optional.empty());

        Task task = createTask();
        mockMvc.perform(put("/api/tasks/99")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(task)))
                .andExpect(status().isNotFound());
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void deleteTask_shouldReturn204() throws Exception {
        mockMvc.perform(delete("/api/tasks/1").with(csrf()))
                .andExpect(status().isNoContent());
    }
}
