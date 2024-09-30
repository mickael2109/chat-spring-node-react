package com.chat.chat.repository;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

import com.chat.chat.entity.User;


public interface UserRepository extends JpaRepository<User, Long> {
    User findByUsername(String username);
    Optional<User> findById(Long id);
}

