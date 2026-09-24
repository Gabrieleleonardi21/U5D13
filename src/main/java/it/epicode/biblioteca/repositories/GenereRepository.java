package it.epicode.biblioteca.repositories;

import it.epicode.biblioteca.entities.Genere;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface GenereRepository extends JpaRepository<Genere, UUID> {

    Optional<Genere> findByNome(String nome);

    Optional<Genere> findByNomeIgnoreCase(String nome);

}
