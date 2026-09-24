import { useCallback, useMemo, useState } from 'react'
import { useAuth } from '@/lib/auth-context'
import { ListaContext } from '@/lib/lista-context'

// Una lista per utente: chi usa lo stesso browser con un altro account non vede i libri altrui
const chiave = (userId) => `biblioteca.lista.${userId}`

function leggi(userId) {
  if (!userId) return []
  try {
    const salvata = JSON.parse(localStorage.getItem(chiave(userId)) ?? '[]')
    if (Array.isArray(salvata)) return salvata
  } catch {
    // dato corrotto o storage non disponibile: si riparte da una lista vuota
  }
  return []
}

function salva(userId, voci) {
  if (!userId) return
  try {
    localStorage.setItem(chiave(userId), JSON.stringify(voci))
  } catch {
    // non bloccante: la lista resta valida finché la pagina è aperta
  }
}

// Del libro teniamo solo quello che serve alla pagina "La mia lista"
const riassunto = (l) => ({ id: l.id, titolo: l.titolo, autore: l.autore, isbn: l.isbn, path: l.path })

export function ListaProvider({ children }) {
  const { user } = useAuth()
  const userId = user?.id
  // La lista è associata all'utente per cui è stata letta: al cambio utente (login/logout) si rilegge.
  // Aggiornare lo stato durante il render è il pattern consigliato da React per "reagire a una prop".
  const [stato, setStato] = useState(() => ({ userId, voci: leggi(userId) }))
  if (stato.userId !== userId) setStato({ userId, voci: leggi(userId) })
  const voci = stato.voci

  // Ogni modifica passa da qui: stato React e localStorage restano allineati
  const aggiorna = useCallback(
    (trasforma) => {
      setStato((prev) => {
        const nuove = trasforma(prev.voci)
        salva(prev.userId, nuove)
        return { ...prev, voci: nuove }
      })
    },
    [],
  )

  const value = useMemo(
    () => ({
      voci,
      contiene: (id) => voci.some((v) => v.libro.id === id),
      aggiungi: (libro) =>
        aggiorna((prev) => {
          if (prev.some((v) => v.libro.id === libro.id)) return prev
          return [...prev, { libro: riassunto(libro), durata: 'MEDIA' }]
        }),
      rimuovi: (id) => aggiorna((prev) => prev.filter((v) => v.libro.id !== id)),
      impostaDurata: (id, durata) =>
        aggiorna((prev) =>
          prev.map((v) => {
            if (v.libro.id !== id) return v
            return { ...v, durata }
          }),
        ),
      svuota: () => aggiorna(() => []),
    }),
    [voci, aggiorna],
  )

  return <ListaContext.Provider value={value}>{children}</ListaContext.Provider>
}
