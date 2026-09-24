package it.epicode.biblioteca.services;

import it.epicode.biblioteca.dto.LoginRequest;
import it.epicode.biblioteca.dto.LoginResponse;
import it.epicode.biblioteca.dto.PageResponse;
import it.epicode.biblioteca.dto.RegisterRequest;
import it.epicode.biblioteca.dto.UserResponse;
import it.epicode.biblioteca.entities.Ruolo;
import it.epicode.biblioteca.entities.RuoloUtente;
import it.epicode.biblioteca.entities.User;
import it.epicode.biblioteca.repositories.RuoloRepository;
import it.epicode.biblioteca.repositories.RuoloUtenteRepository;
import it.epicode.biblioteca.repositories.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Locale;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final RuoloRepository ruoloRepository;
    private final RuoloUtenteRepository ruoloUtenteRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    @Transactional
    public LoginResponse login(LoginRequest request) {
        // Stesso errore per email inesistente e password errata: non riveliamo quali email sono registrate
        User user = userRepository.findByEmail(normalizzaEmail(request.username()))
                .filter(u -> passwordEncoder.matches(request.password(), u.getPassword()))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Credenziali non valide"));
        return jwtService.emetti(user, nomiRuoli(user));
    }

    @Transactional
    public void register(RegisterRequest request) {
        String email = normalizzaEmail(request.email());
        if (userRepository.existsByEmail(email)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Email già registrata");
        }

        User user = new User();
        user.setEmail(email);
        user.setPassword(passwordEncoder.encode(request.password()));
        user.setDataDiNascita(request.dataDiNascita());
        user.setNome(request.nome());
        user.setCognome(request.cognome());
        user.setIndirizzo(request.indirizzo());
        userRepository.save(user);

        Ruolo ruoloUser = ruoloRepository.findByRuolo(Ruolo.USER).orElseThrow();
        ruoloUtenteRepository.save(new RuoloUtente(user, ruoloUser));
    }

    @Transactional
    public LoginResponse refresh(UUID userId, String tokenAttuale) {
        User user = trovaUtente(userId);
        jwtService.revoca(tokenAttuale);
        return jwtService.emetti(user, nomiRuoli(user));
    }

    public void logout(String token) {
        jwtService.revoca(token);
    }

    @Transactional(readOnly = true)
    public UserResponse me(UUID userId) {
        return toResponse(trovaUtente(userId));
    }

    // q facoltativo: "contiene" case-insensitive su email, nome o cognome; ordinamento fisso cognome, nome
    @Transactional(readOnly = true)
    public PageResponse<UserResponse> cerca(String q, Pageable pageable) {
        Specification<User> spec = (root, query, cb) -> {
            if (!SearchUtils.presente(q)) {
                return cb.conjunction();
            }
            return cb.or(
                    SearchUtils.like(cb, root.get("email"), q),
                    SearchUtils.like(cb, root.get("nome"), q),
                    SearchUtils.like(cb, root.get("cognome"), q));
        };
        Pageable ordinato = PageRequest.of(pageable.getPageNumber(), pageable.getPageSize(),
                Sort.by("cognome", "nome"));
        return PageResponse.of(userRepository.findAll(spec, ordinato).map(this::toResponse));
    }

    private UserResponse toResponse(User user) {
        return new UserResponse(
                user.getId(),
                user.getEmail(),
                user.getNome(),
                user.getCognome(),
                user.getDataDiNascita(),
                user.getIndirizzo(),
                nomiRuoli(user),
                user.getCreatedAt());
    }

    private User trovaUtente(UUID userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Utente non trovato"));
    }

    private List<String> nomiRuoli(User user) {
        return ruoloUtenteRepository.findByUser(user).stream()
                .map(ru -> ru.getRuolo().getRuolo())
                .toList();
    }

    private static String normalizzaEmail(String email) {
        return email.trim().toLowerCase(Locale.ROOT);
    }
}
