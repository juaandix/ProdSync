package com.softcode.projcodeapi.controller;

import com.softcode.projcodeapi.model.Task;
import com.softcode.projcodeapi.service.TaskService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/tasks")
@CrossOrigin(origins = "http://localhost:3000")
public class TaskController {

    @Autowired
    private TaskService taskService;

    @GetMapping
    public List<Task> getAllTasks(@RequestParam(required = false) Long projectId) {
        if (projectId != null) {
            return taskService.getTasksByProjectId(projectId);
        }
        return taskService.getAllTasks();
    }

    @GetMapping("/{id}")
    public ResponseEntity<Task> getTaskById(@PathVariable Long id) {
        return taskService.getTaskById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN','OPERATOR')")
    public ResponseEntity<Task> createTask(@RequestBody Task task) {
        Task savedTask = taskService.saveTask(task);
        return new ResponseEntity<>(savedTask, HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','OPERATOR')")
    public ResponseEntity<Task> updateTask(@PathVariable Long id, @RequestBody Task task) {
        return taskService.getTaskById(id)
                .map(existingTask -> {
                    task.setId(id);
                    Task updatedTask = taskService.saveTask(task);
                    return ResponseEntity.ok(updatedTask);
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','OPERATOR')")
    public ResponseEntity<Void> deleteTask(@PathVariable Long id) {
        taskService.deleteTask(id);
        return ResponseEntity.noContent().build();
    }
}