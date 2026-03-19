package com.softcode.projcodeapi.repository;

import com.softcode.projcodeapi.model.Cliente;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ClienteRepository extends JpaRepository<Cliente, Long> {
    Optional<Cliente> findByIdentificacion(String identificacion);
    List<Cliente> findByNombreContainingIgnoreCaseOrEmailContainingIgnoreCaseOrIdentificacionContainingIgnoreCase(String nombre, String email, String identificacion, Sort sort);
}