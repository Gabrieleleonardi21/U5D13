import { createContext, useContext } from 'react'

export const ListaContext = createContext(null)

/**
 * Libri che il lettore ha selezionato per chiederli in prestito (non ancora inviati).
 * { voci, contiene, aggiungi, rimuovi, impostaDurata, svuota }
 */
export function useLista() {
  const ctx = useContext(ListaContext)
  if (!ctx) throw new Error('useLista va usato dentro <ListaProvider>')
  return ctx
}
