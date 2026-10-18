package com.theodanel.backend.chat;

import java.util.UUID;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.theodanel.backend.security.PlayerOidcUser;

/**
 * Discussion publique : tout le monde lit (pseudos et messages seulement, jamais d'identifiant de joueur), un joueur
 * connecté écrit, signale ; un modérateur retire un message ou coupe son auteur.
 */
@RestController
@RequestMapping("/api/chat")
public class ChatController {

	/** Borne avant filtrage : au-delà, la requête est refusée sans même lire le texte. */
	private static final int MAX_RAW_CHARS = 1000;

	private final ChatService chat;

	public ChatController(ChatService chat) {
		this.chat = chat;
	}

	public record SendRequest(@NotNull @Size(max = MAX_RAW_CHARS) String text) {
	}

	@GetMapping
	public ChatService.View latest(@AuthenticationPrincipal PlayerOidcUser user) {
		UUID viewer = user == null ? null : user.getPlayerId();
		return chat.view(viewer);
	}

	@PostMapping
	@ResponseStatus(HttpStatus.NO_CONTENT)
	public void send(@AuthenticationPrincipal PlayerOidcUser user, @Valid @RequestBody SendRequest request) {
		chat.send(user.getPlayerId(), request.text());
	}

	@PostMapping("/{id}/report")
	@ResponseStatus(HttpStatus.NO_CONTENT)
	public void report(@AuthenticationPrincipal PlayerOidcUser user, @PathVariable long id) {
		chat.report(user.getPlayerId(), id);
	}

	@DeleteMapping("/{id}")
	@ResponseStatus(HttpStatus.NO_CONTENT)
	public void remove(@AuthenticationPrincipal PlayerOidcUser user, @PathVariable long id) {
		chat.remove(user.getPlayerId(), id);
	}

	@PostMapping("/{id}/mute-author")
	@ResponseStatus(HttpStatus.NO_CONTENT)
	public void muteAuthor(@AuthenticationPrincipal PlayerOidcUser user, @PathVariable long id) {
		chat.muteAuthor(user.getPlayerId(), id);
	}
}
