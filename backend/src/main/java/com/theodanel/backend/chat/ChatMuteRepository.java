package com.theodanel.backend.chat;

import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

public interface ChatMuteRepository extends JpaRepository<ChatMute, UUID> {
}
