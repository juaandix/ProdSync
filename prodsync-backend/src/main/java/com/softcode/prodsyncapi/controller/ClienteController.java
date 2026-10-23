package com.softcode.prodsyncapi.controller;

import com.softcode.prodsyncapi.model.Cliente;
import com.softcode.prodsyncapi.service.ClienteService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.CacheControl;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;
import java.util.Map;
import java.util.concurrent.TimeUnit;

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

    // ── Logo ─────────────────────────────────────────────────────────────

    /** 1 MB: suficiente para un logo y por debajo del límite de multipart de Spring. */
    static final long MAX_LOGO_BYTES = 1024 * 1024;

    @GetMapping("/{id}/logo")
    @PreAuthorize("hasAnyRole('ADMIN','OPERATOR')")
    public ResponseEntity<byte[]> getLogo(@PathVariable Long id) {
        return clienteService.getLogo(id)
                .map(logo -> ResponseEntity.ok()
                        .contentType(MediaType.parseMediaType(logo.getContentType()))
                        // La URL lleva la versión del logo, así que puede cachearse
                        .cacheControl(CacheControl.maxAge(30, TimeUnit.DAYS).cachePrivate())
                        .header("X-Content-Type-Options", "nosniff")
                        .body(logo.getData()))
                .orElse(ResponseEntity.notFound().build());
    }

    @PutMapping(value = "/{id}/logo", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasAnyRole('ADMIN','OPERATOR')")
    public ResponseEntity<?> uploadLogo(@PathVariable Long id, @RequestParam("file") MultipartFile file) throws IOException {
        if (file.isEmpty()) {
            return badRequest("El archivo está vacío.");
        }
        if (file.getSize() > MAX_LOGO_BYTES) {
            return badRequest("El logo no puede superar 1 MB.");
        }
        byte[] data = file.getBytes();
        // El tipo lo decide la firma del archivo, no la cabecera que envía el cliente
        String contentType = detectImageType(data);
        if (contentType == null) {
            return badRequest("Formato no admitido. Usa PNG, JPG o WebP.");
        }
        return clienteService.saveLogo(id, contentType, data)
                .<ResponseEntity<?>>map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}/logo")
    @PreAuthorize("hasAnyRole('ADMIN','OPERATOR')")
    public ResponseEntity<Cliente> deleteLogo(@PathVariable Long id) {
        return clienteService.deleteLogo(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    /** PNG, JPEG o WebP según los primeros bytes; null para cualquier otra cosa (SVG incluido). */
    static String detectImageType(byte[] d) {
        if (d.length >= 8 && (d[0] & 0xFF) == 0x89 && d[1] == 'P' && d[2] == 'N' && d[3] == 'G') {
            return MediaType.IMAGE_PNG_VALUE;
        }
        if (d.length >= 3 && (d[0] & 0xFF) == 0xFF && (d[1] & 0xFF) == 0xD8 && (d[2] & 0xFF) == 0xFF) {
            return MediaType.IMAGE_JPEG_VALUE;
        }
        if (d.length >= 12 && d[0] == 'R' && d[1] == 'I' && d[2] == 'F' && d[3] == 'F'
                && d[8] == 'W' && d[9] == 'E' && d[10] == 'B' && d[11] == 'P') {
            return "image/webp";
        }
        return null;
    }

    private ResponseEntity<Map<String, String>> badRequest(String message) {
        return ResponseEntity.badRequest().body(Map.of("message", message));
    }
}
