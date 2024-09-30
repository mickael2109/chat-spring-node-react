package com.chat.chat.repository;
import org.springframework.data.jpa.repository.JpaRepository;

import com.chat.chat.entity.Message;


public interface MessageRepository extends JpaRepository<Message, Long> {

}

