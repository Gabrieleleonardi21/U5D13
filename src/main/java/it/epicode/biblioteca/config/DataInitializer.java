package it.epicode.biblioteca.config;

import it.epicode.biblioteca.entities.Ruolo;
import it.epicode.biblioteca.entities.RuoloUtente;
import it.epicode.biblioteca.entities.User;
import it.epicode.biblioteca.repositories.RuoloRepository;
import it.epicode.biblioteca.repositories.RuoloUtenteRepository;
import it.epicode.biblioteca.repositories.UserRepository;
import it.epicode.biblioteca.services.CostanteService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

// Crea ruoli, SuperUser e costanti di default se non esistono (idempotente: non sovrascrive valori modificati)
@Component
@RequiredArgsConstructor
public class DataInitializer implements ApplicationRunner {

    private final RuoloRepository ruoloRepository;
    private final UserRepository userRepository;
    private final RuoloUtenteRepository ruoloUtenteRepository;
    private final CostanteService costanteService;
    private final PasswordEncoder passwordEncoder;

    @Value("${app.superuser.email}")
    private String superUserEmail;

    @Value("${app.superuser.password}")
    private String superUserPassword;

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        List.of(Ruolo.SUPER_USER, Ruolo.ADMIN, Ruolo.USER).forEach(nome ->
                ruoloRepository.findByRuolo(nome)
                        .orElseGet(() -> ruoloRepository.save(new Ruolo(nome))));

        if (userRepository.findByEmail(superUserEmail).isEmpty()) {
            User superUser = new User();
            superUser.setEmail(superUserEmail);
            superUser.setPassword(passwordEncoder.encode(superUserPassword));
            superUser.setNome("Super");
            superUser.setCognome("User");
            superUser.setDataDiNascita(LocalDate.of(1970, 1, 1));
            superUser.setIndirizzo("N/D");
            userRepository.save(superUser);

            Ruolo ruoloSuperUser = ruoloRepository.findByRuolo(Ruolo.SUPER_USER).orElseThrow();
            ruoloUtenteRepository.save(new RuoloUtente(superUser, ruoloSuperUser));
        }

        // Default definiti in CostanteService (usati anche come fallback se la riga viene eliminata)
        costanteService.creaMancanti();
    }
}
