package com.softcode.projcodeapi.service;

import com.softcode.projcodeapi.model.Project;
import com.softcode.projcodeapi.repository.ProjectRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Sort;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ProjectServiceImplTest {

    @Mock
    private ProjectRepository projectRepository;

    @InjectMocks
    private ProjectServiceImpl projectService;

    @Test
    void getAllProjects_withoutParams_shouldSortByIdDesc() {
        when(projectRepository.findAll(any(Sort.class))).thenReturn(List.of());

        projectService.getAllProjects();

        ArgumentCaptor<Sort> sortCaptor = ArgumentCaptor.forClass(Sort.class);
        verify(projectRepository).findAll(sortCaptor.capture());
        assertEquals(Sort.by(Sort.Direction.DESC, "id"), sortCaptor.getValue());
    }

    @Test
    void getAllProjects_withSearch_shouldCallSearchMethod() {
        when(projectRepository.findByNombreContainingIgnoreCaseOrDescripcionContainingIgnoreCase(
                anyString(), anyString(), any(Sort.class))).thenReturn(List.of());

        projectService.getAllProjects("test", "id", "desc");

        verify(projectRepository).findByNombreContainingIgnoreCaseOrDescripcionContainingIgnoreCase(
                eq("test"), eq("test"), any(Sort.class));
    }

    @Test
    void getAllProjects_withSortByName_shouldMapToNombre() {
        when(projectRepository.findAll(any(Sort.class))).thenReturn(List.of());

        projectService.getAllProjects(null, "name", "asc");

        ArgumentCaptor<Sort> sortCaptor = ArgumentCaptor.forClass(Sort.class);
        verify(projectRepository).findAll(sortCaptor.capture());
        assertEquals(Sort.by(Sort.Direction.ASC, "nombre"), sortCaptor.getValue());
    }

    @Test
    void getAllProjects_withSortByDescription_shouldMapToDescripcion() {
        when(projectRepository.findAll(any(Sort.class))).thenReturn(List.of());

        projectService.getAllProjects(null, "description", "desc");

        ArgumentCaptor<Sort> sortCaptor = ArgumentCaptor.forClass(Sort.class);
        verify(projectRepository).findAll(sortCaptor.capture());
        assertEquals(Sort.by(Sort.Direction.DESC, "descripcion"), sortCaptor.getValue());
    }

    @Test
    void getProjectById_shouldReturnProject_whenFound() {
        Project project = new Project();
        project.setId(1L);
        project.setNombre("Test Project");
        when(projectRepository.findById(1L)).thenReturn(Optional.of(project));

        Optional<Project> result = projectService.getProjectById(1L);

        assertTrue(result.isPresent());
        assertEquals("Test Project", result.get().getNombre());
    }

    @Test
    void saveProject_shouldReturnSavedProject() {
        Project project = new Project();
        project.setNombre("New Project");
        when(projectRepository.save(project)).thenReturn(project);

        Project result = projectService.saveProject(project);

        assertEquals("New Project", result.getNombre());
    }

    @Test
    void deleteProject_shouldCallRepository() {
        projectService.deleteProject(1L);
        verify(projectRepository).deleteById(1L);
    }
}
