package com.softcode.projcodeapi.service;

import com.softcode.projcodeapi.model.Task;
import com.softcode.projcodeapi.repository.TaskRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class TaskServiceImplTest {

    @Mock
    private TaskRepository taskRepository;

    @InjectMocks
    private TaskServiceImpl taskService;

    @Test
    void getAllTasks_shouldReturnAllTasks() {
        Task task = new Task();
        task.setId(1L);
        when(taskRepository.findAll()).thenReturn(List.of(task));

        List<Task> result = taskService.getAllTasks();

        assertEquals(1, result.size());
    }

    @Test
    void getTasksByProjectId_shouldReturnFilteredTasks() {
        Task task = new Task();
        task.setId(1L);
        when(taskRepository.findByProjectId(10L)).thenReturn(List.of(task));

        List<Task> result = taskService.getTasksByProjectId(10L);

        assertEquals(1, result.size());
        verify(taskRepository).findByProjectId(10L);
    }

    @Test
    void getTaskById_shouldReturnTask_whenFound() {
        Task task = new Task();
        task.setId(1L);
        task.setDescripcion("Test task");
        when(taskRepository.findById(1L)).thenReturn(Optional.of(task));

        Optional<Task> result = taskService.getTaskById(1L);

        assertTrue(result.isPresent());
        assertEquals("Test task", result.get().getDescripcion());
    }

    @Test
    void saveTask_shouldReturnSavedTask() {
        Task task = new Task();
        task.setDescripcion("New task");
        when(taskRepository.save(task)).thenReturn(task);

        Task result = taskService.saveTask(task);

        assertEquals("New task", result.getDescripcion());
    }

    @Test
    void deleteTask_shouldCallRepository() {
        taskService.deleteTask(1L);
        verify(taskRepository).deleteById(1L);
    }
}
