import { useQuery } from '@tanstack/react-query'
import { getDurations } from '@/lib/endpoints'
import { etichettaDurata } from '@/lib/format'

/**
 * Etichette delle durate con i giorni presi dal BE, es. "Media · 15 giorni".
 * Finché i giorni non sono arrivati (o se la chiamata fallisce) resta solo "Media".
 * @returns {(durata: string) => string}
 */
export function useDurate() {
  const { data } = useQuery({ queryKey: ['durate'], queryFn: getDurations, staleTime: 5 * 60_000 })
  return (durata) => {
    const etichetta = etichettaDurata(durata)
    const giorni = data?.[durata]
    if (!giorni) return etichetta
    return `${etichetta} · ${giorni} giorni`
  }
}
