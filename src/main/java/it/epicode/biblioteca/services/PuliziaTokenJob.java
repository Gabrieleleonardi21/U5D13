package it.epicode.biblioteca.services;

import it.epicode.biblioteca.repositories.TokenJwtRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;

/**
 * Ogni login e refresh salva una riga in token_jwt, che altrimenti non verrebbe mai cancellata.
 * I token scaduti sono già rifiutati dalla verifica della data nel JWT: toglierli dal DB è sicuro
 * e tiene veloce il controllo di revoca fatto a ogni richiesta.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class PuliziaTokenJob {

    private final TokenJwtRepository tokenJwtRepository;

    // Orario da app.jwt.pulizia-cron (default: ogni notte alle 3:00, ora del server)
    @Scheduled(cron = "${app.jwt.pulizia-cron}")
    @Transactional
    public void eliminaTokenScaduti() {
        int eliminati = tokenJwtRepository.eliminaScadutiPrima(Instant.now());
        log.info("Pulizia token JWT: eliminati {} token scaduti", eliminati);
    }
}
