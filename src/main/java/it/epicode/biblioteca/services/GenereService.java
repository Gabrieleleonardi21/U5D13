package it.epicode.biblioteca.services;

import it.epicode.biblioteca.dto.GenereResponse;
import it.epicode.biblioteca.entities.Genere;
import it.epicode.biblioteca.repositories.GenereRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
@RequiredArgsConstructor
public class GenereService {

    private final GenereRepository genereRepository;

    @Transactional
    public GenereResponse crea(String nome) {
        String pulito = nome.trim();
        // "Fantasy" e "fantasy" sono lo stesso genere
        if (genereRepository.findByNomeIgnoreCase(pulito).isPresent()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Genere già esistente");
        }
        return GenereResponse.of(genereRepository.save(new Genere(pulito)));
    }

    @Transactional(readOnly = true)
    public List<GenereResponse> tutti() {
        return genereRepository.findAll(Sort.by("nome")).stream()
                .map(GenereResponse::of)
                .toList();
    }
}
