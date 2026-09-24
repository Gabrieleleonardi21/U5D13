package it.epicode.biblioteca.dto;

// Ciclo di vita di una richiesta: IN_ATTESA -> APPROVATA (nasce il prestito) | RIFIUTATA | ANNULLATA
public enum StatoRichiesta {
    IN_ATTESA,
    APPROVATA,
    RIFIUTATA,  // dall'admin, con motivo facoltativo
    ANNULLATA   // dal lettore stesso, finché è in attesa
}
