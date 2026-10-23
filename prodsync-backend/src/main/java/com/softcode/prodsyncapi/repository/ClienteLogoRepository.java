package com.softcode.prodsyncapi.repository;

import com.softcode.prodsyncapi.model.ClienteLogo;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ClienteLogoRepository extends JpaRepository<ClienteLogo, Long> {
}
