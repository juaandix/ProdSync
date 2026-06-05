package com.softcode.prodsyncapi.service;

import com.softcode.prodsyncapi.dto.UserUpdateDto;
import com.softcode.prodsyncapi.model.User;
import java.util.List;
import java.util.Optional;

public interface UserService {
    List<User> getAllUsers();
    List<User> getAllUsers(String search, String sortBy, String sortOrder);
    Optional<User> getUserById(Long id);
    Optional<User> getUserByUsername(String username);
    Optional<User> getUserByEmail(String email);
    User saveUser(User user);
    User updateUser(Long id, UserUpdateDto userUpdateDto);
    void deleteUser(Long id);
}
