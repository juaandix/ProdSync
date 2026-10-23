package com.softcode.prodsyncapi.service;

import com.softcode.prodsyncapi.model.Cliente;
import com.softcode.prodsyncapi.model.ClienteLogo;
import com.softcode.prodsyncapi.model.Project;
import com.softcode.prodsyncapi.model.enums.ProjectStatus;
import com.softcode.prodsyncapi.repository.ClienteLogoRepository;
import com.softcode.prodsyncapi.repository.ClienteRepository;
import com.softcode.prodsyncapi.repository.ProjectRepository;
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

    @Mock
    private ClienteLogoRepository clienteLogoRepository;

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

    @Test
    void deleteCliente_shouldAlsoDeleteItsLogo() {
        when(projectRepository.findByClienteId(1L)).thenReturn(Collections.emptyList());
        when(clienteLogoRepository.existsById(1L)).thenReturn(true);

        clienteService.deleteCliente(1L);

        verify(clienteLogoRepository).deleteById(1L);
        verify(clienteRepository).deleteById(1L);
    }

    @Test
    void saveLogo_shouldStoreImageAndStampVersion() {
        Cliente cliente = new Cliente();
        cliente.setId(1L);
        when(clienteRepository.findById(1L)).thenReturn(Optional.of(cliente));
        when(clienteRepository.save(any(Cliente.class))).thenAnswer(inv -> inv.getArgument(0));

        Optional<Cliente> result = clienteService.saveLogo(1L, "image/png", new byte[]{1, 2, 3});

        assertTrue(result.isPresent());
        assertNotNull(result.get().getLogoVersion());
        ArgumentCaptor<ClienteLogo> logo = ArgumentCaptor.forClass(ClienteLogo.class);
        verify(clienteLogoRepository).save(logo.capture());
        assertEquals(1L, logo.getValue().getClienteId());
        assertEquals("image/png", logo.getValue().getContentType());
    }

    @Test
    void saveLogo_shouldReturnEmpty_whenClientMissing() {
        when(clienteRepository.findById(99L)).thenReturn(Optional.empty());

        assertTrue(clienteService.saveLogo(99L, "image/png", new byte[]{1}).isEmpty());
        verify(clienteLogoRepository, never()).save(any());
    }

    @Test
    void deleteLogo_shouldClearVersion() {
        Cliente cliente = new Cliente();
        cliente.setId(1L);
        cliente.setLogoVersion(123L);
        when(clienteRepository.findById(1L)).thenReturn(Optional.of(cliente));
        when(clienteRepository.save(any(Cliente.class))).thenAnswer(inv -> inv.getArgument(0));
        when(clienteLogoRepository.existsById(1L)).thenReturn(true);

        Optional<Cliente> result = clienteService.deleteLogo(1L);

        assertTrue(result.isPresent());
        assertNull(result.get().getLogoVersion());
        verify(clienteLogoRepository).deleteById(1L);
    }
}
