package com.softcode.projcodeapi.auth;

import com.softcode.projcodeapi.model.User;
import com.softcode.projcodeapi.model.enums.UserStatus;
import com.softcode.projcodeapi.repository.UserRepository;
import com.softcode.projcodeapi.security.JwtService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.security.Principal;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;

    public AuthController(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            AuthenticationManager authenticationManager,
            JwtService jwtService
    ) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.authenticationManager = authenticationManager;
        this.jwtService = jwtService;
    }

    @PostMapping("/register")
    public String register(@RequestBody RegisterRequest req) {
        if (userRepository.existsByUsername(req.getUsername())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Ese username ya existe");
        }
        User u = new User();
        u.setUsername(req.getUsername());
        u.setPassword(passwordEncoder.encode(req.getPassword()));
        u.setEmail(req.getEmail());
        u.setNombre(req.getNombre());
        u.setEstado(UserStatus.valueOf(req.getEstado()));
        u.setRole(req.getRole());
        userRepository.save(u);
        return "Usuario creado";
    }

    @GetMapping("/me")
    public ResponseEntity<?> me(Principal principal) {
        if (principal == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", "No autenticado"));
        }
        return userRepository.findByUsername(principal.getName())
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody AuthRequest req) {
        try {
            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(req.username, req.password)
            );
            String token = jwtService.generateToken(req.username);
            return ResponseEntity.ok(new AuthResponse(token));
        } catch (AuthenticationException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                                 .body(Map.of("message", "Invalid credentials"));
        }
    }
}
