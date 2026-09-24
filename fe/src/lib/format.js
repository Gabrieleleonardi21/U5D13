// Formattazione in italiano di importi e date restituiti dal backend
const euro = new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' })
const data = new Intl.DateTimeFormat('it-IT', { day: '2-digit', month: 'short', year: 'numeric' })

export function formatEuro(valore) {
  if (valore === null || valore === undefined) return '—'
  return euro.format(valore)
}

/** Accetta "YYYY-MM-DD" (LocalDate) o ISO-8601 (Instant). */
export function formatData(valore) {
  if (!valore) return '—'
  // Una LocalDate senza orario verrebbe letta come UTC: la fissiamo a mezzogiorno locale
  const soloData = /^\d{4}-\d{2}-\d{2}$/.test(valore)
  if (soloData) return data.format(new Date(`${valore}T12:00:00`))
  return data.format(new Date(valore))
}

export function nomeCompleto(persona) {
  if (!persona) return '—'
  return `${persona.nome} ${persona.cognome}`
}

// Etichette e colori degli stati prestito (StatoPrestito lato BE)
export const STATI_PRESTITO = {
  APERTO: { label: 'In corso', variant: 'secondary' },
  IN_RITARDO: { label: 'In ritardo', variant: 'destructive' },
  CHIUSO: { label: 'Restituito', variant: 'outline' },
}

// Stati delle richieste di prestito (StatoRichiesta lato BE)
export const STATI_RICHIESTA = {
  IN_ATTESA: { label: 'In attesa', variant: 'secondary' },
  APPROVATA: { label: 'Approvata', variant: 'outline' },
  RIFIUTATA: { label: 'Rifiutata', variant: 'destructive' },
  ANNULLATA: { label: 'Annullata', variant: 'outline' },
}

export function etichettaDurata(valore) {
  return DURATE_PRESTITO.find((d) => d.value === valore)?.label ?? valore
}

export const DURATE_PRESTITO = [
  { value: 'BREVE', label: 'Breve' },
  { value: 'MEDIA', label: 'Media' },
  { value: 'LUNGA', label: 'Lunga' },
]
