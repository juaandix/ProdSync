package com.softcode.prodsyncapi.service;

import com.softcode.prodsyncapi.dto.UserUpdateDto;
import com.softcode.prodsyncapi.model.User;
import com.softcode.prodsyncapi.model.enums.UserStatus;
import com.softcode.prodsyncapi.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.List;
import java.util.Optional;

@Service
public class UserServiceImpl implements UserService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Override
    public List<User> getAllUsers() {
        return getAllUsers(null, "id", "desc");
    }

    @Override
    public List<User> getAllUsers(String search, String sortBy, String sortOrder) {
        Sort sort = Sort.unsorted();

        if (sortBy != null && !sortBy.trim().isEmpty()) {
            Sort.Direction direction = "desc".equalsIgnoreCase(sortOrder) ? Sort.Direction.DESC : Sort.Direction.ASC;
            String actualSortBy = "name".equalsIgnoreCase(sortBy) ? "nombre" : sortBy;
            sort = Sort.by(direction, actualSortBy);
        } else {
            sort = Sort.by(Sort.Direction.DESC, "id");
        }

        if (search != null && !search.trim().isEmpty()) {
            String searchTerm = search.toLowerCase();
            return userRepository.findByUsernameContainingIgnoreCaseOrEmailContainingIgnoreCaseOrNombreContainingIgnoreCase(
                    searchTerm, searchTerm, searchTerm, sort);
        } else {
            return userRepository.findAll(sort);
        }
    }

    @Override
    public Optional<User> getUserById(Long id) {
        return userRepository.findById(id);
    }

    @Override
    public Optional<User> getUserByUsername(String username) {
        return userRepository.findByUsername(username);
    }

    @Override
    public Optional<User> getUserByEmail(String email) {
        return userRepository.findByEmail(email);
    }

    @Override
    public User saveUser(User user) {
        return userRepository.save(user);
    }

    @Override
    public User updateUser(Long id, UserUpdateDto userUpdateDto) {
        return userRepository.findById(id).map(user -> {
            user.setUsername(userUpdateDto.getUsername());
            user.setEmail(userUpdateDto.getEmail());
            user.setNombre(userUpdateDto.getNombre());
            user.setRole(userUpdateDto.getRole());
            user.setEstado(UserStatus.valueOf(userUpdateDto.getEstado()));

            if (userUpdateDto.getPassword() != null && !userUpdateDto.getPassword().isEmpty()) {
                user.setPassword(passwordEncoder.encode(userUpdateDto.getPassword()));
            }

            return userRepository.save(user);
        }).orElse(null);
    }

    @Override
    public void deleteUser(Long id) {
        userRepository.deleteById(id);
    }
}
