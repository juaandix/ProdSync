package com.softcode.prodsyncapi.service;

import com.softcode.prodsyncapi.ai.dto.UserPerformanceDto;
import com.softcode.prodsyncapi.model.Task;
import com.softcode.prodsyncapi.model.TimeEntry;
import com.softcode.prodsyncapi.model.User;
import com.softcode.prodsyncapi.model.enums.TaskStatus;
import com.softcode.prodsyncapi.repository.TaskRepository;
import com.softcode.prodsyncapi.repository.TimeEntryRepository;
import com.softcode.prodsyncapi.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class UserPerformanceService {

    @Autowired
    private TimeEntryRepository timeEntryRepository;

    @Autowired
    private TaskRepository taskRepository;

    @Autowired
    private UserRepository userRepository;

    @Transactional(readOnly = true)
    public List<UserPerformanceDto> getUserPerformanceProfiles() {
        String date7DaysAgo  = LocalDate.now().minusDays(7).toString();
        String date30DaysAgo = LocalDate.now().minusDays(30).toString();
        String date90DaysAgo = LocalDate.now().minusDays(90).toString();

        List<User> users = userRepository.findAll();
        List<TimeEntry> allEntries = timeEntryRepository.findAll();

        Map<Long, Task> tasksById = taskRepository.findAll()
                .stream().collect(Collectors.toMap(Task::getId, t -> t));

        Map<Long, List<TimeEntry>> entriesByUser = allEntries.stream()
                .filter(e -> e.getUser() != null)
                .collect(Collectors.groupingBy(e -> e.getUser().getId()));

        List<UserPerformanceDto> profiles = new ArrayList<>();

        for (User user : users) {
            List<TimeEntry> userEntries = entriesByUser.getOrDefault(user.getId(), List.of());
            if (userEntries.isEmpty()) continue;

            // Total hours per type
            Map<String, Double> hoursByType = userEntries.stream()
                    .filter(e -> e.getType() != null)
                    .collect(Collectors.groupingBy(TimeEntry::getType,
                            Collectors.summingDouble(e -> e.getHours() != null ? e.getHours() : 0.0)));

            // Efficiency = actual hours / estimated hours per type (< 1 means faster than estimated)
            Map<String, Double> actualByType    = new HashMap<>();
            Map<String, Double> estimatedByType = new HashMap<>();
            for (TimeEntry e : userEntries) {
                if (e.getType() == null || e.getTask() == null) continue;
                Task task = tasksById.get(e.getTask().getId());
                if (task == null || task.getEstimacion() == null || task.getEstimacion() <= 0) continue;
                actualByType.merge(e.getType(), e.getHours() != null ? e.getHours() : 0.0, Double::sum);
                estimatedByType.merge(e.getType(), task.getEstimacion(), Double::sum);
            }

            Map<String, Double> eficienciaPorTipo = new HashMap<>();
            for (String type : hoursByType.keySet()) {
                double estimated = estimatedByType.getOrDefault(type, 0.0);
                double actual    = actualByType.getOrDefault(type, hoursByType.get(type));
                if (estimated > 0) {
                    eficienciaPorTipo.put(type, Math.round((actual / estimated) * 100.0) / 100.0);
                }
            }

            // Story points per week over last 90 days
            Set<Long> completedTaskIds = userEntries.stream()
                    .filter(e -> e.getTask() != null
                            && e.getDate() != null
                            && e.getDate().compareTo(date90DaysAgo) >= 0)
                    .map(e -> e.getTask().getId())
                    .filter(id -> {
                        Task t = tasksById.get(id);
                        return t != null && TaskStatus.COMPLETADO.equals(t.getEstado());
                    })
                    .collect(Collectors.toSet());

            double totalSP = completedTaskIds.stream()
                    .mapToDouble(id -> {
                        Task t = tasksById.get(id);
                        return (t != null && t.getStoryPoints() != null) ? t.getStoryPoints() : 0;
                    }).sum();
            double spPorSemana = Math.round((totalSP / 13.0) * 10.0) / 10.0;

            // Completion rate across all tasks the user has worked on
            Set<Long> allTaskIds = userEntries.stream()
                    .filter(e -> e.getTask() != null)
                    .map(e -> e.getTask().getId())
                    .collect(Collectors.toSet());

            long completedCount = allTaskIds.stream()
                    .filter(id -> {
                        Task t = tasksById.get(id);
                        return t != null && TaskStatus.COMPLETADO.equals(t.getEstado());
                    }).count();

            double tasaFinalizacion = allTaskIds.isEmpty() ? 0.0
                    : Math.round(((double) completedCount / allTaskIds.size()) * 100.0) / 100.0;

            // Recent workload
            double horas7 = userEntries.stream()
                    .filter(e -> e.getDate() != null && e.getDate().compareTo(date7DaysAgo) >= 0)
                    .mapToDouble(e -> e.getHours() != null ? e.getHours() : 0.0).sum();

            double horas30 = userEntries.stream()
                    .filter(e -> e.getDate() != null && e.getDate().compareTo(date30DaysAgo) >= 0)
                    .mapToDouble(e -> e.getHours() != null ? e.getHours() : 0.0).sum();

            // Specialization: type with the most hours
            String especializacion = hoursByType.entrySet().stream()
                    .max(Map.Entry.comparingByValue())
                    .map(Map.Entry::getKey)
                    .orElse("DESARROLLO");

            profiles.add(new UserPerformanceDto(
                    user.getId(), user.getNombre(),
                    eficienciaPorTipo, spPorSemana, tasaFinalizacion,
                    horas7, horas30, especializacion
            ));
        }

        return profiles;
    }
}
