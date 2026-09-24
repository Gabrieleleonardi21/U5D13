// Tutte le chiamate al backend in un solo posto: path e metodi esattamente come nei controller Spring
import { api, toQuery } from '@/lib/api'

// --- Utenti e autenticazione ---
// login e refresh impostano il cookie HttpOnly e restituiscono solo { expiresAt }
export const login = (username, password) =>
  api('/api/user/login', { method: 'POST', body: { username, password }, sessione: false })
export const register = (dati) => api('/api/user/register', { method: 'POST', body: dati, sessione: false })
export const logout = () => api('/api/user/logout', { method: 'POST', sessione: false })
export const refresh = () => api('/api/user/refresh', { method: 'POST' })
export const getMe = ({ signal }) => api('/api/user/me', { signal })
// Per capire all'avvio se c'è una sessione: 401 qui vuol dire solo "non autenticato"
export const getSessione = ({ signal }) => api('/api/user/me', { signal, sessione: false })
export const searchUsers = (params, { signal }) => api(`/api/user/search${toQuery(params)}`, { signal })

// --- Libri e generi ---
// La ricerca è POST ma senza body: filtri, pagina e sort vanno in query string
export const searchBooks = (params, { signal }) =>
  api(`/api/book/search${toQuery(params)}`, { method: 'POST', signal })
export const createBook = (libro) => api('/api/book/newLibro', { method: 'POST', body: libro })
export const addCopies = (idLibro, copie) => api('/api/book/addLibro', { method: 'PATCH', body: { idLibro, copie } })
export const getGenres = ({ signal }) => api('/api/generi/allGeneri', { signal })
export const createGenre = (nome) => api('/api/generi/newGenere', { method: 'POST', body: { nome } })

// --- Prestiti ---
export const getMyLoans = (params, { signal }) => api(`/api/prestiti/UserPrestiti${toQuery(params)}`, { signal })
export const getAllLoans = (params, { signal }) => api(`/api/prestiti/AllPrestiti${toQuery(params)}`, { signal })
export const openLoan = (dati) => api('/api/prestiti/NewPrestito', { method: 'POST', body: dati })
export const closeLoan = (idPrestito) => api('/api/prestiti/ClosePrestito', { method: 'PATCH', body: { idPrestito } })
export const extendLoan = (idPrestito, giorni) =>
  api('/api/prestiti/ExtendPrestito', { method: 'PATCH', body: { idPrestito, giorni } })

// --- Richieste di prestito ---
// Il lettore invia i libri scelti ({ libroId, durata }): le copie vengono prenotate subito
export const createRequest = (libri) => api('/api/richieste', { method: 'POST', body: { libri } })
export const getMyRequests = (params, { signal }) => api(`/api/richieste/mie${toQuery(params)}`, { signal })
export const cancelRequest = (id) => api(`/api/richieste/${encodeURIComponent(id)}/annulla`, { method: 'PATCH' })
// Admin: coda delle richieste (dalla più vecchia), approvazione e rifiuto
export const getRequests = (params, { signal }) => api(`/api/richieste${toQuery(params)}`, { signal })
export const approveRequest = (id) => api(`/api/richieste/${encodeURIComponent(id)}/approva`, { method: 'PATCH' })
export const rejectRequest = (id, motivo) =>
  api(`/api/richieste/${encodeURIComponent(id)}/rifiuta`, { method: 'PATCH', body: { motivo } })

// --- Ruoli (solo SuperUser) ---
export const createRole = (ruolo) => api('/api/role', { method: 'POST', body: { ruolo } })
export const grantAdmin = (userId) => api(`/api/role/grantAdmin/${encodeURIComponent(userId)}`, { method: 'POST' })
export const revokeAdmin = (userId) => api(`/api/role/revokeAdmin/${encodeURIComponent(userId)}`, { method: 'DELETE' })

// --- Costanti (lettura Admin, scrittura SuperUser) ---
export const getConstants = ({ signal }) => api('/api/costanti/all', { signal })
export const createConstant = (dati) => api('/api/costanti/newCostante', { method: 'POST', body: dati })
export const editConstant = (dati) => api('/api/costanti/editCostante', { method: 'PATCH', body: dati })
export const deleteConstant = (id) =>
  api(`/api/costanti/deleteCostante/${encodeURIComponent(id)}`, { method: 'DELETE' })
