package com.softcode.prodsyncapi.service;

import com.softcode.prodsyncapi.model.Task;
import java.util.List;
import java.util.Optional;

public interface TaskService {
    List<Task> getAllTasks();
    List<Task> getTasksByProjectId(Long projectId);
    Optional<Task> getTaskById(Long id);
    Task saveTask(Task task);
    void deleteTask(Long id);
}
