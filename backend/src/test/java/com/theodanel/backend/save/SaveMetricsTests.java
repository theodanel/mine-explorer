package com.theodanel.backend.save;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.Map;

import org.junit.jupiter.api.Test;

import tools.jackson.databind.json.JsonMapper;

class SaveMetricsTests {

	private final JsonMapper json = JsonMapper.builder().build();

	@Test
	void apresUneRenaissanceLeClassementGardeLaMeilleureProfondeur() {
		// Renaissance faite depuis la zone 24 (étape 346), la nouvelle vie repart de la zone 3
		Map<String, String> data = Map.of(
				SaveMetrics.PROGRESS_KEY, "{\"zone\":3,\"stage\":1,\"damage\":0}",
				SaveMetrics.REBIRTH_KEY, "{\"count\":1,\"embers\":10,\"tree\":{},\"bestStages\":346}");
		assertThat(SaveMetrics.read(data, json).stagesReached()).isEqualTo(346);
	}

	@Test
	void uneVieQuiDepasseLeRecordCompteSaProfondeur() {
		Map<String, String> data = Map.of(
				SaveMetrics.PROGRESS_KEY, "{\"zone\":30,\"stage\":2,\"damage\":0}",
				SaveMetrics.REBIRTH_KEY, "{\"count\":4,\"embers\":0,\"tree\":{},\"bestStages\":346}");
		assertThat(SaveMetrics.read(data, json).stagesReached()).isEqualTo(29 * 15 + 2);
	}

	@Test
	void sansRenaissanceRienNeChange() {
		Map<String, String> data = Map.of(SaveMetrics.PROGRESS_KEY, "{\"zone\":5,\"stage\":4,\"damage\":0}");
		assertThat(SaveMetrics.read(data, json).stagesReached()).isEqualTo(4 * 15 + 4);
	}
}
