package it.epicode.biblioteca.dto;

import java.time.Instant;

// Risposta di login/refresh: il token viaggia solo nel cookie HttpOnly, al client serve solo sapere quando scade
public record SessioneResponse(
        Instant expiresAt
) {
}
