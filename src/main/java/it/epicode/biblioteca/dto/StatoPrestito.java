package it.epicode.biblioteca.dto;

public enum StatoPrestito {
    APERTO,
    IN_RITARDO,  // aperto e oltre la data di riconsegna prevista
    CHIUSO
}
