package com.softcode.prodsyncapi.service;

import com.softcode.prodsyncapi.model.Project;
import com.softcode.prodsyncapi.repository.ProjectRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class ProjectServiceImpl implements ProjectService {

    @Autowired
    private ProjectRepository projectRepository;

    @Override
    public List<Project> getAllProjects() {
        // Default to sorting by ID in descending order, no search
        return getAllProjects(null, "id", "desc");
    }

    @Override
    public List<Project> getAllProjects(String search, String sortBy, String sortOrder) {
        Sort sort = Sort.unsorted(); // Default no sort

        if (sortBy != null && !sortBy.trim().isEmpty()) {
            Sort.Direction direction = "desc".equalsIgnoreCase(sortOrder) ? Sort.Direction.DESC : Sort.Direction.ASC;
            // Map frontend sort requests to actual entity fields
            String actualSortBy = sortBy;
            if ("name".equalsIgnoreCase(sortBy)) { // Assuming frontend might send "name" for "nombre"
                actualSortBy = "nombre";
            } else if ("description".equalsIgnoreCase(sortBy)) {
                actualSortBy = "descripcion";
            }
            sort = Sort.by(direction, actualSortBy);
        } else {
            // Default sort if no sortBy is provided, sort by ID descending
            sort = Sort.by(Sort.Direction.DESC, "id");
        }

        if (search != null && !search.trim().isEmpty()) {
            String searchTerm = search.toLowerCase();
            return projectRepository.findByNombreContainingIgnoreCaseOrDescripcionContainingIgnoreCase(
                    searchTerm, searchTerm, sort);
        } else {
            return projectRepository.findAll(sort);
        }
    }

    @Override
    public Optional<Project> getProjectById(Long id) {
        return projectRepository.findById(id);
    }

    @Override
    public Optional<Project> getProjectByNombre(String nombre) {
        return projectRepository.findByNombre(nombre);
    }

    @Override
    public Project saveProject(Project project) {
        return projectRepository.save(project);
    }

    @Override
    public void deleteProject(Long id) {
        projectRepository.deleteById(id);
    }
}