package com.softcode.projcodeapi.controller;

import com.softcode.projcodeapi.model.TimeEntry;
import com.softcode.projcodeapi.model.User;
import com.softcode.projcodeapi.service.TimeEntryService;
import com.softcode.projcodeapi.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.security.Principal;
import java.util.List;

@RestController
@RequestMapping("/api/time-entries")
@CrossOrigin(origins = "http://localhost:3000")
public class TimeEntryController {

    @Autowired
    private TimeEntryService timeEntryService;

    @Autowired
    private UserService userService;

    @GetMapping
    public List<TimeEntry> getAllTimeEntries(
            @RequestParam(required = false) Long taskId,
            @RequestParam(required = false) Long userId,
            Principal principal
    ) {
        boolean isAdmin = hasRole("ROLE_ADMIN");
        Long effectiveUserId = userId;

        if (!isAdmin) {
            effectiveUserId = getCurrentUser(principal).getId();
        }

        if (taskId != null) {
            if (isAdmin) {
                return timeEntryService.getTimeEntriesByTaskId(taskId);
            } else {
                return timeEntryService.getTimeEntriesByTaskIdAndUserId(taskId, effectiveUserId);
            }
        }
        if (effectiveUserId != null) {
            return timeEntryService.getTimeEntriesByUserId(effectiveUserId);
        }
        return timeEntryService.getAllTimeEntries();
    }

    @GetMapping("/{id}")
    public ResponseEntity<TimeEntry> getTimeEntryById(@PathVariable Long id, Principal principal) {
        return timeEntryService.getTimeEntryById(id)
                .map(entry -> {
                    if (!hasRole("ROLE_ADMIN")) {
                        User current = getCurrentUser(principal);
                        if (entry.getUser() == null || entry.getUser().getId() == null || !entry.getUser().getId().equals(current.getId())) {
                            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "No tienes permiso para ver esta entrada");
                        }
                    }
                    return ResponseEntity.ok(entry);
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<TimeEntry> createTimeEntry(
            @RequestBody TimeEntry timeEntry,
            Principal principal
    ) {
        User currentUser = getCurrentUser(principal);
        timeEntry.setUser(currentUser);

        TimeEntry saved = timeEntryService.saveTimeEntry(timeEntry);
        return new ResponseEntity<>(saved, HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<TimeEntry> updateTimeEntry(@PathVariable Long id, @RequestBody TimeEntry timeEntry, Principal principal) {
        return timeEntryService.getTimeEntryById(id)
                .map(existing -> {
                    if (!hasRole("ROLE_ADMIN")) {
                        User current = getCurrentUser(principal);
                        if (existing.getUser() == null || existing.getUser().getId() == null || !existing.getUser().getId().equals(current.getId())) {
                            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "No tienes permiso para editar esta entrada");
                        }
                    }

                    // Mantener el user original (no permitir cambiar el autor)
                    timeEntry.setId(id);
                    timeEntry.setUser(existing.getUser());

                    TimeEntry updated = timeEntryService.saveTimeEntry(timeEntry);
                    return ResponseEntity.ok(updated);
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Void> deleteTimeEntry(@PathVariable Long id, Principal principal) {
        return timeEntryService.getTimeEntryById(id)
                .<ResponseEntity<Void>>map(existing -> {
                    if (!hasRole("ROLE_ADMIN")) {
                        User current = getCurrentUser(principal);
                        if (existing.getUser() == null || existing.getUser().getId() == null || !existing.getUser().getId().equals(current.getId())) {
                            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "No tienes permiso para borrar esta entrada");
                        }
                    }
                    timeEntryService.deleteTimeEntry(id);
                    return ResponseEntity.noContent().build();
                })
                .orElse(ResponseEntity.notFound().build());
    }

    private boolean hasRole(String role) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || auth.getAuthorities() == null) return false;
        return auth.getAuthorities().stream().anyMatch(a -> role.equals(a.getAuthority()));
    }

    private User getCurrentUser(Principal principal) {
        String name = principal != null ? principal.getName() : null;
        if (name == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "No autenticado");
        }
        return userService.getUserByUsername(name)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Usuario no encontrado"));
    }
}
