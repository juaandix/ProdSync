package com.softcode.projcodeapi.service;

import com.softcode.projcodeapi.model.Cliente;
import java.util.List;
import java.util.Optional;

public interface ClienteService {
    List<Cliente> getAllClientes();
    List<Cliente> getAllClientes(String search, String sortBy, String sortOrder);
    Optional<Cliente> getClienteById(Long id);
    Optional<Cliente> getClienteByIdentificacion(String identificacion);
    Cliente saveCliente(Cliente cliente);
    void deleteCliente(Long id);
    void deleteById(Long id);

}