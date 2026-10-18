package com.theodanel.backend.save;

import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

public interface CloudSaveRepository extends JpaRepository<CloudSave, UUID> {
}
