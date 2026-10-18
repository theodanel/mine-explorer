package com.theodanel.backend.chat;

import java.util.List;
import java.util.UUID;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.theodanel.backend.security.PlayerOidcUser;

/**
 * Discussion publique : tout le monde lit (pseudos et phrases seulement, jamais d'identifiant interne), seul un
 * joueur connecté écrit, et seulement une phrase prédéfinie.
 */
@RestController
@RequestMapping("/api/chat")
public class ChatController {

	private final ChatService chat;

	public ChatController(ChatService chat) {
		this.chat = chat;
	}

	public record ChatResponse(List<ChatService.Message> messages) {
	}

	public record SendRequest(@NotNull @Size(max = 32) String phrase) {
	}

	@GetMapping
	public ChatResponse latest(@AuthenticationPrincipal PlayerOidcUser user) {
		UUID viewer = user == null ? null : user.getPlayerId();
		return new ChatResponse(chat.latest(viewer));
	}

	@PostMapping
	@ResponseStatus(HttpStatus.NO_CONTENT)
	public void send(@AuthenticationPrincipal PlayerOidcUser user, @Valid @RequestBody SendRequest request) {
		chat.send(user.getPlayerId(), request.phrase());
	}
}
