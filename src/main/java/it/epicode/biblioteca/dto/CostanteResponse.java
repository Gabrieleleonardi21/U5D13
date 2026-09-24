package it.epicode.biblioteca.dto;

import it.epicode.biblioteca.entities.Costante;

import java.util.UUID;

public record CostanteResponse(
        UUID id,
        String chiave,
        String valore
) {
    public static CostanteResponse of(Costante c) {
        return new CostanteResponse(c.getId(), c.getChiave(), c.getValore());
    }
}
