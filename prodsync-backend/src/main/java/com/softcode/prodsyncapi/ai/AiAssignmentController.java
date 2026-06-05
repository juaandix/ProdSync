package com.softcode.prodsyncapi.ai;

import com.softcode.prodsyncapi.ai.dto.AssignmentRequestDto;
import com.softcode.prodsyncapi.ai.dto.AssignmentResponseDto;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/ai")
@CrossOrigin(origins = "http://localhost:3000")
public class AiAssignmentController {

    @Autowired
    private TaskAssignmentService taskAssignmentService;

    @PostMapping("/assign-task")
    public ResponseEntity<?> assignTask(@Valid @RequestBody AssignmentRequestDto request) {
        try {
            AssignmentResponseDto response = taskAssignmentService.assignTask(request);
            return ResponseEntity.ok(response);
        } catch (IllegalStateException e) {
            return ResponseEntity.status(503)
                    .body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                    .body(Map.of("error", "Error al procesar la solicitud de IA: " + e.getMessage()));
        }
    }
}
