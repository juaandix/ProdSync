package com.softcode.prodsyncapi.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.softcode.prodsyncapi.model.Cliente;
import com.softcode.prodsyncapi.repository.UserRepository;
import com.softcode.prodsyncapi.security.CustomUserDetailsService;
import com.softcode.prodsyncapi.security.JwtService;
import com.softcode.prodsyncapi.security.SecurityConfig;
import com.softcode.prodsyncapi.service.ClienteService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import jakarta.servlet.ServletException;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(ClienteController.class)
@Import(SecurityConfig.class)
class ClienteControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private ClienteService clienteService;

    @MockBean
    private JwtService jwtService;

    @MockBean
    private CustomUserDetailsService customUserDetailsService;

    @MockBean
    private UserRepository userRepository;

    @MockBean
    private PasswordEncoder passwordEncoder;

    private Cliente createCliente() {
        Cliente c = new Cliente();
        c.setId(1L);
        c.setNombre("Test Client");
        c.setEmail("client@test.com");
        c.setIdentificacion("12345");
        c.setContactPerson("Contact");
        return c;
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void getAllClientes_shouldReturnList() throws Exception {
        when(clienteService.getAllClientes(any(), any(), any())).thenReturn(List.of(createCliente()));

        mockMvc.perform(get("/api/clientes"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].nombre").value("Test Client"));
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void getClienteById_shouldReturn200_whenFound() throws Exception {
        when(clienteService.getClienteById(1L)).thenReturn(Optional.of(createCliente()));

        mockMvc.perform(get("/api/clientes/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.nombre").value("Test Client"));
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void getClienteById_shouldReturn404_whenNotFound() throws Exception {
        when(clienteService.getClienteById(99L)).thenReturn(Optional.empty());

        mockMvc.perform(get("/api/clientes/99"))
                .andExpect(status().isNotFound());
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void createCliente_shouldReturn201() throws Exception {
        Cliente cliente = createCliente();
        when(clienteService.saveCliente(any(Cliente.class))).thenReturn(cliente);

        mockMvc.perform(post("/api/clientes")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(cliente)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.nombre").value("Test Client"));
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void updateCliente_shouldReturn200_whenFound() throws Exception {
        Cliente existing = createCliente();
        when(clienteService.getClienteById(1L)).thenReturn(Optional.of(existing));
        when(clienteService.saveCliente(any(Cliente.class))).thenReturn(existing);

        mockMvc.perform(put("/api/clientes/1")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(existing)))
                .andExpect(status().isOk());
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void updateCliente_shouldReturn404_whenNotFound() throws Exception {
        when(clienteService.getClienteById(99L)).thenReturn(Optional.empty());

        Cliente cliente = createCliente();
        mockMvc.perform(put("/api/clientes/99")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(cliente)))
                .andExpect(status().isNotFound());
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void deleteCliente_shouldReturn204() throws Exception {
        mockMvc.perform(delete("/api/clientes/1").with(csrf()))
                .andExpect(status().isNoContent());
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void deleteCliente_shouldThrowException_whenBusinessError() {
        doThrow(new RuntimeException("No se puede eliminar el cliente"))
                .when(clienteService).deleteCliente(1L);

        assertThrows(ServletException.class, () ->
                mockMvc.perform(delete("/api/clientes/1").with(csrf())));
    }
}
