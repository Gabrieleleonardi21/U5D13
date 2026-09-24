package it.epicode.biblioteca.controllers;

import it.epicode.biblioteca.dto.NuovaRichiestaRequest;
import it.epicode.biblioteca.dto.PageResponse;
import it.epicode.biblioteca.dto.RichiestaResponse;
import it.epicode.biblioteca.dto.RifiutaRichiestaRequest;
import it.epicode.biblioteca.dto.StatoRichiesta;
import it.epicode.biblioteca.services.RichiestaService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/richieste")
@RequiredArgsConstructor
public class RichiestaController {

    private final RichiestaService richiestaService;

    // --- Lettore ---

    // Invia i libri selezionati: 409 se uno non è disponibile, è già richiesto o si supera il limite
    @PreAuthorize("isAuthenticated()")
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public List<RichiestaResponse> crea(@Valid @RequestBody NuovaRichiestaRequest request, @AuthenticationPrincipal Jwt jwt) {
        return richiestaService.crea(UUID.fromString(jwt.getSubject()), request);
    }

    @PreAuthorize("isAuthenticated()")
    @GetMapping("/mie")
    public PageResponse<RichiestaResponse> mie(@RequestParam(required = false) StatoRichiesta stato,
                                               @PageableDefault(size = 20) Pageable pageable,
                                               @AuthenticationPrincipal Jwt jwt) {
        return richiestaService.cerca(stato, UUID.fromString(jwt.getSubject()), pageable);
    }

    @PreAuthorize("isAuthenticated()")
    @PatchMapping("/{id}/annulla")
    public RichiestaResponse annulla(@PathVariable UUID id, @AuthenticationPrincipal Jwt jwt) {
        return richiestaService.annulla(id, UUID.fromString(jwt.getSubject()));
    }

    // --- Admin ---

    // Esempio: /api/richieste?stato=IN_ATTESA&page=0&size=20 (dalla più vecchia)
    @PreAuthorize("hasAnyRole('Admin', 'SuperUser')")
    @GetMapping
    public PageResponse<RichiestaResponse> tutte(@RequestParam(required = false) StatoRichiesta stato,
                                                 @PageableDefault(size = 20) Pageable pageable) {
        return richiestaService.cerca(stato, null, pageable);
    }

    @PreAuthorize("hasAnyRole('Admin', 'SuperUser')")
    @PatchMapping("/{id}/approva")
    public RichiestaResponse approva(@PathVariable UUID id, @AuthenticationPrincipal Jwt jwt) {
        return richiestaService.approva(id, UUID.fromString(jwt.getSubject()));
    }

    @PreAuthorize("hasAnyRole('Admin', 'SuperUser')")
    @PatchMapping("/{id}/rifiuta")
    public RichiestaResponse rifiuta(@PathVariable UUID id,
                                     @Valid @RequestBody(required = false) RifiutaRichiestaRequest request,
                                     @AuthenticationPrincipal Jwt jwt) {
        String motivo = null;
        if (request != null) {
            motivo = request.motivo();
        }
        return richiestaService.rifiuta(id, UUID.fromString(jwt.getSubject()), motivo);
    }
}
