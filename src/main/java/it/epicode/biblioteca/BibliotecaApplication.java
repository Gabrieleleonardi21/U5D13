package it.epicode.biblioteca;

import it.epicode.biblioteca.config.DatabaseUrl;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
// Attiva i job @Scheduled (es. PuliziaTokenJob)
@EnableScheduling
public class BibliotecaApplication {

	public static void main(String[] args) {
		// Su Render le credenziali arrivano in DATABASE_URL, formato non JDBC:
		// la traduzione va fatta prima che parta il contesto Spring.
		DatabaseUrl.applicaSePresente();

		SpringApplication.run(BibliotecaApplication.class, args);
	}

}
