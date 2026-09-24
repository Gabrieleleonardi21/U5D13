package it.epicode.biblioteca.services;

import it.epicode.biblioteca.dto.DurataPrestito;
import it.epicode.biblioteca.dto.NuovaRichiestaRequest;
import it.epicode.biblioteca.dto.PageResponse;
import it.epicode.biblioteca.dto.RichiestaResponse;
import it.epicode.biblioteca.dto.StatoRichiesta;
import it.epicode.biblioteca.entities.Costante;
import it.epicode.biblioteca.entities.Libro;
import it.epicode.biblioteca.entities.RichiestaPrestito;
import it.epicode.biblioteca.repositories.LibroRepository;
import it.epicode.biblioteca.repositories.PrestitoRepository;
import it.epicode.biblioteca.repositories.RichiestaPrestitoRepository;
import it.epicode.biblioteca.repositories.UserRepository;
import jakarta.persistence.criteria.Predicate;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.UUID;

/**
 * Richieste di prestito fatte dal lettore. La copia viene prenotata subito (tolta dalle disponibili):
 * all'approvazione il libro c'è di sicuro, al rifiuto o all'annullamento torna disponibile.
 */
@Service
@RequiredArgsConstructor
public class RichiestaService {

    private final RichiestaPrestitoRepository richiestaRepository;
    private final PrestitoRepository prestitoRepository;
    private final LibroRepository libroRepository;
    private final UserRepository userRepository;
    private final PrestitoService prestitoService;
    private final CostanteService costanteService;

    // Tutto o niente: se un libro non è disponibile la transazione annulla anche le copie già prenotate
    @Transactional
    public List<RichiestaResponse> crea(UUID userId, NuovaRichiestaRequest r) {
        if (new HashSet<>(r.libri().stream().map(NuovaRichiestaRequest.Voce::libroId).toList()).size() != r.libri().size()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Lo stesso libro compare più volte nella richiesta");
        }
        verificaLimite(userId, r.libri().size());

        List<RichiestaResponse> create = new ArrayList<>();
        for (NuovaRichiestaRequest.Voce voce : r.libri()) {
            Libro libro = libroRepository.findById(voce.libroId())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Libro non trovato"));
            if (richiestaRepository.existsByUserIdAndLibroIdAndStato(userId, libro.getId(), StatoRichiesta.IN_ATTESA)
                    || prestitoRepository.existsByUserIdAndLibroIdAndDataRiconsegnaEffettivaIsNull(userId, libro.getId())) {
                throw new ResponseStatusException(HttpStatus.CONFLICT,
                        "Hai già in prestito o in richiesta: " + libro.getTitolo());
            }
            // Prenotazione atomica della copia: 0 righe aggiornate = nessuna copia disponibile
            if (libroRepository.prendiCopia(libro.getId()) == 0) {
                throw new ResponseStatusException(HttpStatus.CONFLICT,
                        "Nessuna copia disponibile per: " + libro.getTitolo());
            }
            RichiestaPrestito richiesta = new RichiestaPrestito();
            richiesta.setUser(userRepository.getReferenceById(userId));
            richiesta.setLibro(libro);
            DurataPrestito durata = voce.durata();
            if (durata == null) {
                durata = DurataPrestito.MEDIA;
            }
            richiesta.setDurata(durata);
            create.add(RichiestaResponse.of(richiestaRepository.save(richiesta)));
        }
        return create;
    }

    // Il lettore annulla una sua richiesta ancora in attesa
    @Transactional
    public RichiestaResponse annulla(UUID id, UUID userId) {
        RichiestaPrestito richiesta = trova(id);
        // Prima il proprietario, poi lo stato: a un altro utente non riveliamo nulla (sempre 404)
        if (!richiesta.getUser().getId().equals(userId)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Richiesta non trovata");
        }
        verificaInAttesa(richiesta);
        chiudi(richiesta, StatoRichiesta.ANNULLATA);
        libroRepository.restituisciCopia(richiesta.getLibro().getId());
        return RichiestaResponse.of(richiesta);
    }

    // L'admin approva: nasce il prestito, la copia era già prenotata
    @Transactional
    public RichiestaResponse approva(UUID id, UUID adminId) {
        RichiestaPrestito richiesta = trovaInAttesa(id);
        richiesta.setPrestito(prestitoService.crea(richiesta.getUser(), richiesta.getLibro(), richiesta.getDurata(), adminId));
        richiesta.setAdmin(userRepository.getReferenceById(adminId));
        chiudi(richiesta, StatoRichiesta.APPROVATA);
        return RichiestaResponse.of(richiesta);
    }

    @Transactional
    public RichiestaResponse rifiuta(UUID id, UUID adminId, String motivo) {
        RichiestaPrestito richiesta = trovaInAttesa(id);
        richiesta.setAdmin(userRepository.getReferenceById(adminId));
        if (SearchUtils.presente(motivo)) {
            richiesta.setMotivoRifiuto(motivo.trim());
        }
        chiudi(richiesta, StatoRichiesta.RIFIUTATA);
        libroRepository.restituisciCopia(richiesta.getLibro().getId());
        return RichiestaResponse.of(richiesta);
    }

    /**
     * Elenco paginato. userId valorizzato = solo le richieste di quell'utente (area lettore).
     * Il lettore vede prima le più recenti, l'admin prima le più vecchie (da gestire per prime).
     */
    @Transactional(readOnly = true)
    public PageResponse<RichiestaResponse> cerca(StatoRichiesta stato, UUID userId, Pageable pageable) {
        Specification<RichiestaPrestito> spec = (root, query, cb) -> {
            List<Predicate> filtri = new ArrayList<>();
            if (stato != null) filtri.add(cb.equal(root.get("stato"), stato));
            if (userId != null) filtri.add(cb.equal(root.get("user").get("id"), userId));
            return cb.and(filtri.toArray(Predicate[]::new));
        };
        Sort.Direction direzione = Sort.Direction.ASC;
        if (userId != null) {
            direzione = Sort.Direction.DESC;
        }
        Pageable ordinato = PageRequest.of(pageable.getPageNumber(), pageable.getPageSize(), Sort.by(direzione, "createdAt"));
        return PageResponse.of(richiestaRepository.findAll(spec, ordinato).map(RichiestaResponse::of));
    }

    // Prestiti in corso + richieste in attesa + nuove non devono superare la costante prestito.max.per.utente
    private void verificaLimite(UUID userId, int nuove) {
        int massimo = costanteService.intero(Costante.PRESTITO_MAX_PER_UTENTE);
        long attivi = prestitoRepository.countByUserIdAndDataRiconsegnaEffettivaIsNull(userId)
                + richiestaRepository.countByUserIdAndStato(userId, StatoRichiesta.IN_ATTESA);
        if (attivi + nuove > massimo) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Puoi avere al massimo " + massimo + " libri tra prestiti in corso e richieste in attesa: ne hai già "
                            + attivi + ".");
        }
    }

    private RichiestaPrestito trova(UUID id) {
        return richiestaRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Richiesta non trovata"));
    }

    private static void verificaInAttesa(RichiestaPrestito richiesta) {
        if (richiesta.getStato() != StatoRichiesta.IN_ATTESA) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "La richiesta è già stata gestita");
        }
    }

    // Per le azioni dell'admin
    private RichiestaPrestito trovaInAttesa(UUID id) {
        RichiestaPrestito richiesta = trova(id);
        verificaInAttesa(richiesta);
        return richiesta;
    }

    private static void chiudi(RichiestaPrestito richiesta, StatoRichiesta stato) {
        richiesta.setStato(stato);
        richiesta.setGestitaAt(Instant.now());
    }
}
