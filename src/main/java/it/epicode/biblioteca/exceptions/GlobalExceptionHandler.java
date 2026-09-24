package it.epicode.biblioteca.exceptions;

import org.springframework.http.HttpStatus;
import org.springframework.orm.ObjectOptimisticLockingFailureException;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.server.ResponseStatusException;

import java.util.LinkedHashMap;
import java.util.Map;

@RestControllerAdvice
public class GlobalExceptionHandler {

    // 400 con l'elenco dei campi non validi: { "errors": { "email": "...", ... } }
    @ExceptionHandler(MethodArgumentNotValidException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public Map<String, Object> handleValidation(MethodArgumentNotValidException ex) {
        Map<String, String> errors = new LinkedHashMap<>();
        ex.getBindingResult().getFieldErrors()
                .forEach(e -> errors.putIfAbsent(e.getField(), e.getDefaultMessage()));
        return Map.of("status", 400, "errors", errors);
    }

    // Errori di business (404, 409, ...): { "status": 409, "message": "..." }
    // Espone solo i messaggi scritti nei service, mai quelli di eccezioni inattese (restano 500 generici)
    @ExceptionHandler(ResponseStatusException.class)
    public ResponseEntity<Map<String, Object>> handleStatus(ResponseStatusException ex) {
        int status = ex.getStatusCode().value();
        String message = ex.getReason();
        if (message == null) {
            message = HttpStatus.valueOf(status).getReasonPhrase();
        }
        return ResponseEntity.status(status).body(Map.of("status", status, "message", message));
    }

    // Due admin hanno gestito la stessa richiesta nello stesso momento (@Version): vince il primo
    @ExceptionHandler(ObjectOptimisticLockingFailureException.class)
    @ResponseStatus(HttpStatus.CONFLICT)
    public Map<String, Object> handleConcorrenza(ObjectOptimisticLockingFailureException ex) {
        return Map.of("status", 409, "message", "La richiesta è stata appena gestita da un altro admin: ricarica la pagina.");
    }
}
