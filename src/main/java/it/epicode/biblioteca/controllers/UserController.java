package it.epicode.biblioteca.controllers;

import it.epicode.biblioteca.dto.LoginRequest;
import it.epicode.biblioteca.dto.LoginResponse;
import it.epicode.biblioteca.dto.PageResponse;
import it.epicode.biblioteca.dto.RegisterRequest;
import it.epicode.biblioteca.dto.SessioneResponse;
import it.epicode.biblioteca.dto.UserResponse;
import it.epicode.biblioteca.security.AuthCookie;
import it.epicode.biblioteca.services.UserService;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/user")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;
    private final AuthCookie authCookie;

    // Il JWT va nel cookie HttpOnly; nel body solo la scadenza
    @PreAuthorize("permitAll()")
    @PostMapping("/login")
    public SessioneResponse login(@Valid @RequestBody LoginRequest request, HttpServletResponse response) {
        return apriSessione(userService.login(request), response);
    }

    @PreAuthorize("permitAll()")
    @PostMapping("/register")
    @ResponseStatus(HttpStatus.CREATED)
    public void register(@Valid @RequestBody RegisterRequest request) {
        userService.register(request);
    }

    // Invalida il JWT usato nella richiesta e cancella il cookie
    @PreAuthorize("isAuthenticated()")
    @PostMapping("/logout")
    public void logout(@AuthenticationPrincipal Jwt jwt, HttpServletResponse response) {
        userService.logout(jwt.getTokenValue());
        authCookie.cancella(response);
    }

    // Revoca il JWT attuale e ne restituisce uno nuovo con scadenza rinnovata
    @PreAuthorize("isAuthenticated()")
    @PostMapping("/refresh")
    public SessioneResponse refresh(@AuthenticationPrincipal Jwt jwt, HttpServletResponse response) {
        return apriSessione(userService.refresh(UUID.fromString(jwt.getSubject()), jwt.getTokenValue()), response);
    }

    // Dati dell'utente del JWT, senza password
    @PreAuthorize("isAuthenticated()")
    @GetMapping("/me")
    public UserResponse me(@AuthenticationPrincipal Jwt jwt) {
        return userService.me(UUID.fromString(jwt.getSubject()));
    }

    // Ricerca utenti per email/nome/cognome: serve all'admin per trovare lo userId da usare nei prestiti
    @PreAuthorize("hasAnyRole('Admin', 'SuperUser')")
    @GetMapping("/search")
    public PageResponse<UserResponse> search(@RequestParam(required = false) String q, Pageable pageable) {
        return userService.cerca(q, pageable);
    }

    private SessioneResponse apriSessione(LoginResponse login, HttpServletResponse response) {
        authCookie.scrivi(response, login.token(), login.expiresAt());
        return new SessioneResponse(login.expiresAt());
    }
}
