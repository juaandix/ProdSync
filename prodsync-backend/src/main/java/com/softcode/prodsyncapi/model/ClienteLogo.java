package com.softcode.prodsyncapi.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

/**
 * Logo de un cliente. Vive en su propia tabla para que el JSON de clientes
 * no cargue la imagen; se sirve aparte en /api/clientes/{id}/logo.
 */
@Entity
@Table(name = "cliente_logos")
public class ClienteLogo {

    /** Mismo id que el cliente al que pertenece. */
    @Id
    private Long clienteId;

    @Column(name = "content_type", nullable = false)
    private String contentType;

    // byte[] se mapea a bytea en PostgreSQL
    @Column(nullable = false)
    private byte[] data;

    public ClienteLogo() {
    }

    public ClienteLogo(Long clienteId, String contentType, byte[] data) {
        this.clienteId = clienteId;
        this.contentType = contentType;
        this.data = data;
    }

    public Long getClienteId() {
        return clienteId;
    }

    public String getContentType() {
        return contentType;
    }

    public byte[] getData() {
        return data;
    }
}
