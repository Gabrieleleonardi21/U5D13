// Costanti di sistema create da DataInitializer: descrizione leggibile e regola di validazione del BE
export const COSTANTI_SISTEMA = {
  'prestito.durata.breve': { descrizione: 'Durata prestito breve (giorni)', regola: 'Intero tra 1 e 365.' },
  'prestito.durata.media': { descrizione: 'Durata prestito medio (giorni)', regola: 'Intero tra 1 e 365.' },
  'prestito.durata.lunga': { descrizione: 'Durata prestito lungo (giorni)', regola: 'Intero tra 1 e 365.' },
  'prestito.penale.giornaliera': {
    descrizione: 'Penale per giorno di ritardo (€)',
    regola: 'Importo tra 0.00 e 99.99, massimo due decimali.',
  },
  'prestito.penale.massima': {
    descrizione: 'Tetto massimo della penale (€)',
    regola: 'Importo tra 0.00 e 99.99, massimo due decimali.',
  },
  'prestito.max.per.utente': {
    descrizione: 'Libri per lettore (prestiti in corso + richieste in attesa)',
    regola: 'Intero tra 1 e 100.',
  },
}
