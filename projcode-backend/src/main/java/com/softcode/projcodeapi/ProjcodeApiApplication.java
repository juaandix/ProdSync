package com.softcode.projcodeapi;

import com.softcode.projcodeapi.model.User;
import com.softcode.projcodeapi.model.enums.UserStatus;
import com.softcode.projcodeapi.repository.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.security.crypto.password.PasswordEncoder;

@SpringBootApplication
public class ProjcodeApiApplication {

	public static void main(String[] args) {
		SpringApplication.run(ProjcodeApiApplication.class, args);
	}

	@Bean
	CommandLineRunner run(UserRepository userRepository, PasswordEncoder passwordEncoder) {
		return args -> {
			if (!userRepository.existsByUsername("admin@test.com")) {
				User adminUser = new User("admin@test.com", passwordEncoder.encode("password123"), "admin@test.com", "Admin", UserStatus.ACTIVE, "ADMIN");
				userRepository.save(adminUser);
				System.out.println("Admin user created");
			}
		};
	}
}
