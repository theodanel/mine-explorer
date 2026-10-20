package com.theodanel.backend.league;

import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.theodanel.backend.account.Player;
import com.theodanel.backend.account.PlayerRepository;
import com.theodanel.backend.save.CloudSave;
import com.theodanel.backend.save.CloudSaveRepository;

/**
 * Ligue de la semaine. Le score est le nombre de filons classés gagnés depuis le lundi (valeur de la sauvegarde cloud,
 * plafonnée par l'anti-triche) : rien n'est envoyé par le jeu pour la ligue. Le lundi à 0 h (Paris), chaque ligue est
 * classée : les meilleurs montent, les derniers descendent, et chacun ayant joué reçoit des éclats, récupérés par le jeu.
 * Si le serveur était arrêté à minuit, la semaine se clôt à la première demande qui suit.
 */
@Service
public class LeagueService {

	private static final Logger LOG = LoggerFactory.getLogger(LeagueService.class);

	private final LeagueMemberRepository members;
	private final CloudSaveRepository saves;
	private final PlayerRepository players;
	private final Clock clock;

	public LeagueService(LeagueMemberRepository members, CloudSaveRepository saves, PlayerRepository players,
			Clock clock) {
		this.members = members;
		this.saves = saves;
		this.players = players;
		this.clock = clock;
	}

	public record Row(int rank, String pseudo, String title, int score, boolean mine) {
	}

	public record Reward(int shards, League from, League to) {
	}

	/**
	 * Vue d'une ligue pour un joueur ; {@code promote} et {@code demote} : combien montent et descendent en fin de
	 * semaine. {@code endsAt} : lundi suivant à 0 h, heure de Paris.
	 */
	public record LeagueView(League league, Instant endsAt, int promote, int demote, List<Row> members, Row me,
			Reward pending) {
	}

	/** Un joueur entre en Bronze à sa première sauvegarde acceptée ; son score part de là. */
	@Transactional
	public void join(UUID playerId, int stagesReached) {
		if (!members.existsById(playerId)) {
			members.save(new LeagueMember(playerId, LeagueRules.weekStart(clock.instant()), stagesReached));
		}
	}

	@Scheduled(cron = "0 0 0 * * MON", zone = "Europe/Paris")
	@Transactional
	public void closeWeekOnMonday() {
		closePastWeeks();
	}

	/** Clôt les semaines passées : classement de chaque ligue, montées, descentes et récompenses. */
	@Transactional
	public synchronized void closePastWeeks() {
		LocalDate week = LeagueRules.weekStart(clock.instant());
		List<LeagueMember> stale = members.findByWeekStartBefore(week);
		if (stale.isEmpty()) {
			return;
		}
		Map<UUID, Integer> stages = currentStages(stale.stream().map(LeagueMember::getPlayerId).toList());
		Map<String, List<LeagueMember>> groups = stale.stream()
			.collect(Collectors.groupingBy(member -> member.getLeague() + "/" + member.getWeekStart()));
		for (List<LeagueMember> group : groups.values()) {
			List<LeagueMember> ranked = new ArrayList<>(group);
			ranked.sort(Comparator.comparingInt((LeagueMember member) -> scoreOf(member, stages)).reversed()
				.thenComparing(LeagueMember::getPlayerId));
			for (int rank = 0; rank < ranked.size(); rank++) {
				LeagueMember member = ranked.get(rank);
				int score = scoreOf(member, stages);
				int move = LeagueRules.movement(rank, ranked.size(), score);
				League next = move > 0 ? member.getLeague().up() : move < 0 ? member.getLeague().down() : member.getLeague();
				int shards = score > 0 ? member.getLeague().weeklyShards() : 0;
				member.closeWeek(next, shards, week, stages.getOrDefault(member.getPlayerId(), member.getBaseStages()));
			}
		}
		LOG.info("Ligue : semaine close pour {} joueurs", stale.size());
	}

	@Transactional
	public Optional<LeagueView> view(UUID playerId) {
		closePastWeeks();
		Optional<LeagueMember> found = members.findById(playerId);
		if (found.isEmpty()) {
			return Optional.empty();
		}
		LeagueMember me = found.get();
		List<LeagueMember> group = members.findByLeagueAndWeekStart(me.getLeague(), me.getWeekStart());
		Map<UUID, Integer> stages = currentStages(group.stream().map(LeagueMember::getPlayerId).toList());
		Map<UUID, Player> byId = players.findAllById(group.stream().map(LeagueMember::getPlayerId).toList())
			.stream()
			.collect(Collectors.toMap(Player::getId, Function.identity()));
		List<LeagueMember> ranked = new ArrayList<>(group);
		ranked.sort(Comparator.comparingInt((LeagueMember member) -> scoreOf(member, stages)).reversed()
			.thenComparing(LeagueMember::getPlayerId));
		List<Row> rows = new ArrayList<>();
		Row mine = null;
		for (int rank = 0; rank < ranked.size(); rank++) {
			LeagueMember member = ranked.get(rank);
			Player player = byId.get(member.getPlayerId());
			Row row = new Row(rank + 1, player == null ? "?" : player.getPseudo(), player == null ? null : player.getTitle(),
					scoreOf(member, stages), member.getPlayerId().equals(playerId));
			rows.add(row);
			if (row.mine()) {
				mine = row;
			}
		}
		Reward pending = me.getPendingShards() > 0 ? new Reward(me.getPendingShards(), me.getPendingFrom(), me.getPendingTo())
				: null;
		Instant endsAt = me.getWeekStart().plusWeeks(1).atStartOfDay(LeagueRules.PARIS).toInstant();
		return Optional.of(new LeagueView(me.getLeague(), endsAt, LeagueRules.promoteCount(rows.size()),
				LeagueRules.demoteCount(rows.size()), rows, mine, pending));
	}

	/** Le jeu récupère la récompense de la semaine passée : rendue une seule fois. */
	@Transactional
	public int claim(UUID playerId) {
		return members.findById(playerId).map(LeagueMember::claim).orElse(0);
	}

	private Map<UUID, Integer> currentStages(List<UUID> playerIds) {
		return saves.findAllById(playerIds)
			.stream()
			.collect(Collectors.toMap(CloudSave::getPlayerId, CloudSave::getStagesReached));
	}

	private static int scoreOf(LeagueMember member, Map<UUID, Integer> stages) {
		return Math.max(stages.getOrDefault(member.getPlayerId(), member.getBaseStages()) - member.getBaseStages(), 0);
	}
}
