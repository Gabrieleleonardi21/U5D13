import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { QueryState } from '@/components/QueryState'
import { useAzione } from '@/hooks/useAzione'
import { cancelRequest, getMyRequests } from '@/lib/endpoints'
import { etichettaDurata, formatData, STATI_RICHIESTA } from '@/lib/format'

/** Richieste di prestito del lettore: stato, eventuale motivo del rifiuto, annullamento se in attesa. */
export function MyRequests() {
  const [daAnnullare, setDaAnnullare] = useState(null)
  const richieste = useQuery({
    queryKey: ['myRequests'],
    queryFn: ({ signal }) => getMyRequests({ size: 10 }, { signal }),
  })

  const annulla = useAzione(cancelRequest, {
    invalida: ['myRequests', 'books'],
    successo: (r) => `Richiesta annullata: "${r.libro.titolo}" torna disponibile.`,
    onSuccess: () => setDaAnnullare(null),
  })

  return (
    <section aria-labelledby="titolo-richieste" className="mb-12">
      <h2 id="titolo-richieste" className="mb-4 text-2xl font-semibold">
        Le mie richieste
      </h2>
      <QueryState
        query={richieste}
        isEmpty={(d) => d.content.length === 0}
        empty="Nessuna richiesta: aggiungi libri alla lista dal catalogo."
      >
        {(data) => (
          <div className="overflow-x-auto rounded-md border border-border bg-card/70">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Libro</TableHead>
                  <TableHead>Durata</TableHead>
                  <TableHead>Richiesto il</TableHead>
                  <TableHead>Stato</TableHead>
                  <TableHead>
                    <span className="sr-only">Azioni</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.content.map((r) => {
                  const stato = STATI_RICHIESTA[r.stato]
                  return (
                    <TableRow key={r.id}>
                      <TableCell>
                        <span className="font-medium">{r.libro.titolo}</span>
                        <span className="block text-xs text-muted-foreground">{r.libro.autore}</span>
                      </TableCell>
                      <TableCell>{etichettaDurata(r.durata)}</TableCell>
                      <TableCell>{formatData(r.createdAt)}</TableCell>
                      <TableCell>
                        <Badge variant={stato.variant}>{stato.label}</Badge>
                        {r.motivoRifiuto && (
                          <span className="mt-1 block text-xs text-muted-foreground">{r.motivoRifiuto}</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {r.stato === 'IN_ATTESA' && (
                          <Button variant="ghost" size="sm" onClick={() => setDaAnnullare(r)}>
                            Annulla
                            <span className="sr-only"> la richiesta di {r.libro.titolo}</span>
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </QueryState>

      <ConfirmDialog
        open={Boolean(daAnnullare)}
        onOpenChange={(aperta) => !aperta && setDaAnnullare(null)}
        titolo="Annullare la richiesta?"
        descrizione={daAnnullare && `"${daAnnullare.libro.titolo}" non sarà più prenotato per te.`}
        conferma="Annulla richiesta"
        esci="Mantieni"
        distruttiva
        inCorso={annulla.isPending}
        onConfirm={() => annulla.mutate(daAnnullare.id)}
      />
    </section>
  )
}
