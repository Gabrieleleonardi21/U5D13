package it.epicode.biblioteca.repositories;

import it.epicode.biblioteca.entities.Ruolo;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface RuoloRepository extends JpaRepository<Ruolo, UUID> {

    Optional<Ruolo> findByRuolo(String ruolo);

}
