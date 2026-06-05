package com.softcode.prodsyncapi.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.softcode.prodsyncapi.model.Project;
import com.softcode.prodsyncapi.model.enums.ProjectStatus;
import com.softcode.prodsyncapi.repository.UserRepository;
import com.softcode.prodsyncapi.security.CustomUserDetailsService;
import com.softcode.prodsyncapi.security.JwtService;
import com.softcode.prodsyncapi.security.SecurityConfig;
import com.softcode.prodsyncapi.service.ProjectService;
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

@WebMvcTest(ProjectController.class)
@Import(SecurityConfig.class)
class ProjectControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private ProjectService projectService;

    @MockBean
    private JwtService jwtService;

    @MockBean
    private CustomUserDetailsService customUserDetailsService;

    @MockBean
    private UserRepository userRepository;

    @MockBean
    private PasswordEncoder passwordEncoder;

    private Project createProject() {
        Project p = new Project();
        p.setId(1L);
        p.setNombre("Test Project");
        p.setEstado(ProjectStatus.ACTIVO);
        return p;
    }

    @Test
    @WithMockUser
    void getAllProjects_shouldReturnList() throws Exception {
        when(projectService.getAllProjects(any(), any(), any())).thenReturn(List.of(createProject()));

        mockMvc.perform(get("/api/proyectos"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].nombre").value("Test Project"));
    }

    @Test
    @WithMockUser
    void getProjectById_shouldReturn200_whenFound() throws Exception {
        when(projectService.getProjectById(1L)).thenReturn(Optional.of(createProject()));

        mockMvc.perform(get("/api/proyectos/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.nombre").value("Test Project"));
    }

    @Test
    @WithMockUser
    void getProjectById_shouldReturn404_whenNotFound() throws Exception {
        when(projectService.getProjectById(99L)).thenReturn(Optional.empty());

        mockMvc.perform(get("/api/proyectos/99"))
                .andExpect(status().isNotFound());
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void createProject_shouldReturn201() throws Exception {
        Project project = createProject();
        when(projectService.saveProject(any(Project.class))).thenReturn(project);

        mockMvc.perform(post("/api/proyectos")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(project)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.nombre").value("Test Project"));
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void updateProject_shouldReturn200_whenFound() throws Exception {
        Project project = createProject();
        when(projectService.getProjectById(1L)).thenReturn(Optional.of(project));
        when(projectService.saveProject(any(Project.class))).thenReturn(project);

        mockMvc.perform(put("/api/proyectos/1")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(project)))
                .andExpect(status().isOk());
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void updateProject_shouldReturn404_whenNotFound() throws Exception {
        when(projectService.getProjectById(99L)).thenReturn(Optional.empty());

        Project project = createProject();
        mockMvc.perform(put("/api/proyectos/99")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(project)))
                .andExpect(status().isNotFound());
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void deleteProject_shouldReturn204() throws Exception {
        mockMvc.perform(delete("/api/proyectos/1").with(csrf()))
                .andExpect(status().isNoContent());
    }
}
