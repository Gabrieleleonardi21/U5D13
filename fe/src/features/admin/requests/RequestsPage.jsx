import { useState } from 'react'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { Check, X } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { FormDialog } from '@/components/FormDialog'
import { FormField } from '@/components/FormField'
import { Pagination } from '@/components/Pagination'
import { QueryState } from '@/components/QueryState'
import { useAzione } from '@/hooks/useAzione'
import { useDurate } from '@/hooks/useDurate'
import { approveRequest, getRequests, rejectRequest } from '@/lib/endpoints'
import { formatData, nomeCompleto, STATI_RICHIESTA } from '@/lib/format'
import { AdminHeader } from '../AdminHeader'

// Dopo approvazione/rifiuto cambiano coda, prestiti, disponibilità e contatore nel menu
const DA_INVALIDARE = ['requests', 'loans', 'books']

export default function RequestsPage() {
  const etichettaDurata = useDurate()
  const [stato, setStato] = useState('IN_ATTESA')
  const [page, setPage] = useState(0)
  const [daRifiutare, setDaRifiutare] = useState(null)
  const form = useForm({ defaultValues: { motivo: '' } })

  const filtri = { stato, page, size: 20 }
  const richieste = useQuery({
    queryKey: ['requests', filtri],
    queryFn: ({ signal }) => getRequests(filtri, { signal }),
    placeholderData: keepPreviousData,
  })

  const approva = useAzione(approveRequest, {
    invalida: DA_INVALIDARE,
    successo: (r) => `Prestito aperto: "${r.libro.titolo}" a ${nomeCompleto(r.user)}.`,
  })
  const rifiuta = useAzione(({ id, motivo }) => rejectRequest(id, motivo), {
    form,
    invalida: DA_INVALIDARE,
    successo: (r) => `Richiesta rifiutata: "${r.libro.titolo}" torna disponibile.`,
    onSuccess: () => {
      form.reset()
      setDaRifiutare(null)
    },
  })

  const cambiaStato = (s) => {
    setStato(s)
    setPage(0)
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <AdminHeader
        titolo="Richieste"
        descrizione="Libri chiesti dai lettori: le copie sono già prenotate. Approvando si apre il prestito."
      />

      <Tabs value={stato} onValueChange={cambiaStato} className="mb-4">
        <TabsList aria-label="Filtra per stato">
          {Object.entries(STATI_RICHIESTA).map(([chiave, s]) => (
            <TabsTrigger key={chiave} value={chiave}>
              {s.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <QueryState query={richieste} isEmpty={(d) => d.content.length === 0} empty="Nessuna richiesta in questo stato.">
        {(data) => (
          <>
            <div className="overflow-x-auto rounded-md border border-border bg-card/70">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Lettore</TableHead>
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
                    const s = STATI_RICHIESTA[r.stato]
                    return (
                      <TableRow key={r.id}>
                        <TableCell>
                          {nomeCompleto(r.user)}
                          <span className="block text-xs text-muted-foreground">{r.user.email}</span>
                        </TableCell>
                        <TableCell>
                          <span className="font-medium">{r.libro.titolo}</span>
                          <span className="block text-xs text-muted-foreground">{r.libro.autore}</span>
                        </TableCell>
                        <TableCell>{etichettaDurata(r.durata)}</TableCell>
                        <TableCell>{formatData(r.createdAt)}</TableCell>
                        <TableCell>
                          <Badge variant={s.variant}>{s.label}</Badge>
                          {r.motivoRifiuto && (
                            <span className="mt-1 block text-xs text-muted-foreground">{r.motivoRifiuto}</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          {r.stato === 'IN_ATTESA' && (
                            <div className="flex justify-end gap-1">
                              <Button size="sm" disabled={approva.isPending} onClick={() => approva.mutate(r.id)}>
                                <Check aria-hidden="true" />
                                Approva
                                <span className="sr-only"> {r.libro.titolo} per {nomeCompleto(r.user)}</span>
                              </Button>
                              <Button variant="ghost" size="sm" onClick={() => setDaRifiutare(r)}>
                                <X aria-hidden="true" />
                                Rifiuta
                              </Button>
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
            <Pagination page={data.page} totalPages={data.totalPages} onChange={setPage} />
          </>
        )}
      </QueryState>

      <FormDialog
        open={Boolean(daRifiutare)}
        onOpenChange={(aperta) => !aperta && setDaRifiutare(null)}
        titolo="Rifiutare la richiesta?"
        descrizione={
          daRifiutare && `"${daRifiutare.libro.titolo}" per ${nomeCompleto(daRifiutare.user)}. La copia torna disponibile.`
        }
        onSubmit={form.handleSubmit((d) => rifiuta.mutate({ id: daRifiutare.id, motivo: d.motivo.trim() || null }))}
        conferma="Rifiuta richiesta"
        inCorso={rifiuta.isPending}
      >
        <FormField
          id="motivo-rifiuto"
          label="Motivo (facoltativo)"
          hint="Il lettore lo vede accanto alla richiesta."
          maxLength={255}
          error={form.formState.errors.motivo}
          {...form.register('motivo')}
        />
      </FormDialog>
    </div>
  )
}
