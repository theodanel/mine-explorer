package com.theodanel.backend.save;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.catchThrowableOfType;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import java.time.Duration;
import java.time.Instant;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import org.junit.jupiter.api.Test;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;

import com.theodanel.backend.account.AccountService;
import com.theodanel.backend.account.Player;
import com.theodanel.backend.config.MineProperties;
import com.theodanel.backend.error.ApiException;
import com.theodanel.backend.support.MutableClock;

import tools.jackson.databind.json.JsonMapper;

/** Cas impossibles à provoquer de façon fiable par l'API : deux écritures exactement simultanées. */
class SaveServiceTests {

	private final CloudSaveRepository repository = mock(CloudSaveRepository.class);
	private final AccountService accounts = mock(AccountService.class);
	private final SaveService service = new SaveService(repository, accounts, properties(),
			JsonMapper.builder().build(), new MutableClock());

	@Test
	void deuxPremieresSauvegardesSimultaneesDonnentUnConflit() {
		UUID player = UUID.randomUUID();
		// Les deux appareils ont lu « aucune partie » ; le second bute sur la clé primaire à l'écriture
		when(accounts.get(player)).thenReturn(new Player(player, "Theo", MutableClock.START));
		when(repository.findById(player)).thenReturn(Optional.empty());
		when(repository.saveAndFlush(any())).thenThrow(new DataIntegrityViolationException("clé primaire"));

		ApiException conflict = catchThrowableOfType(ApiException.class,
				() -> service.replace(player, null, Map.of("mine-explorer.coins", "1")));

		assertThat(conflict.getStatus()).isEqualTo(HttpStatus.CONFLICT);
		assertThat(conflict.getCode()).isEqualTo("save-conflict");
	}

	private static MineProperties properties() {
		return new MineProperties(null, null, null, null,
				new MineProperties.AntiCheat(Instant.parse("2026-10-11T00:00:00Z"), 2, Duration.ofMinutes(15)), null);
	}
}
