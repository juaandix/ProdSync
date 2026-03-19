package com.softcode.projcodeapi.controller;

import com.softcode.projcodeapi.model.Cliente;
import com.softcode.projcodeapi.service.ClienteService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/clientes")
public class ClienteController {

    @Autowired
    private ClienteService clienteService;

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN','OPERATOR')")
    public List<Cliente> getAllClientes(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String sortBy,
            @RequestParam(required = false) String sortOrder
    ) {
        return clienteService.getAllClientes(search, sortBy, sortOrder);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','OPERATOR')")
    public ResponseEntity<Cliente> getClienteById(@PathVariable Long id) {
        return clienteService.getClienteById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN','OPERATOR')")
    public ResponseEntity<Cliente> createCliente(@Valid @RequestBody Cliente cliente) {
        Cliente savedCliente = clienteService.saveCliente(cliente);
        return new ResponseEntity<>(savedCliente, HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','OPERATOR')")
    public ResponseEntity<Cliente> updateCliente(@PathVariable Long id, @Valid @RequestBody Cliente cliente) {
        return clienteService.getClienteById(id)
                .map(existingCliente -> {
                    existingCliente.setNombre(cliente.getNombre());
                    existingCliente.setEmail(cliente.getEmail());
                    existingCliente.setLocalidad(cliente.getLocalidad());
                    existingCliente.setProvincia(cliente.getProvincia());
                    existingCliente.setIdentificacion(cliente.getIdentificacion());
                    existingCliente.setContactPerson(cliente.getContactPerson());
                    return ResponseEntity.ok(clienteService.saveCliente(existingCliente));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','OPERATOR')")
    public ResponseEntity<Void> deleteCliente(@PathVariable Long id) {
        clienteService.deleteCliente(id);
        return ResponseEntity.noContent().build();
    }
}