package it.epicode.biblioteca.security;

import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.time.Instant;

/**
 * Cookie che trasporta il JWT verso il browser.
 * HttpOnly: JavaScript non può leggerlo, quindi un eventuale XSS non riesce a rubare il token.
 * SameSite=Strict: il browser non lo invia da altri siti (protezione CSRF).
 * Path=/api: viaggia solo con le chiamate al backend.
 */
@Component
public class AuthCookie {

    public static final String NOME = "biblioteca_token";

    // In locale su http il cookie Secure non verrebbe salvato da tutti i browser: COOKIE_SECURE=false nel .env
    @Value("${app.auth.cookie-secure}")
    private boolean secure;

    // Il cookie scade insieme al token: un token scaduto sparisce anche dal browser
    public void scrivi(HttpServletResponse response, String token, Instant expiresAt) {
        aggiungi(response, token, Duration.between(Instant.now(), expiresAt));
    }

    public void cancella(HttpServletResponse response) {
        aggiungi(response, "", Duration.ZERO);
    }

    private void aggiungi(HttpServletResponse response, String valore, Duration durata) {
        ResponseCookie cookie = ResponseCookie.from(NOME, valore)
                .httpOnly(true)
                .secure(secure)
                .sameSite("Strict")
                .path("/api")
                .maxAge(durata)
                .build();
        response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());
    }
}
