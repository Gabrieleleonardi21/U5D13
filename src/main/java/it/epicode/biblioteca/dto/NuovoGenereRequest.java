package it.epicode.biblioteca.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record NuovoGenereRequest(
        @NotBlank @Size(max = 100) String nome
) {
}
