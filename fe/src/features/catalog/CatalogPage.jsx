import { useEffect, useState } from 'react'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { useSearchParams } from 'react-router'
import { Search } from 'lucide-react'
import { Hearth } from '@/components/Hearth'
import { Pagination } from '@/components/Pagination'
import { QueryState } from '@/components/QueryState'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { useDebouncedValue } from '@/hooks/useDebouncedValue'
import { useAuth } from '@/lib/auth-context'
import { getGenres, searchBooks } from '@/lib/endpoints'
import { BookCard } from './BookCard'

const PAGE_SIZE = 20
const TUTTI = 'tutti'

// Ordinamenti ammessi dal BE (whitelist in LibroService)
const ORDINAMENTI = [
  { value: 'titolo,asc', label: 'Titolo A–Z' },
  { value: 'autore,asc', label: 'Autore A–Z' },
  { value: 'annoDiUscita,desc', label: 'Più recenti' },
  { value: 'annoDiUscita,asc', label: 'Più antichi' },
  { value: 'prezzo,asc', label: 'Prezzo crescente' },
  { value: 'copieDisponibili,desc', label: 'Più disponibili' },
]

const skeletonGriglia = (
  <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-5">
    {Array.from({ length: 10 }, (_, i) => (
      <Skeleton key={i} className="aspect-[2/3] w-full" />
    ))}
  </div>
)

export function CatalogPage() {
  const { user } = useAuth()
  // Filtri, ordinamento e pagina vivono nell'URL: la ricerca si può condividere e sopravvive al refresh
  const [params, setParams] = useSearchParams()
  const q = params.get('q') ?? ''
  const genereId = params.get('genereId') ?? ''
  const disponibile = params.get('disponibile') === 'true'
  const sort = params.get('sort') ?? ORDINAMENTI[0].value
  const page = Number(params.get('page') ?? 0)

  // Il campo di ricerca è locale e aggiorna l'URL solo dopo una pausa di digitazione
  const [testo, setTesto] = useState(q)
  const testoDebounced = useDebouncedValue(testo)

  /** Aggiorna uno o più parametri; ogni cambio di filtro riporta a pagina 0. */
  const aggiorna = (modifiche, { resetPagina = true } = {}) => {
    setParams((prev) => {
      const next = new URLSearchParams(prev)
      for (const [k, v] of Object.entries(modifiche)) {
        if (v === '' || v === null || v === false || v === TUTTI) next.delete(k)
        else next.set(k, String(v))
      }
      if (resetPagina) next.delete('page')
      return next
    })
  }

  useEffect(() => {
    if (testoDebounced !== q) aggiorna({ q: testoDebounced.trim() })
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reagisce solo al testo digitato
  }, [testoDebounced])

  const filtri = {
    q,
    genereId,
    disponibile: disponibile || undefined,
    sort,
    page,
    size: PAGE_SIZE,
  }
  const libri = useQuery({
    queryKey: ['books', filtri],
    queryFn: ({ signal }) => searchBooks(filtri, { signal }),
    // Durante il cambio pagina restano visibili i risultati precedenti (niente salto del layout)
    placeholderData: keepPreviousData,
  })
  // allGeneri richiede il login: da anonimi il filtro per genere non compare
  const generi = useQuery({ queryKey: ['genres'], queryFn: getGenres, enabled: Boolean(user) })

  return (
    <>
      <Hearth className="px-4 pt-14 pb-20 sm:pt-20 sm:pb-28">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-xs tracking-[0.3em] text-primary uppercase">Sala di lettura</p>
          <h1 className="mt-3 text-4xl font-semibold sm:text-5xl">Cerca tra gli scaffali</h1>
          <p className="mt-3 text-muted-foreground">Titolo, autore, casa editrice, genere o ISBN.</p>
          <form role="search" onSubmit={(e) => e.preventDefault()} className="relative mx-auto mt-8 max-w-xl">
            <Label htmlFor="ricerca" className="sr-only">
              Cerca nel catalogo
            </Label>
            <Search aria-hidden="true" className="absolute top-1/2 left-3 z-10 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="ricerca"
              type="search"
              value={testo}
              onChange={(e) => setTesto(e.target.value)}
              placeholder="es. Tolkien, 9788845292613…"
              className="h-12 bg-background/60 pl-10 text-base backdrop-blur-sm"
            />
          </form>
        </div>
      </Hearth>

      <section aria-labelledby="titolo-risultati" className="mx-auto max-w-6xl px-4 py-10">
        <div className="mb-8 flex flex-wrap items-end gap-4 border-b border-border pb-4">
          <div className="mr-auto">
            <h2 id="titolo-risultati" className="text-2xl font-semibold">
              Catalogo
            </h2>
            {/* Annunciato dagli screen reader a ogni nuova ricerca */}
            <p aria-live="polite" className="text-sm text-muted-foreground">
              {libri.data && `${libri.data.totalElements} titoli trovati`}
            </p>
          </div>

          {user && (
            <div className="grid gap-1.5">
              <Label htmlFor="filtro-genere">Genere</Label>
              <Select value={genereId || TUTTI} onValueChange={(v) => aggiorna({ genereId: v })}>
                <SelectTrigger id="filtro-genere" className="w-44">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={TUTTI}>Tutti i generi</SelectItem>
                  {generi.data?.map((g) => (
                    <SelectItem key={g.id} value={g.id}>
                      {g.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="grid gap-1.5">
            <Label htmlFor="ordinamento">Ordina per</Label>
            <Select value={sort} onValueChange={(v) => aggiorna({ sort: v })}>
              <SelectTrigger id="ordinamento" className="w-44">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ORDINAMENTI.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex h-8 items-center gap-2">
            <Checkbox
              id="solo-disponibili"
              checked={disponibile}
              onCheckedChange={(v) => aggiorna({ disponibile: v === true })}
            />
            <Label htmlFor="solo-disponibili">Solo disponibili</Label>
          </div>
        </div>

        <QueryState
          query={libri}
          skeleton={skeletonGriglia}
          isEmpty={(d) => d.content.length === 0}
          empty="Nessun libro corrisponde alla ricerca. Prova con meno filtri."
        >
          {(data) => (
            <>
              <ul className="grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-3 lg:grid-cols-5">
                {data.content.map((libro) => (
                  <li key={libro.id}>
                    <BookCard libro={libro} />
                  </li>
                ))}
              </ul>
              <Pagination
                page={data.page}
                totalPages={data.totalPages}
                onChange={(p) => aggiorna({ page: p }, { resetPagina: false })}
              />
            </>
          )}
        </QueryState>
      </section>
    </>
  )
}
