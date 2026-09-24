package it.epicode.biblioteca.controllers;

import it.epicode.biblioteca.dto.CostanteResponse;
import it.epicode.biblioteca.dto.DurataPrestito;
import it.epicode.biblioteca.dto.ModificaCostanteRequest;
import it.epicode.biblioteca.dto.NuovaCostanteRequest;
import it.epicode.biblioteca.services.CostanteService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/costanti")
@RequiredArgsConstructor
public class CostanteController {

    private final CostanteService costanteService;

    // Pubblico: al lettore servono i giorni di ogni durata per scegliere, es. {"BREVE":7,"MEDIA":15,"LUNGA":23}.
    // Espone solo le durate, non le altre costanti (penali, limiti).
    @PreAuthorize("permitAll()")
    @GetMapping("/durate")
    public Map<DurataPrestito, Integer> durate() {
        return costanteService.durate();
    }

    // Ordinate per chiave
    @PreAuthorize("hasAnyRole('Admin', 'SuperUser')")
    @GetMapping("/all")
    public List<CostanteResponse> all() {
        return costanteService.tutte();
    }

    // 409 se la chiave esiste già
    @PreAuthorize("hasRole('SuperUser')")
    @PostMapping("/newCostante")
    @ResponseStatus(HttpStatus.CREATED)
    public CostanteResponse newCostante(@Valid @RequestBody NuovaCostanteRequest request) {
        return costanteService.crea(request);
    }

    @PreAuthorize("hasRole('SuperUser')")
    @DeleteMapping("/deleteCostante/{id}")
    public void deleteCostante(@PathVariable UUID id) {
        costanteService.elimina(id);
    }

    // Aggiorna solo i campi inviati; 409 se la nuova chiave è già usata
    @PreAuthorize("hasRole('SuperUser')")
    @PatchMapping("/editCostante")
    public CostanteResponse editCostante(@Valid @RequestBody ModificaCostanteRequest request) {
        return costanteService.modifica(request);
    }
}
