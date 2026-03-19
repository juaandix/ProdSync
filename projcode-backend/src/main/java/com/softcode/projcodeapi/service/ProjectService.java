package com.softcode.projcodeapi.service;

import com.softcode.projcodeapi.model.Project;
import java.util.List;
import java.util.Optional;

public interface ProjectService {
    List<Project> getAllProjects();
    List<Project> getAllProjects(String search, String sortBy, String sortOrder);
    Optional<Project> getProjectById(Long id);
    Optional<Project> getProjectByNombre(String nombre);
    Project saveProject(Project project);
    void deleteProject(Long id);
}