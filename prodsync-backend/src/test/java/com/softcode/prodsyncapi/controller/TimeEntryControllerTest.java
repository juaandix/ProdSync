package com.softcode.prodsyncapi.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.softcode.prodsyncapi.model.TimeEntry;
import com.softcode.prodsyncapi.model.User;
import com.softcode.prodsyncapi.model.enums.UserStatus;
import com.softcode.prodsyncapi.repository.UserRepository;
import com.softcode.prodsyncapi.security.CustomUserDetailsService;
import com.softcode.prodsyncapi.security.JwtService;
import com.softcode.prodsyncapi.security.SecurityConfig;
import com.softcode.prodsyncapi.service.TimeEntryService;
import com.softcode.prodsyncapi.service.UserService;
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

@WebMvcTest(TimeEntryController.class)
@Import(SecurityConfig.class)
class TimeEntryControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private TimeEntryService timeEntryService;

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

    private TimeEntry createTimeEntry() {
        TimeEntry te = new TimeEntry();
        te.setId(1L);
        te.setHours(2.5);
        te.setDescription("Work done");
        te.setDate("2025-01-15");
        te.setType("development");
        return te;
    }

    private User createUser() {
        User u = new User();
        u.setId(1L);
        u.setUsername("user");
        u.setEmail("user@test.com");
        u.setNombre("Test User");
        u.setEstado(UserStatus.ACTIVE);
        u.setRole("ROLE_ADMIN");
        return u;
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void getAllTimeEntries_shouldReturnAll_whenNoTaskId() throws Exception {
        when(timeEntryService.getAllTimeEntries()).thenReturn(List.of(createTimeEntry()));

        mockMvc.perform(get("/api/time-entries"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].description").value("Work done"));
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void getAllTimeEntries_shouldFilterByTaskId() throws Exception {
        when(timeEntryService.getTimeEntriesByTaskId(5L)).thenReturn(List.of(createTimeEntry()));

        mockMvc.perform(get("/api/time-entries").param("taskId", "5"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].description").value("Work done"));
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void getTimeEntryById_shouldReturn200_whenFound() throws Exception {
        when(timeEntryService.getTimeEntryById(1L)).thenReturn(Optional.of(createTimeEntry()));

        mockMvc.perform(get("/api/time-entries/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.description").value("Work done"));
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void getTimeEntryById_shouldReturn404_whenNotFound() throws Exception {
        when(timeEntryService.getTimeEntryById(99L)).thenReturn(Optional.empty());

        mockMvc.perform(get("/api/time-entries/99"))
                .andExpect(status().isNotFound());
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void createTimeEntry_shouldReturn201() throws Exception {
        TimeEntry entry = createTimeEntry();
        when(userService.getUserByUsername(any())).thenReturn(Optional.of(createUser()));
        when(timeEntryService.saveTimeEntry(any(TimeEntry.class))).thenReturn(entry);

        mockMvc.perform(post("/api/time-entries")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(entry)))
                .andExpect(status().isCreated());
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void updateTimeEntry_shouldReturn200_whenFound() throws Exception {
        TimeEntry entry = createTimeEntry();
        when(timeEntryService.getTimeEntryById(1L)).thenReturn(Optional.of(entry));
        when(timeEntryService.saveTimeEntry(any(TimeEntry.class))).thenReturn(entry);

        mockMvc.perform(put("/api/time-entries/1")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(entry)))
                .andExpect(status().isOk());
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void updateTimeEntry_shouldReturn404_whenNotFound() throws Exception {
        when(timeEntryService.getTimeEntryById(99L)).thenReturn(Optional.empty());

        TimeEntry entry = createTimeEntry();
        mockMvc.perform(put("/api/time-entries/99")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(entry)))
                .andExpect(status().isNotFound());
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void deleteTimeEntry_shouldReturn204() throws Exception {
        when(timeEntryService.getTimeEntryById(1L)).thenReturn(Optional.of(createTimeEntry()));

        mockMvc.perform(delete("/api/time-entries/1").with(csrf()))
                .andExpect(status().isNoContent());
    }
}
