package com.softcode.prodsyncapi.controller;

import com.softcode.prodsyncapi.model.CalendarEvent;
import com.softcode.prodsyncapi.repository.CalendarEventRepository;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/calendar-events")
@CrossOrigin(origins = "http://localhost:3000")
public class CalendarEventController {

    @Autowired
    private CalendarEventRepository repository;

    @GetMapping
    public List<CalendarEvent> getAll() {
        return repository.findAll();
    }

    @GetMapping("/{id}")
    public ResponseEntity<CalendarEvent> getById(@PathVariable Long id) {
        return repository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<CalendarEvent> create(@Valid @RequestBody CalendarEvent event) {
        return new ResponseEntity<>(repository.save(event), HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    public ResponseEntity<CalendarEvent> update(@PathVariable Long id, @Valid @RequestBody CalendarEvent event) {
        return repository.findById(id).map(existing -> {
            event.setId(id);
            return ResponseEntity.ok(repository.save(event));
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        repository.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
