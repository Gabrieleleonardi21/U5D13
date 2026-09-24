import { useState } from 'react'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { Badge } from '@/components/ui/badge'
import { Pagination } from '@/components/Pagination'
import { QueryState } from '@/components/QueryState'
import { useAuth } from '@/lib/auth-context'
import { getMyLoans } from '@/lib/endpoints'
import { formatData } from '@/lib/format'
import { LoansTable } from './LoansTable'
import { MyRequests } from './MyRequests'
import { StatoTabs } from './StatoTabs'

export function MyLoansPage() {
  // Il profilo è già stato caricato da AuthProvider (/api/user/me): nessuna richiesta in più
  const { profilo } = useAuth()
  const [stato, setStato] = useState('')
  const [page, setPage] = useState(0)

  const filtri = { stato, page, size: 20, sort: 'createdAt,desc' }
  const prestiti = useQuery({
    queryKey: ['myLoans', filtri],
    queryFn: ({ signal }) => getMyLoans(filtri, { signal }),
    placeholderData: keepPreviousData,
  })

  const cambiaStato = (s) => {
    setStato(s)
    setPage(0)
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      {/* Intestazione "tessera del lettore" */}
      <header className="mb-10">
        <p className="text-xs tracking-[0.3em] text-primary uppercase">Tessera del lettore</p>
        <h1 className="mt-2 text-4xl font-semibold">
          {profilo.nome} {profilo.cognome}
        </h1>
        <p className="mt-2 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
          {profilo.email} · iscritto dal {formatData(profilo.createdAt)}
          {profilo.ruoli.map((r) => (
            <Badge key={r} variant="outline">
              {r}
            </Badge>
          ))}
        </p>
      </header>

      <MyRequests />

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-2xl font-semibold">I miei prestiti</h2>
        <StatoTabs value={stato} onChange={cambiaStato} />
      </div>

      <QueryState query={prestiti} isEmpty={(d) => d.content.length === 0} empty="Nessun prestito da mostrare.">
        {(data) => (
          <>
            <LoansTable prestiti={data.content} />
            <Pagination page={data.page} totalPages={data.totalPages} onChange={setPage} />
          </>
        )}
      </QueryState>
    </div>
  )
}
