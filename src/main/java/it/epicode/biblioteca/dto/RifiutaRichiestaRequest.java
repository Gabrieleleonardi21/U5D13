package it.epicode.biblioteca.dto;

import jakarta.validation.constraints.Size;

// Motivo facoltativo, mostrato al lettore
public record RifiutaRichiestaRequest(
        @Size(max = 255) String motivo
) {
}
