package com.softcode.prodsyncapi.service;

import com.softcode.prodsyncapi.ai.dto.UserPerformanceDto;
import com.softcode.prodsyncapi.model.Task;
import com.softcode.prodsyncapi.model.TimeEntry;
import com.softcode.prodsyncapi.model.User;
import com.softcode.prodsyncapi.model.enums.TaskStatus;
import com.softcode.prodsyncapi.model.enums.UserStatus;
import com.softcode.prodsyncapi.repository.TaskRepository;
import com.softcode.prodsyncapi.repository.TimeEntryRepository;
import com.softcode.prodsyncapi.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class UserPerformanceServiceTest {

    @Mock private TimeEntryRepository timeEntryRepository;
    @Mock private TaskRepository       taskRepository;
    @Mock private UserRepository       userRepository;

    @InjectMocks
    private UserPerformanceService userPerformanceService;

    private User user;
    private Task completedTask;
    private Task pendingTask;

    @BeforeEach
    void setUp() {
        user = new User("dev1", "pass", "dev1@test.com", "Dev One", UserStatus.ACTIVE, "ROLE_USER");
        user.setId(1L);

        completedTask = new Task();
        completedTask.setId(10L);
        completedTask.setEstado(TaskStatus.COMPLETADO);
        completedTask.setEstimacion(8.0);
        completedTask.setStoryPoints(5);

        pendingTask = new Task();
        pendingTask.setId(11L);
        pendingTask.setEstado(TaskStatus.PENDIENTE);
        pendingTask.setEstimacion(4.0);
        pendingTask.setStoryPoints(3);
    }

    private TimeEntry buildEntry(Long id, User u, Task t, String type, double hours, String date) {
        TimeEntry e = new TimeEntry();
        e.setId(id);
        e.setUser(u);
        e.setTask(t);
        e.setType(type);
        e.setHours(hours);
        e.setDate(date);
        return e;
    }

    @Test
    void getUserPerformanceProfiles_shouldReturnEmptyList_whenNoUsersHaveEntries() {
        when(userRepository.findAll()).thenReturn(List.of(user));
        when(timeEntryRepository.findAll()).thenReturn(List.of());
        when(taskRepository.findAll()).thenReturn(List.of());

        List<UserPerformanceDto> result = userPerformanceService.getUserPerformanceProfiles();

        assertTrue(result.isEmpty());
    }

    @Test
    void getUserPerformanceProfiles_shouldCalculateSpecializationFromMaxHours() {
        String today = LocalDate.now().toString();
        TimeEntry devEntry     = buildEntry(1L, user, completedTask, "DESARROLLO", 6.0, today);
        TimeEntry testingEntry = buildEntry(2L, user, pendingTask,   "TESTING",    2.0, today);

        when(userRepository.findAll()).thenReturn(List.of(user));
        when(timeEntryRepository.findAll()).thenReturn(List.of(devEntry, testingEntry));
        when(taskRepository.findAll()).thenReturn(List.of(completedTask, pendingTask));

        List<UserPerformanceDto> profiles = userPerformanceService.getUserPerformanceProfiles();

        assertEquals(1, profiles.size());
        assertEquals("DESARROLLO", profiles.get(0).getEspecializacion());
        assertEquals("Dev One", profiles.get(0).getNombre());
        assertEquals(1L, profiles.get(0).getUserId());
    }

    @Test
    void getUserPerformanceProfiles_shouldCalculateCompletionRate() {
        String today = LocalDate.now().toString();
        // 1 completed task, 1 pending task → rate = 0.5
        TimeEntry e1 = buildEntry(1L, user, completedTask, "DESARROLLO", 4.0, today);
        TimeEntry e2 = buildEntry(2L, user, pendingTask,   "DESARROLLO", 4.0, today);

        when(userRepository.findAll()).thenReturn(List.of(user));
        when(timeEntryRepository.findAll()).thenReturn(List.of(e1, e2));
        when(taskRepository.findAll()).thenReturn(List.of(completedTask, pendingTask));

        List<UserPerformanceDto> profiles = userPerformanceService.getUserPerformanceProfiles();

        assertEquals(0.5, profiles.get(0).getTasaFinalizacion());
    }

    @Test
    void getUserPerformanceProfiles_shouldCountRecentHoursCorrectly() {
        String today         = LocalDate.now().toString();
        String ninetyDaysAgo = LocalDate.now().minusDays(90).toString();

        TimeEntry recentEntry = buildEntry(1L, user, completedTask, "DESARROLLO", 5.0, today);
        TimeEntry oldEntry    = buildEntry(2L, user, completedTask, "DESARROLLO", 3.0, ninetyDaysAgo);

        when(userRepository.findAll()).thenReturn(List.of(user));
        when(timeEntryRepository.findAll()).thenReturn(List.of(recentEntry, oldEntry));
        when(taskRepository.findAll()).thenReturn(List.of(completedTask));

        List<UserPerformanceDto> profiles = userPerformanceService.getUserPerformanceProfiles();

        // horasUltimos7Dias: only today's entry
        assertEquals(5.0, profiles.get(0).getHorasUltimos7Dias());
        // horasUltimos30Dias: only today's entry
        assertEquals(5.0, profiles.get(0).getHorasUltimos30Dias());
    }

    @Test
    void getUserPerformanceProfiles_shouldCalculateEfficiencyPerType() {
        String today = LocalDate.now().toString();
        // Task estimated 8h, user logged 6h → efficiency = 6/8 = 0.75
        TimeEntry entry = buildEntry(1L, user, completedTask, "DESARROLLO", 6.0, today);

        when(userRepository.findAll()).thenReturn(List.of(user));
        when(timeEntryRepository.findAll()).thenReturn(List.of(entry));
        when(taskRepository.findAll()).thenReturn(List.of(completedTask));

        List<UserPerformanceDto> profiles = userPerformanceService.getUserPerformanceProfiles();

        assertEquals(0.75, profiles.get(0).getEficienciaPorTipo().get("DESARROLLO"));
    }

    @Test
    void getUserPerformanceProfiles_shouldSkipUsersWithNoEntries() {
        User userWithNoEntries = new User("dev2", "pass", "dev2@test.com", "Dev Two",
                UserStatus.ACTIVE, "ROLE_USER");
        userWithNoEntries.setId(2L);

        String today  = LocalDate.now().toString();
        TimeEntry entry = buildEntry(1L, user, completedTask, "DESARROLLO", 4.0, today);

        when(userRepository.findAll()).thenReturn(List.of(user, userWithNoEntries));
        when(timeEntryRepository.findAll()).thenReturn(List.of(entry));
        when(taskRepository.findAll()).thenReturn(List.of(completedTask));

        List<UserPerformanceDto> profiles = userPerformanceService.getUserPerformanceProfiles();

        assertEquals(1, profiles.size());
        assertEquals(1L, profiles.get(0).getUserId());
    }
}
