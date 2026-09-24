package it.epicode.biblioteca.entities;

import it.epicode.biblioteca.dto.DurataPrestito;
import it.epicode.biblioteca.dto.StatoRichiesta;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;
import java.util.UUID;

// Libro che un lettore chiede in prestito. La copia è già prenotata (tolta dalle disponibili)
// finché la richiesta è IN_ATTESA; torna disponibile se viene rifiutata o annullata.
@Entity
@Table(name = "richieste_prestito")
@Getter
@Setter
@NoArgsConstructor
public class RichiestaPrestito {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(optional = false)
    @JoinColumn(name = "libro_id", nullable = false)
    private Libro libro;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 10)
    private DurataPrestito durata;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 12)
    private StatoRichiesta stato = StatoRichiesta.IN_ATTESA;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    // Momento in cui è stata approvata, rifiutata o annullata
    @Column(name = "gestita_at")
    private Instant gestitaAt;

    // Admin che l'ha approvata o rifiutata (NULL se in attesa o annullata dal lettore)
    @ManyToOne
    @JoinColumn(name = "admin_id")
    private User admin;

    // Prestito nato dall'approvazione
    @OneToOne
    @JoinColumn(name = "prestito_id")
    private Prestito prestito;

    @Column(name = "motivo_rifiuto")
    private String motivoRifiuto;

    // Blocco ottimistico: due admin che gestiscono la stessa richiesta insieme non creano due prestiti
    @Version
    private Long versione;

    @PrePersist
    void onCreate() {
        createdAt = Instant.now();
    }
}
