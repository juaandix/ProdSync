package com.softcode.projcodeapi.model;

import com.softcode.projcodeapi.model.enums.UserStatus;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "usuarios")
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String username;

    @Column(nullable = true)
    private String password;

    @Column(nullable = false, unique = true)
    private String email;
    
    @Column(nullable = false)
    private String nombre;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private UserStatus estado;

    // simple: un rol en texto. (Luego se puede pasar a tabla/enum)
    @Column(nullable = false)
    private String role = "ROLE_USER";

    public User(String username, String password, String email, String nombre, UserStatus estado, String role) {
        this.username = username;
        this.password = password;
        this.email = email;
        this.nombre = nombre;
        this.estado = estado;
        this.role = role;
    }

    public User(String username, String password, String role) {
        this.username = username;
        this.password = password;
        this.role = role;
    }
}
