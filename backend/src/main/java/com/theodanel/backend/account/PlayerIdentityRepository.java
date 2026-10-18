package com.theodanel.backend.account;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

public interface PlayerIdentityRepository extends JpaRepository<PlayerIdentity, UUID> {

	Optional<PlayerIdentity> findByProviderAndSubject(String provider, String subject);

	List<PlayerIdentity> findByPlayerId(UUID playerId);
}
