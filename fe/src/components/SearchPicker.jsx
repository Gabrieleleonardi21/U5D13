import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Check } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useDebouncedValue } from '@/hooks/useDebouncedValue'
import { messaggioErrore } from '@/lib/errors'
import { cn } from '@/lib/utils'

/**
 * Campo di ricerca con risultati selezionabili (es. scegliere utente o libro per un prestito).
 * I risultati sono pulsanti con aria-pressed: navigabili con Tab e attivabili con Invio/Spazio.
 * @param {{ id: string, label: string, placeholder?: string, queryKey: string,
 *           cerca: (q: string, opts: { signal: AbortSignal }) => Promise<{ content: object[] }>,
 *           selezionato: object | null, onSelect: (item: object) => void,
 *           descrivi: (item: object) => { titolo: string, sottotitolo?: string, disabilitato?: boolean },
 *           error?: { message?: string } }} props
 */
export function SearchPicker({ id, label, placeholder, queryKey, cerca, selezionato, onSelect, descrivi, error }) {
  const [testo, setTesto] = useState('')
  const q = useDebouncedValue(testo.trim())
  const risultati = useQuery({
    queryKey: [queryKey, 'picker', q],
    queryFn: ({ signal }) => cerca(q, { signal }),
  })
  const errorId = `${id}-errore`

  let elenco = null
  if (risultati.isError) elenco = <p className="p-3 text-sm text-destructive">{messaggioErrore(risultati.error)}</p>
  if (risultati.data?.content.length === 0) elenco = <p className="p-3 text-sm text-muted-foreground">Nessun risultato.</p>
  if (risultati.data?.content.length > 0) {
    elenco = (
      <ul className="divide-y divide-border">
        {risultati.data.content.map((item) => {
          const d = descrivi(item)
          const attivo = selezionato?.id === item.id
          return (
            <li key={item.id}>
              <button
                type="button"
                aria-pressed={attivo}
                disabled={d.disabilitato}
                onClick={() => onSelect(item)}
                className={cn(
                  'flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-muted focus-visible:bg-muted focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50',
                  attivo && 'bg-accent',
                )}
              >
                <span className="flex-1">
                  <span className="font-medium">{d.titolo}</span>
                  {d.sottotitolo && <span className="block text-xs text-muted-foreground">{d.sottotitolo}</span>}
                </span>
                {attivo && <Check aria-hidden="true" className="size-4 text-primary" />}
              </button>
            </li>
          )
        })}
      </ul>
    )
  }

  return (
    <div className="grid gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        type="search"
        value={testo}
        onChange={(e) => setTesto(e.target.value)}
        placeholder={placeholder}
        aria-invalid={Boolean(error)}
        aria-describedby={error && errorId}
      />
      <div aria-live="polite" className="max-h-48 overflow-y-auto rounded-md border border-border">
        {elenco}
      </div>
      {error && (
        <p id={errorId} role="alert" className="text-xs text-destructive">
          {error.message}
        </p>
      )}
    </div>
  )
}
