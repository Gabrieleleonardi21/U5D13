import { useState } from 'react'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { PackagePlus, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Pagination } from '@/components/Pagination'
import { QueryState } from '@/components/QueryState'
import { useDebouncedValue } from '@/hooks/useDebouncedValue'
import { searchBooks } from '@/lib/endpoints'
import { formatEuro } from '@/lib/format'
import { AdminHeader } from '../AdminHeader'
import { AddCopiesDialog } from './AddCopiesDialog'
import { NewBookDialog } from './NewBookDialog'
import { NewGenreDialog } from './NewGenreDialog'

export default function BooksAdminPage() {
  const [testo, setTesto] = useState('')
  const [page, setPage] = useState(0)
  const [libroCopie, setLibroCopie] = useState(null)
  const q = useDebouncedValue(testo.trim())

  const filtri = { q, page, size: 20, sort: 'titolo,asc' }
  const libri = useQuery({
    queryKey: ['books', filtri],
    queryFn: ({ signal }) => searchBooks(filtri, { signal }),
    placeholderData: keepPreviousData,
  })

  const cerca = (valore) => {
    setTesto(valore)
    setPage(0)
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <AdminHeader titolo="Libri" descrizione="Inventario del catalogo, nuovi titoli e nuove copie.">
        <NewGenreDialog />
        <NewBookDialog />
      </AdminHeader>

      <div className="relative mb-4 max-w-sm">
        <Label htmlFor="cerca-libri" className="sr-only">
          Cerca libri
        </Label>
        <Search aria-hidden="true" className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          id="cerca-libri"
          type="search"
          value={testo}
          onChange={(e) => cerca(e.target.value)}
          placeholder="Titolo, autore, ISBN…"
          className="pl-9"
        />
      </div>

      <QueryState query={libri} isEmpty={(d) => d.content.length === 0} empty="Nessun libro trovato.">
        {(data) => (
          <>
            <div className="overflow-x-auto rounded-md border border-border bg-card/70">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Titolo</TableHead>
                    <TableHead>Genere</TableHead>
                    <TableHead>ISBN</TableHead>
                    <TableHead className="text-right">Prezzo</TableHead>
                    <TableHead className="text-right">Disponibili</TableHead>
                    <TableHead>
                      <span className="sr-only">Azioni</span>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.content.map((l) => (
                    <TableRow key={l.id}>
                      <TableCell>
                        <span className="font-medium">{l.titolo}</span>
                        <span className="block text-xs text-muted-foreground">
                          {l.autore} · {l.casaEditrice}, {l.annoDiUscita}
                        </span>
                      </TableCell>
                      <TableCell>{l.genere}</TableCell>
                      <TableCell className="font-mono text-xs">{l.isbn}</TableCell>
                      <TableCell className="text-right tabular-nums">{formatEuro(l.prezzo)}</TableCell>
                      <TableCell className="text-right tabular-nums">
                        {l.copieDisponibili} / {l.copieTotali}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" onClick={() => setLibroCopie(l)}>
                          <PackagePlus aria-hidden="true" />
                          Copie
                          <span className="sr-only"> di {l.titolo}</span>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <Pagination page={data.page} totalPages={data.totalPages} onChange={setPage} />
          </>
        )}
      </QueryState>

      <AddCopiesDialog libro={libroCopie} onClose={() => setLibroCopie(null)} />
    </div>
  )
}
