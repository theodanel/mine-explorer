package com.theodanel.backend.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableScheduling;

/** Tâches périodiques : envoi groupé et battement de cœur des classements en direct. */
@Configuration
@EnableScheduling
public class SchedulingConfig {
}
