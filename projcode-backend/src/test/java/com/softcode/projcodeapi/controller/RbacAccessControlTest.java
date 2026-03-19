package com.softcode.projcodeapi.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.softcode.projcodeapi.model.Cliente;
import com.softcode.projcodeapi.model.Project;
import com.softcode.projcodeapi.model.Task;
import com.softcode.projcodeapi.model.TimeEntry;
import com.softcode.projcodeapi.model.User;
import com.softcode.projcodeapi.model.enums.ProjectStatus;
import com.softcode.projcodeapi.model.enums.TaskStatus;
import com.softcode.projcodeapi.model.enums.UserStatus;
import com.softcode.projcodeapi.repository.UserRepository;
import com.softcode.projcodeapi.security.CustomUserDetailsService;
import com.softcode.projcodeapi.security.JwtService;
import com.softcode.projcodeapi.security.SecurityConfig;
import com.softcode.projcodeapi.service.ClienteService;
import com.softcode.projcodeapi.service.ProjectService;
import com.softcode.projcodeapi.service.TaskService;
import com.softcode.projcodeapi.service.TimeEntryService;
import com.softcode.projcodeapi.service.UserService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;
import java.util.Optional;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Pruebas de control de acceso por rol (RBAC).
 *
 * Matriz de permisos:
 *
 * Recurso              | No auth | USER | OPERATOR | ADMIN
 * ---------------------|---------|------|----------|-------
 * GET  /api/usuarios   |   401   |  403 |   403    |  200
 * POST /api/usuarios   |   401   |  403 |   403    |  201
 * PUT  /api/usuarios   |   401   |  403 |   403    |  200
 * DEL  /api/usuarios   |   401   |  403 |   403    |  204
 * GET  /api/clientes   |   401   |  403 |   200    |  200
 * POST /api/clientes   |   401   |  403 |   201    |  201
 * PUT  /api/clientes   |   401   |  403 |   200    |  200
 * DEL  /api/clientes   |   401   |  403 |   204    |  204
 * GET  /api/proyectos  |   401   |  200 |   200    |  200
 * POST /api/proyectos  |   401   |  403 |   201    |  201
 * PUT  /api/proyectos  |   401   |  403 |   200    |  200
 * DEL  /api/proyectos  |   401   |  403 |   204    |  204
 * GET  /api/tasks      |   401   |  200 |   200    |  200
 * POST /api/tasks      |   401   |  403 |   201    |  201
 * PUT  /api/tasks      |   401   |  403 |   200    |  200
 * DEL  /api/tasks      |   401   |  403 |   204    |  204
 * GET  /api/time-entries         |  401 | 200 |  200  |  200
 * POST /api/time-entries         |  401 | 201 |  201  |  201
 * GET  /api/time-entries/{id} own|  401 | 200 |  200  |  200
 * GET  /api/time-entries/{id} adj|  401 | 403 |  403  |  200
 * PUT  /api/time-entries/{id} own|  401 | 200 |  200  |  200
 * PUT  /api/time-entries/{id} adj|  401 | 403 |  403  |  200
 * DEL  /api/time-entries/{id} own|  401 | 204 |  204  |  204
 * DEL  /api/time-entries/{id} adj|  401 | 403 |  403  |  204
 */
@WebMvcTest(controllers = {
        UserController.class,
        ClienteController.class,
        ProjectController.class,
        TaskController.class,
        TimeEntryController.class
})
@Import(SecurityConfig.class)
class RbacAccessControlTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean private UserService userService;
    @MockBean private ClienteService clienteService;
    @MockBean private ProjectService projectService;
    @MockBean private TaskService taskService;
    @MockBean private TimeEntryService timeEntryService;
    @MockBean private JwtService jwtService;
    @MockBean private CustomUserDetailsService customUserDetailsService;
    @MockBean private UserRepository userRepository;
    @MockBean private PasswordEncoder passwordEncoder;

    // -------------------------------------------------------------------------
    // Helpers
    // -------------------------------------------------------------------------

    /** Usuario autenticado (el que devuelve @WithMockUser — username="user") */
    private User currentUser() {
        User u = new User();
        u.setId(1L);
        u.setUsername("user");
        u.setEmail("user@test.com");
        u.setNombre("Test User");
        u.setEstado(UserStatus.ACTIVE);
        u.setRole("USER");
        return u;
    }

    /** Otro usuario distinto al autenticado */
    private User otherUser() {
        User u = new User();
        u.setId(99L);
        u.setUsername("other");
        u.setEmail("other@test.com");
        u.setNombre("Other User");
        u.setEstado(UserStatus.ACTIVE);
        u.setRole("USER");
        return u;
    }

    private Cliente mockCliente() {
        Cliente c = new Cliente();
        c.setId(1L);
        c.setNombre("Cliente Test");
        c.setEmail("cliente@test.com");
        c.setIdentificacion("12345");
        c.setContactPerson("Contacto");
        return c;
    }

    private Project mockProject() {
        Project p = new Project();
        p.setId(1L);
        p.setNombre("Proyecto Test");
        p.setEstado(ProjectStatus.ACTIVO);
        return p;
    }

    private Task mockTask() {
        Task t = new Task();
        t.setId(1L);
        t.setDescripcion("Tarea Test");
        t.setEstado(TaskStatus.PENDIENTE);
        return t;
    }

    /** TimeEntry perteneciente al usuario autenticado (id=1) */
    private TimeEntry ownEntry() {
        TimeEntry te = new TimeEntry();
        te.setId(1L);
        te.setHours(2.0);
        te.setUser(currentUser());
        return te;
    }

    /** TimeEntry perteneciente a otro usuario (id=99) */
    private TimeEntry otherEntry() {
        TimeEntry te = new TimeEntry();
        te.setId(2L);
        te.setHours(1.0);
        te.setUser(otherUser());
        return te;
    }

    @BeforeEach
    void setupMocks() {
        // Usuario actual (para TimeEntryController.getCurrentUser con principal="user")
        when(userService.getUserByUsername("user")).thenReturn(Optional.of(currentUser()));

        // Listas
        when(userService.getAllUsers(anyString(), anyString(), anyString())).thenReturn(List.of(currentUser()));
        when(userService.getAllUsers(any(), any(), any())).thenReturn(List.of(currentUser()));
        when(clienteService.getAllClientes(any(), any(), any())).thenReturn(List.of(mockCliente()));
        when(projectService.getAllProjects(any(), any(), any())).thenReturn(List.of(mockProject()));
        when(taskService.getAllTasks()).thenReturn(List.of(mockTask()));
        when(timeEntryService.getAllTimeEntries()).thenReturn(List.of(ownEntry()));
        when(timeEntryService.getTimeEntriesByUserId(1L)).thenReturn(List.of(ownEntry()));

        // Por ID
        when(userService.getUserById(1L)).thenReturn(Optional.of(currentUser()));
        when(clienteService.getClienteById(1L)).thenReturn(Optional.of(mockCliente()));
        when(projectService.getProjectById(1L)).thenReturn(Optional.of(mockProject()));
        when(taskService.getTaskById(1L)).thenReturn(Optional.of(mockTask()));
        when(timeEntryService.getTimeEntryById(1L)).thenReturn(Optional.of(ownEntry()));
        when(timeEntryService.getTimeEntryById(2L)).thenReturn(Optional.of(otherEntry()));

        // Guardado / actualización
        when(userService.saveUser(any())).thenReturn(currentUser());
        when(userService.updateUser(anyLong(), any())).thenReturn(currentUser());
        when(clienteService.saveCliente(any())).thenReturn(mockCliente());
        when(projectService.saveProject(any())).thenReturn(mockProject());
        when(taskService.saveTask(any())).thenReturn(mockTask());
        when(timeEntryService.saveTimeEntry(any())).thenReturn(ownEntry());
    }

    // =========================================================================
    // SIN AUTENTICACIÓN → 401 en todos los endpoints
    // =========================================================================

    @Nested
    class Unauthenticated {

        @Test void usuarios_get_returns401() throws Exception {
            mockMvc.perform(get("/api/usuarios")).andExpect(status().isUnauthorized());
        }

        @Test void usuarios_post_returns401() throws Exception {
            mockMvc.perform(post("/api/usuarios").with(csrf())
                    .contentType(MediaType.APPLICATION_JSON).content("{}"))
                    .andExpect(status().isUnauthorized());
        }

        @Test void usuarios_put_returns401() throws Exception {
            mockMvc.perform(put("/api/usuarios/1").with(csrf())
                    .contentType(MediaType.APPLICATION_JSON).content("{}"))
                    .andExpect(status().isUnauthorized());
        }

        @Test void usuarios_delete_returns401() throws Exception {
            mockMvc.perform(delete("/api/usuarios/1").with(csrf()))
                    .andExpect(status().isUnauthorized());
        }

        @Test void clientes_get_returns401() throws Exception {
            mockMvc.perform(get("/api/clientes")).andExpect(status().isUnauthorized());
        }

        @Test void clientes_post_returns401() throws Exception {
            mockMvc.perform(post("/api/clientes").with(csrf())
                    .contentType(MediaType.APPLICATION_JSON).content("{}"))
                    .andExpect(status().isUnauthorized());
        }

        @Test void proyectos_get_returns401() throws Exception {
            mockMvc.perform(get("/api/proyectos")).andExpect(status().isUnauthorized());
        }

        @Test void proyectos_post_returns401() throws Exception {
            mockMvc.perform(post("/api/proyectos").with(csrf())
                    .contentType(MediaType.APPLICATION_JSON).content("{}"))
                    .andExpect(status().isUnauthorized());
        }

        @Test void tasks_get_returns401() throws Exception {
            mockMvc.perform(get("/api/tasks")).andExpect(status().isUnauthorized());
        }

        @Test void tasks_post_returns401() throws Exception {
            mockMvc.perform(post("/api/tasks").with(csrf())
                    .contentType(MediaType.APPLICATION_JSON).content("{}"))
                    .andExpect(status().isUnauthorized());
        }

        @Test void timeEntries_get_returns401() throws Exception {
            mockMvc.perform(get("/api/time-entries")).andExpect(status().isUnauthorized());
        }

        @Test void timeEntries_post_returns401() throws Exception {
            mockMvc.perform(post("/api/time-entries").with(csrf())
                    .contentType(MediaType.APPLICATION_JSON).content("{}"))
                    .andExpect(status().isUnauthorized());
        }
    }

    // =========================================================================
    // ROLE_USER → sólo lectura de proyectos/tasks, time-entries propios
    // =========================================================================

    @Nested
    class RoleUser {

        // --- Usuarios: todo 403 ---

        @Test @WithMockUser(roles = "USER")
        void usuarios_get_returns403() throws Exception {
            mockMvc.perform(get("/api/usuarios")).andExpect(status().isForbidden());
        }

        @Test @WithMockUser(roles = "USER")
        void usuarios_getById_returns403() throws Exception {
            mockMvc.perform(get("/api/usuarios/1")).andExpect(status().isForbidden());
        }

        @Test @WithMockUser(roles = "USER")
        void usuarios_post_returns403() throws Exception {
            mockMvc.perform(post("/api/usuarios").with(csrf())
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(currentUser())))
                    .andExpect(status().isForbidden());
        }

        @Test @WithMockUser(roles = "USER")
        void usuarios_put_returns403() throws Exception {
            mockMvc.perform(put("/api/usuarios/1").with(csrf())
                    .contentType(MediaType.APPLICATION_JSON).content("{}"))
                    .andExpect(status().isForbidden());
        }

        @Test @WithMockUser(roles = "USER")
        void usuarios_delete_returns403() throws Exception {
            mockMvc.perform(delete("/api/usuarios/1").with(csrf()))
                    .andExpect(status().isForbidden());
        }

        // --- Clientes: todo 403 ---

        @Test @WithMockUser(roles = "USER")
        void clientes_get_returns403() throws Exception {
            mockMvc.perform(get("/api/clientes")).andExpect(status().isForbidden());
        }

        @Test @WithMockUser(roles = "USER")
        void clientes_getById_returns403() throws Exception {
            mockMvc.perform(get("/api/clientes/1")).andExpect(status().isForbidden());
        }

        @Test @WithMockUser(roles = "USER")
        void clientes_post_returns403() throws Exception {
            mockMvc.perform(post("/api/clientes").with(csrf())
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(mockCliente())))
                    .andExpect(status().isForbidden());
        }

        @Test @WithMockUser(roles = "USER")
        void clientes_put_returns403() throws Exception {
            mockMvc.perform(put("/api/clientes/1").with(csrf())
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(mockCliente())))
                    .andExpect(status().isForbidden());
        }

        @Test @WithMockUser(roles = "USER")
        void clientes_delete_returns403() throws Exception {
            mockMvc.perform(delete("/api/clientes/1").with(csrf()))
                    .andExpect(status().isForbidden());
        }

        // --- Proyectos: GET permitido, escritura 403 ---

        @Test @WithMockUser(roles = "USER")
        void proyectos_get_returns200() throws Exception {
            mockMvc.perform(get("/api/proyectos")).andExpect(status().isOk());
        }

        @Test @WithMockUser(roles = "USER")
        void proyectos_getById_returns200() throws Exception {
            mockMvc.perform(get("/api/proyectos/1")).andExpect(status().isOk());
        }

        @Test @WithMockUser(roles = "USER")
        void proyectos_post_returns403() throws Exception {
            mockMvc.perform(post("/api/proyectos").with(csrf())
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(mockProject())))
                    .andExpect(status().isForbidden());
        }

        @Test @WithMockUser(roles = "USER")
        void proyectos_put_returns403() throws Exception {
            mockMvc.perform(put("/api/proyectos/1").with(csrf())
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(mockProject())))
                    .andExpect(status().isForbidden());
        }

        @Test @WithMockUser(roles = "USER")
        void proyectos_delete_returns403() throws Exception {
            mockMvc.perform(delete("/api/proyectos/1").with(csrf()))
                    .andExpect(status().isForbidden());
        }

        // --- Tasks: GET permitido, escritura 403 ---

        @Test @WithMockUser(roles = "USER")
        void tasks_get_returns200() throws Exception {
            mockMvc.perform(get("/api/tasks")).andExpect(status().isOk());
        }

        @Test @WithMockUser(roles = "USER")
        void tasks_getById_returns200() throws Exception {
            mockMvc.perform(get("/api/tasks/1")).andExpect(status().isOk());
        }

        @Test @WithMockUser(roles = "USER")
        void tasks_post_returns403() throws Exception {
            mockMvc.perform(post("/api/tasks").with(csrf())
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(mockTask())))
                    .andExpect(status().isForbidden());
        }

        @Test @WithMockUser(roles = "USER")
        void tasks_put_returns403() throws Exception {
            mockMvc.perform(put("/api/tasks/1").with(csrf())
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(mockTask())))
                    .andExpect(status().isForbidden());
        }

        @Test @WithMockUser(roles = "USER")
        void tasks_delete_returns403() throws Exception {
            mockMvc.perform(delete("/api/tasks/1").with(csrf()))
                    .andExpect(status().isForbidden());
        }

        // --- Time Entries: CRUD propio, 403 en entradas ajenas ---

        @Test @WithMockUser(roles = "USER")
        void timeEntries_get_returns200() throws Exception {
            mockMvc.perform(get("/api/time-entries")).andExpect(status().isOk());
        }

        @Test @WithMockUser(roles = "USER")
        void timeEntries_post_returns201() throws Exception {
            mockMvc.perform(post("/api/time-entries").with(csrf())
                    .contentType(MediaType.APPLICATION_JSON).content("{}"))
                    .andExpect(status().isCreated());
        }

        @Test @WithMockUser(roles = "USER")
        void timeEntries_getById_ownEntry_returns200() throws Exception {
            mockMvc.perform(get("/api/time-entries/1")).andExpect(status().isOk());
        }

        @Test @WithMockUser(roles = "USER")
        void timeEntries_getById_otherEntry_returns403() throws Exception {
            mockMvc.perform(get("/api/time-entries/2")).andExpect(status().isForbidden());
        }

        @Test @WithMockUser(roles = "USER")
        void timeEntries_put_ownEntry_returns200() throws Exception {
            mockMvc.perform(put("/api/time-entries/1").with(csrf())
                    .contentType(MediaType.APPLICATION_JSON).content("{}"))
                    .andExpect(status().isOk());
        }

        @Test @WithMockUser(roles = "USER")
        void timeEntries_put_otherEntry_returns403() throws Exception {
            mockMvc.perform(put("/api/time-entries/2").with(csrf())
                    .contentType(MediaType.APPLICATION_JSON).content("{}"))
                    .andExpect(status().isForbidden());
        }

        @Test @WithMockUser(roles = "USER")
        void timeEntries_delete_ownEntry_returns204() throws Exception {
            mockMvc.perform(delete("/api/time-entries/1").with(csrf()))
                    .andExpect(status().isNoContent());
        }

        @Test @WithMockUser(roles = "USER")
        void timeEntries_delete_otherEntry_returns403() throws Exception {
            mockMvc.perform(delete("/api/time-entries/2").with(csrf()))
                    .andExpect(status().isForbidden());
        }
    }

    // =========================================================================
    // ROLE_OPERATOR → sin gestión de usuarios, resto completo (entradas propias)
    // =========================================================================

    @Nested
    class RoleOperator {

        // --- Usuarios: todo 403 ---

        @Test @WithMockUser(roles = "OPERATOR")
        void usuarios_get_returns403() throws Exception {
            mockMvc.perform(get("/api/usuarios")).andExpect(status().isForbidden());
        }

        @Test @WithMockUser(roles = "OPERATOR")
        void usuarios_getById_returns403() throws Exception {
            mockMvc.perform(get("/api/usuarios/1")).andExpect(status().isForbidden());
        }

        @Test @WithMockUser(roles = "OPERATOR")
        void usuarios_post_returns403() throws Exception {
            mockMvc.perform(post("/api/usuarios").with(csrf())
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(currentUser())))
                    .andExpect(status().isForbidden());
        }

        @Test @WithMockUser(roles = "OPERATOR")
        void usuarios_put_returns403() throws Exception {
            mockMvc.perform(put("/api/usuarios/1").with(csrf())
                    .contentType(MediaType.APPLICATION_JSON).content("{}"))
                    .andExpect(status().isForbidden());
        }

        @Test @WithMockUser(roles = "OPERATOR")
        void usuarios_delete_returns403() throws Exception {
            mockMvc.perform(delete("/api/usuarios/1").with(csrf()))
                    .andExpect(status().isForbidden());
        }

        // --- Clientes: acceso completo ---

        @Test @WithMockUser(roles = "OPERATOR")
        void clientes_get_returns200() throws Exception {
            mockMvc.perform(get("/api/clientes")).andExpect(status().isOk());
        }

        @Test @WithMockUser(roles = "OPERATOR")
        void clientes_getById_returns200() throws Exception {
            mockMvc.perform(get("/api/clientes/1")).andExpect(status().isOk());
        }

        @Test @WithMockUser(roles = "OPERATOR")
        void clientes_post_returns201() throws Exception {
            mockMvc.perform(post("/api/clientes").with(csrf())
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(mockCliente())))
                    .andExpect(status().isCreated());
        }

        @Test @WithMockUser(roles = "OPERATOR")
        void clientes_put_returns200() throws Exception {
            mockMvc.perform(put("/api/clientes/1").with(csrf())
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(mockCliente())))
                    .andExpect(status().isOk());
        }

        @Test @WithMockUser(roles = "OPERATOR")
        void clientes_delete_returns204() throws Exception {
            mockMvc.perform(delete("/api/clientes/1").with(csrf()))
                    .andExpect(status().isNoContent());
        }

        // --- Proyectos: acceso completo ---

        @Test @WithMockUser(roles = "OPERATOR")
        void proyectos_get_returns200() throws Exception {
            mockMvc.perform(get("/api/proyectos")).andExpect(status().isOk());
        }

        @Test @WithMockUser(roles = "OPERATOR")
        void proyectos_getById_returns200() throws Exception {
            mockMvc.perform(get("/api/proyectos/1")).andExpect(status().isOk());
        }

        @Test @WithMockUser(roles = "OPERATOR")
        void proyectos_post_returns201() throws Exception {
            mockMvc.perform(post("/api/proyectos").with(csrf())
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(mockProject())))
                    .andExpect(status().isCreated());
        }

        @Test @WithMockUser(roles = "OPERATOR")
        void proyectos_put_returns200() throws Exception {
            mockMvc.perform(put("/api/proyectos/1").with(csrf())
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(mockProject())))
                    .andExpect(status().isOk());
        }

        @Test @WithMockUser(roles = "OPERATOR")
        void proyectos_delete_returns204() throws Exception {
            mockMvc.perform(delete("/api/proyectos/1").with(csrf()))
                    .andExpect(status().isNoContent());
        }

        // --- Tasks: acceso completo ---

        @Test @WithMockUser(roles = "OPERATOR")
        void tasks_get_returns200() throws Exception {
            mockMvc.perform(get("/api/tasks")).andExpect(status().isOk());
        }

        @Test @WithMockUser(roles = "OPERATOR")
        void tasks_getById_returns200() throws Exception {
            mockMvc.perform(get("/api/tasks/1")).andExpect(status().isOk());
        }

        @Test @WithMockUser(roles = "OPERATOR")
        void tasks_post_returns201() throws Exception {
            mockMvc.perform(post("/api/tasks").with(csrf())
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(mockTask())))
                    .andExpect(status().isCreated());
        }

        @Test @WithMockUser(roles = "OPERATOR")
        void tasks_put_returns200() throws Exception {
            mockMvc.perform(put("/api/tasks/1").with(csrf())
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(mockTask())))
                    .andExpect(status().isOk());
        }

        @Test @WithMockUser(roles = "OPERATOR")
        void tasks_delete_returns204() throws Exception {
            mockMvc.perform(delete("/api/tasks/1").with(csrf()))
                    .andExpect(status().isNoContent());
        }

        // --- Time Entries: CRUD propio, 403 en entradas ajenas ---

        @Test @WithMockUser(roles = "OPERATOR")
        void timeEntries_get_returns200() throws Exception {
            mockMvc.perform(get("/api/time-entries")).andExpect(status().isOk());
        }

        @Test @WithMockUser(roles = "OPERATOR")
        void timeEntries_post_returns201() throws Exception {
            mockMvc.perform(post("/api/time-entries").with(csrf())
                    .contentType(MediaType.APPLICATION_JSON).content("{}"))
                    .andExpect(status().isCreated());
        }

        @Test @WithMockUser(roles = "OPERATOR")
        void timeEntries_getById_ownEntry_returns200() throws Exception {
            mockMvc.perform(get("/api/time-entries/1")).andExpect(status().isOk());
        }

        @Test @WithMockUser(roles = "OPERATOR")
        void timeEntries_getById_otherEntry_returns403() throws Exception {
            mockMvc.perform(get("/api/time-entries/2")).andExpect(status().isForbidden());
        }

        @Test @WithMockUser(roles = "OPERATOR")
        void timeEntries_put_ownEntry_returns200() throws Exception {
            mockMvc.perform(put("/api/time-entries/1").with(csrf())
                    .contentType(MediaType.APPLICATION_JSON).content("{}"))
                    .andExpect(status().isOk());
        }

        @Test @WithMockUser(roles = "OPERATOR")
        void timeEntries_put_otherEntry_returns403() throws Exception {
            mockMvc.perform(put("/api/time-entries/2").with(csrf())
                    .contentType(MediaType.APPLICATION_JSON).content("{}"))
                    .andExpect(status().isForbidden());
        }

        @Test @WithMockUser(roles = "OPERATOR")
        void timeEntries_delete_ownEntry_returns204() throws Exception {
            mockMvc.perform(delete("/api/time-entries/1").with(csrf()))
                    .andExpect(status().isNoContent());
        }

        @Test @WithMockUser(roles = "OPERATOR")
        void timeEntries_delete_otherEntry_returns403() throws Exception {
            mockMvc.perform(delete("/api/time-entries/2").with(csrf()))
                    .andExpect(status().isForbidden());
        }
    }

    // =========================================================================
    // ROLE_ADMIN → acceso total, incluyendo entradas de otros usuarios
    // =========================================================================

    @Nested
    class RoleAdmin {

        // --- Usuarios: acceso completo ---

        @Test @WithMockUser(roles = "ADMIN")
        void usuarios_get_returns200() throws Exception {
            mockMvc.perform(get("/api/usuarios")).andExpect(status().isOk());
        }

        @Test @WithMockUser(roles = "ADMIN")
        void usuarios_getById_returns200() throws Exception {
            mockMvc.perform(get("/api/usuarios/1")).andExpect(status().isOk());
        }

        @Test @WithMockUser(roles = "ADMIN")
        void usuarios_post_returns201() throws Exception {
            mockMvc.perform(post("/api/usuarios").with(csrf())
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(currentUser())))
                    .andExpect(status().isCreated());
        }

        @Test @WithMockUser(roles = "ADMIN")
        void usuarios_put_returns200() throws Exception {
            mockMvc.perform(put("/api/usuarios/1").with(csrf())
                    .contentType(MediaType.APPLICATION_JSON).content("{}"))
                    .andExpect(status().isOk());
        }

        @Test @WithMockUser(roles = "ADMIN")
        void usuarios_delete_returns204() throws Exception {
            mockMvc.perform(delete("/api/usuarios/1").with(csrf()))
                    .andExpect(status().isNoContent());
        }

        // --- Clientes: acceso completo ---

        @Test @WithMockUser(roles = "ADMIN")
        void clientes_get_returns200() throws Exception {
            mockMvc.perform(get("/api/clientes")).andExpect(status().isOk());
        }

        @Test @WithMockUser(roles = "ADMIN")
        void clientes_post_returns201() throws Exception {
            mockMvc.perform(post("/api/clientes").with(csrf())
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(mockCliente())))
                    .andExpect(status().isCreated());
        }

        @Test @WithMockUser(roles = "ADMIN")
        void clientes_put_returns200() throws Exception {
            mockMvc.perform(put("/api/clientes/1").with(csrf())
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(mockCliente())))
                    .andExpect(status().isOk());
        }

        @Test @WithMockUser(roles = "ADMIN")
        void clientes_delete_returns204() throws Exception {
            mockMvc.perform(delete("/api/clientes/1").with(csrf()))
                    .andExpect(status().isNoContent());
        }

        // --- Proyectos: acceso completo ---

        @Test @WithMockUser(roles = "ADMIN")
        void proyectos_get_returns200() throws Exception {
            mockMvc.perform(get("/api/proyectos")).andExpect(status().isOk());
        }

        @Test @WithMockUser(roles = "ADMIN")
        void proyectos_post_returns201() throws Exception {
            mockMvc.perform(post("/api/proyectos").with(csrf())
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(mockProject())))
                    .andExpect(status().isCreated());
        }

        @Test @WithMockUser(roles = "ADMIN")
        void proyectos_put_returns200() throws Exception {
            mockMvc.perform(put("/api/proyectos/1").with(csrf())
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(mockProject())))
                    .andExpect(status().isOk());
        }

        @Test @WithMockUser(roles = "ADMIN")
        void proyectos_delete_returns204() throws Exception {
            mockMvc.perform(delete("/api/proyectos/1").with(csrf()))
                    .andExpect(status().isNoContent());
        }

        // --- Tasks: acceso completo ---

        @Test @WithMockUser(roles = "ADMIN")
        void tasks_get_returns200() throws Exception {
            mockMvc.perform(get("/api/tasks")).andExpect(status().isOk());
        }

        @Test @WithMockUser(roles = "ADMIN")
        void tasks_post_returns201() throws Exception {
            mockMvc.perform(post("/api/tasks").with(csrf())
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(mockTask())))
                    .andExpect(status().isCreated());
        }

        @Test @WithMockUser(roles = "ADMIN")
        void tasks_put_returns200() throws Exception {
            mockMvc.perform(put("/api/tasks/1").with(csrf())
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(mockTask())))
                    .andExpect(status().isOk());
        }

        @Test @WithMockUser(roles = "ADMIN")
        void tasks_delete_returns204() throws Exception {
            mockMvc.perform(delete("/api/tasks/1").with(csrf()))
                    .andExpect(status().isNoContent());
        }

        // --- Time Entries: acceso total, incluyendo entradas de otros ---

        @Test @WithMockUser(roles = "ADMIN")
        void timeEntries_get_returns200() throws Exception {
            mockMvc.perform(get("/api/time-entries")).andExpect(status().isOk());
        }

        @Test @WithMockUser(roles = "ADMIN")
        void timeEntries_post_returns201() throws Exception {
            mockMvc.perform(post("/api/time-entries").with(csrf())
                    .contentType(MediaType.APPLICATION_JSON).content("{}"))
                    .andExpect(status().isCreated());
        }

        @Test @WithMockUser(roles = "ADMIN")
        void timeEntries_getById_ownEntry_returns200() throws Exception {
            mockMvc.perform(get("/api/time-entries/1")).andExpect(status().isOk());
        }

        @Test @WithMockUser(roles = "ADMIN")
        void timeEntries_getById_otherEntry_returns200() throws Exception {
            mockMvc.perform(get("/api/time-entries/2")).andExpect(status().isOk());
        }

        @Test @WithMockUser(roles = "ADMIN")
        void timeEntries_put_ownEntry_returns200() throws Exception {
            mockMvc.perform(put("/api/time-entries/1").with(csrf())
                    .contentType(MediaType.APPLICATION_JSON).content("{}"))
                    .andExpect(status().isOk());
        }

        @Test @WithMockUser(roles = "ADMIN")
        void timeEntries_put_otherEntry_returns200() throws Exception {
            mockMvc.perform(put("/api/time-entries/2").with(csrf())
                    .contentType(MediaType.APPLICATION_JSON).content("{}"))
                    .andExpect(status().isOk());
        }

        @Test @WithMockUser(roles = "ADMIN")
        void timeEntries_delete_ownEntry_returns204() throws Exception {
            mockMvc.perform(delete("/api/time-entries/1").with(csrf()))
                    .andExpect(status().isNoContent());
        }

        @Test @WithMockUser(roles = "ADMIN")
        void timeEntries_delete_otherEntry_returns204() throws Exception {
            mockMvc.perform(delete("/api/time-entries/2").with(csrf()))
                    .andExpect(status().isNoContent());
        }
    }
}
