import { useState } from 'react'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { CalendarPlus, Search, Undo2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { Pagination } from '@/components/Pagination'
import { QueryState } from '@/components/QueryState'
import { useAzione } from '@/hooks/useAzione'
import { useDebouncedValue } from '@/hooks/useDebouncedValue'
import { closeLoan, getAllLoans } from '@/lib/endpoints'
import { formatEuro } from '@/lib/format'
import { LoansTable } from '@/features/loans/LoansTable'
import { StatoTabs } from '@/features/loans/StatoTabs'
import { AdminHeader } from '../AdminHeader'
import { ExtendLoanDialog } from './ExtendLoanDialog'
import { NewLoanDialog } from './NewLoanDialog'

function messaggioChiusura(p) {
  if (p.penaleRiscossa) return `Libro restituito in ritardo: penale di ${formatEuro(p.penaleRiscossa)}.`
  return 'Libro restituito in tempo.'
}

export default function LoansAdminPage() {
  const [testo, setTesto] = useState('')
  const [stato, setStato] = useState('')
  const [page, setPage] = useState(0)
  const [daChiudere, setDaChiudere] = useState(null)
  const [daProrogare, setDaProrogare] = useState(null)
  const q = useDebouncedValue(testo.trim())

  // In ritardo prima di tutto: sono quelli da sollecitare
  let sort = 'createdAt,desc'
  if (stato === 'IN_RITARDO') sort = 'dataRiconsegnaPrevista,asc'
  const filtri = { q, stato, page, size: 20, sort }
  const prestiti = useQuery({
    queryKey: ['loans', filtri],
    queryFn: ({ signal }) => getAllLoans(filtri, { signal }),
    placeholderData: keepPreviousData,
  })

  const chiudi = useAzione(closeLoan, {
    invalida: ['loans', 'books'],
    successo: messaggioChiusura,
    onSuccess: () => setDaChiudere(null),
  })

  // Ogni filtro nuovo riparte dalla prima pagina
  const conReset = (setter) => (valore) => {
    setter(valore)
    setPage(0)
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <AdminHeader titolo="Prestiti" descrizione="Tutti i prestiti: apertura, proroga e restituzione.">
        <NewLoanDialog />
      </AdminHeader>

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="relative w-full max-w-sm">
          <Label htmlFor="cerca-prestiti" className="sr-only">
            Cerca prestiti
          </Label>
          <Search aria-hidden="true" className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="cerca-prestiti"
            type="search"
            value={testo}
            onChange={(e) => conReset(setTesto)(e.target.value)}
            placeholder="Lettore, email, titolo o ISBN…"
            className="pl-9"
          />
        </div>
        <StatoTabs value={stato} onChange={conReset(setStato)} />
      </div>

      <QueryState query={prestiti} isEmpty={(d) => d.content.length === 0} empty="Nessun prestito trovato.">
        {(data) => (
          <>
            <LoansTable
              prestiti={data.content}
              mostraUtente
              azioni={(p) =>
                p.stato !== 'CHIUSO' && (
                  <div className="flex justify-end gap-1">
                    {!p.extended && (
                      <Button variant="ghost" size="sm" onClick={() => setDaProrogare(p)}>
                        <CalendarPlus aria-hidden="true" />
                        Proroga
                      </Button>
                    )}
                    <Button variant="outline" size="sm" onClick={() => setDaChiudere(p)}>
                      <Undo2 aria-hidden="true" />
                      Restituito
                    </Button>
                  </div>
                )
              }
            />
            <Pagination page={data.page} totalPages={data.totalPages} onChange={setPage} />
          </>
        )}
      </QueryState>

      <ExtendLoanDialog prestito={daProrogare} onClose={() => setDaProrogare(null)} />
      <ConfirmDialog
        open={Boolean(daChiudere)}
        onOpenChange={(aperta) => !aperta && setDaChiudere(null)}
        titolo="Registrare la restituzione?"
        descrizione={
          daChiudere &&
          `"${daChiudere.libro.titolo}" di ${daChiudere.user.nome} ${daChiudere.user.cognome}. L'eventuale penale viene calcolata in automatico.`
        }
        conferma="Conferma restituzione"
        inCorso={chiudi.isPending}
        onConfirm={() => chiudi.mutate(daChiudere.id)}
      />
    </div>
  )
}
