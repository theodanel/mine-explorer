package com.theodanel.backend.league;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

public interface LeagueMemberRepository extends JpaRepository<LeagueMember, UUID> {

	List<LeagueMember> findByWeekStartBefore(LocalDate weekStart);

	List<LeagueMember> findByLeagueAndWeekStart(League league, LocalDate weekStart);
}
