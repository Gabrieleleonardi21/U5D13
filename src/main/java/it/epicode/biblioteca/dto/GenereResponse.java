package it.epicode.biblioteca.dto;

import it.epicode.biblioteca.entities.Genere;

import java.util.UUID;

public record GenereResponse(
        UUID id,
        String nome
) {
    public static GenereResponse of(Genere g) {
        return new GenereResponse(g.getId(), g.getNome());
    }
}
