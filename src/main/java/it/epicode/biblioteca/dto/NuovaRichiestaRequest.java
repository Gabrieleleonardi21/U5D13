package it.epicode.biblioteca.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.List;
import java.util.UUID;

// Libri scelti dal lettore, inviati tutti insieme: o passano tutti o nessuno
public record NuovaRichiestaRequest(
        @NotEmpty(message = "Seleziona almeno un libro")
        @Size(max = 20, message = "Al massimo 20 libri per richiesta")
        List<@Valid Voce> libri
) {
    // durata facoltativa: default MEDIA
    public record Voce(@NotNull UUID libroId, DurataPrestito durata) {
    }
}
