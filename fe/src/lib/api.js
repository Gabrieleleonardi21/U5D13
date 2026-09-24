// Client HTTP verso il backend Spring.
// Le chiamate vanno sempre a /api sulla stessa origine del frontend: in sviluppo ci pensa il proxy di Vite,
// in produzione una rewrite del server statico. Serve perché il JWT viaggia in un cookie HttpOnly
// SameSite=Strict, che il browser invia solo alle richieste dello stesso sito.

// Messaggi per gli status che il backend restituisce senza body
const MESSAGGI_STATUS = {
  401: 'Sessione scaduta o credenziali non valide.',
  403: 'Non hai i permessi per questa operazione.',
  404: 'Risorsa non trovata.',
}

/** Errore HTTP con status, messaggio leggibile e, per i 400, gli errori per campo. */
export class ApiError extends Error {
  constructor(status, message, fieldErrors = {}) {
    super(message)
    this.status = status
    this.fieldErrors = fieldErrors
  }
}

// Callback di "sessione scaduta", impostata da AuthProvider
let onUnauthorized = () => {}

export function setUnauthorizedHandler(handler) {
  onUnauthorized = handler
}

/**
 * Costruisce la query string saltando i valori vuoti.
 * Gli array diventano parametri ripetuti (es. sort=titolo,asc&sort=prezzo,desc).
 */
export function toQuery(params = {}) {
  const qs = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === '') continue
    for (const v of [value].flat()) qs.append(key, String(v))
  }
  const str = qs.toString()
  if (!str) return ''
  return `?${str}`
}

async function leggiErrore(res) {
  const body = await res.json().catch(() => null)
  const fallback = MESSAGGI_STATUS[res.status] ?? `Errore ${res.status}`
  if (!body) return new ApiError(res.status, fallback)
  // Validazione: { status, errors: { campo: messaggio } }
  if (body.errors) return new ApiError(res.status, 'Controlla i campi evidenziati.', body.errors)
  return new ApiError(res.status, body.message ?? fallback)
}

/**
 * Esegue una richiesta JSON. Restituisce il body (o null se vuoto), lancia ApiError sugli status non 2xx.
 * @param {string} path es. "/api/book/all?page=0"
 * @param {{ method?: string, body?: unknown, signal?: AbortSignal, sessione?: boolean }} [options]
 *   sessione=false: un 401 non significa "sessione scaduta" (es. login con password sbagliata)
 */
export async function api(path, { method = 'GET', body, signal, sessione = true } = {}) {
  // Il cookie parte da solo (stessa origine): nessun header Authorization da gestire
  const init = { method, signal, headers: {} }
  if (body !== undefined) {
    init.headers['Content-Type'] = 'application/json'
    init.body = JSON.stringify(body)
  }
  const res = await fetch(path, init)

  // Il BE ha già cancellato il cookie non valido: qui si aggiorna solo lo stato della UI
  if (res.status === 401 && sessione) onUnauthorized()
  if (!res.ok) throw await leggiErrore(res)

  const text = await res.text()
  if (!text) return null
  return JSON.parse(text)
}
