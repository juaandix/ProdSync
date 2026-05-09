package com.softcode.prodsyncapi.service;

import com.softcode.prodsyncapi.dto.UserUpdateDto;
import com.softcode.prodsyncapi.model.User;
import com.softcode.prodsyncapi.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Sort;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class UserServiceImplTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @InjectMocks
    private UserServiceImpl userService;

    @Test
    void getAllUsers_withoutParams_shouldSortByIdDesc() {
        when(userRepository.findAll(any(Sort.class))).thenReturn(List.of());

        userService.getAllUsers();

        ArgumentCaptor<Sort> sortCaptor = ArgumentCaptor.forClass(Sort.class);
        verify(userRepository).findAll(sortCaptor.capture());
        assertEquals(Sort.by(Sort.Direction.DESC, "id"), sortCaptor.getValue());
    }

    @Test
    void getAllUsers_withSearch_shouldCallSearchMethod() {
        when(userRepository.findByUsernameContainingIgnoreCaseOrEmailContainingIgnoreCaseOrNombreContainingIgnoreCase(
                anyString(), anyString(), anyString(), any(Sort.class))).thenReturn(List.of());

        userService.getAllUsers("test", "id", "desc");

        verify(userRepository).findByUsernameContainingIgnoreCaseOrEmailContainingIgnoreCaseOrNombreContainingIgnoreCase(
                eq("test"), eq("test"), eq("test"), any(Sort.class));
    }

    @Test
    void getAllUsers_withSortByName_shouldMapToNombre() {
        when(userRepository.findAll(any(Sort.class))).thenReturn(List.of());

        userService.getAllUsers(null, "name", "asc");

        ArgumentCaptor<Sort> sortCaptor = ArgumentCaptor.forClass(Sort.class);
        verify(userRepository).findAll(sortCaptor.capture());
        assertEquals(Sort.by(Sort.Direction.ASC, "nombre"), sortCaptor.getValue());
    }

    @Test
    void getUserById_shouldReturnUser_whenFound() {
        User user = new User();
        user.setId(1L);
        user.setUsername("test");
        when(userRepository.findById(1L)).thenReturn(Optional.of(user));

        Optional<User> result = userService.getUserById(1L);

        assertTrue(result.isPresent());
        assertEquals("test", result.get().getUsername());
    }

    @Test
    void saveUser_shouldReturnSavedUser() {
        User user = new User();
        user.setUsername("newuser");
        when(userRepository.save(user)).thenReturn(user);

        User result = userService.saveUser(user);

        assertEquals("newuser", result.getUsername());
    }

    @Test
    void updateUser_shouldUpdateFieldsAndReturnUser() {
        User existingUser = new User();
        existingUser.setId(1L);
        existingUser.setUsername("old");
        when(userRepository.findById(1L)).thenReturn(Optional.of(existingUser));
        when(userRepository.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));

        UserUpdateDto dto = new UserUpdateDto("newuser", "new@mail.com", "New Name", "ACTIVE", "ROLE_ADMIN", null);

        User result = userService.updateUser(1L, dto);

        assertNotNull(result);
        assertEquals("newuser", result.getUsername());
        assertEquals("new@mail.com", result.getEmail());
        assertEquals("New Name", result.getNombre());
        assertEquals("ROLE_ADMIN", result.getRole());
    }

    @Test
    void updateUser_withPassword_shouldUpdatePassword() {
        User existingUser = new User();
        existingUser.setId(1L);
        existingUser.setPassword("oldpass");
        when(userRepository.findById(1L)).thenReturn(Optional.of(existingUser));
        when(userRepository.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));
        when(passwordEncoder.encode("newpass")).thenReturn("encoded_newpass");

        UserUpdateDto dto = new UserUpdateDto("user", "e@m.com", "Name", "ACTIVE", "ROLE_USER", "newpass");

        User result = userService.updateUser(1L, dto);

        assertEquals("encoded_newpass", result.getPassword());
    }

    @Test
    void updateUser_shouldReturnNull_whenUserNotFound() {
        when(userRepository.findById(1L)).thenReturn(Optional.empty());

        UserUpdateDto dto = new UserUpdateDto("user", "e@m.com", "Name", "ACTIVE", "ROLE_USER", null);

        User result = userService.updateUser(1L, dto);

        assertNull(result);
    }
}
