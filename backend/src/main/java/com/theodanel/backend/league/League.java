package com.theodanel.backend.league;

/** Les ligues de la semaine, de la plus basse à la plus haute, et les éclats que chacune rapporte en fin de semaine. */
public enum League {

	BRONZE(50), SILVER(100), GOLD(200), DIAMOND(350), LEGEND(500);

	private final int weeklyShards;

	League(int weeklyShards) {
		this.weeklyShards = weeklyShards;
	}

	public int weeklyShards() {
		return weeklyShards;
	}

	public League up() {
		return this == LEGEND ? this : values()[ordinal() + 1];
	}

	public League down() {
		return this == BRONZE ? this : values()[ordinal() - 1];
	}
}
