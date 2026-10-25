package com.softcode.prodsyncapi.service;

import com.softcode.prodsyncapi.model.Cliente;
import com.softcode.prodsyncapi.model.ClienteLogo;
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

    /** Guarda o reemplaza el logo. Vacío si el cliente no existe. */
    Optional<Cliente> saveLogo(Long id, String contentType, byte[] data);
    Optional<ClienteLogo> getLogo(Long id);
    /** Quita el logo. Vacío si el cliente no existe. */
    Optional<Cliente> deleteLogo(Long id);

}