package it.epicode.biblioteca.repositories;

import it.epicode.biblioteca.entities.TokenJwt;
import it.epicode.biblioteca.entities.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface TokenJwtRepository extends JpaRepository<TokenJwt, UUID> {

    Optional<TokenJwt> findByToken(String token);

    List<TokenJwt> findByUserAndRevocatoFalse(User user);

    // Una sola DELETE in blocco (niente caricamento delle entità); restituisce quante righe ha tolto
    @Modifying
    @Query("DELETE FROM TokenJwt t WHERE t.expiresAt < :limite")
    int eliminaScadutiPrima(@Param("limite") Instant limite);

}
