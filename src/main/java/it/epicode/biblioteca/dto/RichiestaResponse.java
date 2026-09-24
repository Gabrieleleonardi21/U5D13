package it.epicode.biblioteca.dto;

import it.epicode.biblioteca.dto.PrestitoResponse.LibroBreve;
import it.epicode.biblioteca.dto.PrestitoResponse.UtenteBreve;
import it.epicode.biblioteca.entities.RichiestaPrestito;

import java.time.Instant;
import java.util.UUID;

public record RichiestaResponse(
        UUID id,
        UtenteBreve user,
        LibroBreve libro,
        DurataPrestito durata,
        StatoRichiesta stato,
        Instant createdAt,
        Instant gestitaAt,
        UtenteBreve admin,
        UUID prestitoId,
        String motivoRifiuto
) {
    public static RichiestaResponse of(RichiestaPrestito r) {
        UUID prestitoId = null;
        if (r.getPrestito() != null) {
            prestitoId = r.getPrestito().getId();
        }
        return new RichiestaResponse(r.getId(), UtenteBreve.of(r.getUser()), LibroBreve.of(r.getLibro()),
                r.getDurata(), r.getStato(), r.getCreatedAt(), r.getGestitaAt(),
                UtenteBreve.of(r.getAdmin()), prestitoId, r.getMotivoRifiuto());
    }
}
