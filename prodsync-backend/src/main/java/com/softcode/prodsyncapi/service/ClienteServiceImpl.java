package com.softcode.prodsyncapi.service;

import com.softcode.prodsyncapi.model.Cliente;
import com.softcode.prodsyncapi.model.Project;
import com.softcode.prodsyncapi.model.enums.ProjectStatus;
import com.softcode.prodsyncapi.repository.ClienteRepository;
import com.softcode.prodsyncapi.repository.ProjectRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class ClienteServiceImpl implements ClienteService {

    @Autowired
    private ClienteRepository clienteRepository;

    @Autowired
    private ProjectRepository projectRepository;

    @Override
    public List<Cliente> getAllClientes() {
        // Default to sorting by ID in descending order, no search
        return getAllClientes(null, "id", "desc");
    }

    @Override
    public List<Cliente> getAllClientes(String search, String sortBy, String sortOrder) {
        Sort sort = Sort.unsorted(); // Default no sort

        if (sortBy != null && !sortBy.trim().isEmpty()) {
            Sort.Direction direction = "desc".equalsIgnoreCase(sortOrder) ? Sort.Direction.DESC : Sort.Direction.ASC;
            // Use "nombre" for sorting if "name" is requested (assuming name maps to nombre in frontend requests)
            String actualSortBy = sortBy; // Adjust if frontend sends "name" for "nombre"
            if ("name".equalsIgnoreCase(sortBy)) {
                actualSortBy = "nombre";
            } else if ("email".equalsIgnoreCase(sortBy)) {
                actualSortBy = "email";
            } else if ("identificacion".equalsIgnoreCase(sortBy)) {
                actualSortBy = "identificacion";
            }
            sort = Sort.by(direction, actualSortBy);
        } else {
            // Default sort if no sortBy is provided, sort by ID descending
            sort = Sort.by(Sort.Direction.DESC, "id");
        }

        if (search != null && !search.trim().isEmpty()) {
            String searchTerm = search.toLowerCase();
            return clienteRepository.findByNombreContainingIgnoreCaseOrEmailContainingIgnoreCaseOrIdentificacionContainingIgnoreCase(
                    searchTerm, searchTerm, searchTerm, sort);
        } else {
            return clienteRepository.findAll(sort);
        }
    }

    @Override
    public Optional<Cliente> getClienteById(Long id) {
        return clienteRepository.findById(id);
    }

    @Override
    public Optional<Cliente> getClienteByIdentificacion(String identificacion) {
        return clienteRepository.findByIdentificacion(identificacion);
    }

    @Override
    public Cliente saveCliente(Cliente cliente) {
        return clienteRepository.save(cliente);
    }

    @Override
    public void deleteCliente(Long id) {
        List<Project> projects = projectRepository.findByClienteId(id);
        boolean hasNonCancelledProjects = projects.stream()
            .anyMatch(project -> project.getEstado() != ProjectStatus.CANCELADO);

        if (hasNonCancelledProjects) {
            throw new RuntimeException("No se puede eliminar el cliente porque tiene proyectos asociados que no están cancelados.");
        }

        clienteRepository.deleteById(id);
    }

    @Override
    public void deleteById(Long id) {
        this.deleteCliente(id); // Re-route to apply the business logic
    }
}