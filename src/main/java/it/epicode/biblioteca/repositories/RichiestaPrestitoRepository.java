package it.epicode.biblioteca.repositories;

import it.epicode.biblioteca.dto.StatoRichiesta;
import it.epicode.biblioteca.entities.RichiestaPrestito;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.util.UUID;

public interface RichiestaPrestitoRepository extends JpaRepository<RichiestaPrestito, UUID>, JpaSpecificationExecutor<RichiestaPrestito> {

    // Utente, libro e admin caricati con JOIN nella stessa query, niente N+1
    @Override
    @EntityGraph(attributePaths = {"user", "libro", "admin", "prestito"})
    Page<RichiestaPrestito> findAll(Specification<RichiestaPrestito> spec, Pageable pageable);

    long countByUserIdAndStato(UUID userId, StatoRichiesta stato);

    boolean existsByUserIdAndLibroIdAndStato(UUID userId, UUID libroId, StatoRichiesta stato);
}
