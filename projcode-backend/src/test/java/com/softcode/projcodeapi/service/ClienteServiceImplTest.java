package com.softcode.projcodeapi.service;

import com.softcode.projcodeapi.model.Cliente;
import com.softcode.projcodeapi.model.Project;
import com.softcode.projcodeapi.model.enums.ProjectStatus;
import com.softcode.projcodeapi.repository.ClienteRepository;
import com.softcode.projcodeapi.repository.ProjectRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Sort;

import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ClienteServiceImplTest {

    @Mock
    private ClienteRepository clienteRepository;

    @Mock
    private ProjectRepository projectRepository;

    @InjectMocks
    private ClienteServiceImpl clienteService;

    @Test
    void getAllClientes_withoutParams_shouldSortByIdDesc() {
        when(clienteRepository.findAll(any(Sort.class))).thenReturn(List.of());

        clienteService.getAllClientes();

        ArgumentCaptor<Sort> sortCaptor = ArgumentCaptor.forClass(Sort.class);
        verify(clienteRepository).findAll(sortCaptor.capture());
        Sort sort = sortCaptor.getValue();
        assertEquals(Sort.by(Sort.Direction.DESC, "id"), sort);
    }

    @Test
    void getAllClientes_withSearch_shouldCallSearchMethod() {
        when(clienteRepository.findByNombreContainingIgnoreCaseOrEmailContainingIgnoreCaseOrIdentificacionContainingIgnoreCase(
                anyString(), anyString(), anyString(), any(Sort.class))).thenReturn(List.of());

        clienteService.getAllClientes("test", "id", "desc");

        verify(clienteRepository).findByNombreContainingIgnoreCaseOrEmailContainingIgnoreCaseOrIdentificacionContainingIgnoreCase(
                eq("test"), eq("test"), eq("test"), any(Sort.class));
    }

    @Test
    void getAllClientes_withSortByName_shouldMapToNombre() {
        when(clienteRepository.findAll(any(Sort.class))).thenReturn(List.of());

        clienteService.getAllClientes(null, "name", "asc");

        ArgumentCaptor<Sort> sortCaptor = ArgumentCaptor.forClass(Sort.class);
        verify(clienteRepository).findAll(sortCaptor.capture());
        Sort sort = sortCaptor.getValue();
        assertEquals(Sort.by(Sort.Direction.ASC, "nombre"), sort);
    }

    @Test
    void getClienteById_shouldReturnCliente_whenFound() {
        Cliente cliente = new Cliente();
        cliente.setId(1L);
        cliente.setNombre("Test");
        when(clienteRepository.findById(1L)).thenReturn(Optional.of(cliente));

        Optional<Cliente> result = clienteService.getClienteById(1L);

        assertTrue(result.isPresent());
        assertEquals("Test", result.get().getNombre());
    }

    @Test
    void getClienteById_shouldReturnEmpty_whenNotFound() {
        when(clienteRepository.findById(1L)).thenReturn(Optional.empty());

        Optional<Cliente> result = clienteService.getClienteById(1L);

        assertFalse(result.isPresent());
    }

    @Test
    void saveCliente_shouldReturnSavedCliente() {
        Cliente cliente = new Cliente();
        cliente.setNombre("New Client");
        when(clienteRepository.save(cliente)).thenReturn(cliente);

        Cliente result = clienteService.saveCliente(cliente);

        assertEquals("New Client", result.getNombre());
        verify(clienteRepository).save(cliente);
    }

    @Test
    void deleteCliente_shouldThrowException_whenHasNonCancelledProjects() {
        Project activeProject = new Project();
        activeProject.setEstado(ProjectStatus.ACTIVO);
        when(projectRepository.findByClienteId(1L)).thenReturn(List.of(activeProject));

        RuntimeException exception = assertThrows(RuntimeException.class,
                () -> clienteService.deleteCliente(1L));

        assertTrue(exception.getMessage().contains("proyectos asociados"));
        verify(clienteRepository, never()).deleteById(any());
    }

    @Test
    void deleteCliente_shouldDelete_whenOnlyCancelledProjects() {
        Project cancelledProject = new Project();
        cancelledProject.setEstado(ProjectStatus.CANCELADO);
        when(projectRepository.findByClienteId(1L)).thenReturn(List.of(cancelledProject));

        clienteService.deleteCliente(1L);

        verify(clienteRepository).deleteById(1L);
    }

    @Test
    void deleteCliente_shouldDelete_whenNoProjects() {
        when(projectRepository.findByClienteId(1L)).thenReturn(Collections.emptyList());

        clienteService.deleteCliente(1L);

        verify(clienteRepository).deleteById(1L);
    }
}
