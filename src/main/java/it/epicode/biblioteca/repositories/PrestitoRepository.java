package it.epicode.biblioteca.repositories;

import it.epicode.biblioteca.entities.Prestito;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.util.UUID;

public interface PrestitoRepository extends JpaRepository<Prestito, UUID>, JpaSpecificationExecutor<Prestito> {

    // Utente, libro e admin caricati con JOIN nella stessa query, niente N+1
    @Override
    @EntityGraph(attributePaths = {"user", "libro", "adminOpen", "adminClose"})
    Page<Prestito> findAll(Specification<Prestito> spec, Pageable pageable);


    // Prestiti in corso (non ancora riconsegnati): servono per il limite di libri per lettore
    long countByUserIdAndDataRiconsegnaEffettivaIsNull(UUID userId);

    boolean existsByUserIdAndLibroIdAndDataRiconsegnaEffettivaIsNull(UUID userId, UUID libroId);
}
