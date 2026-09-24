import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { QueryState } from '@/components/QueryState'
import { useAzione } from '@/hooks/useAzione'
import { useAuth } from '@/lib/auth-context'
import { deleteConstant, getConstants } from '@/lib/endpoints'
import { AdminHeader } from '../AdminHeader'
import { ConstantDialog } from './ConstantDialog'
import { COSTANTI_SISTEMA } from './costantiSistema'

// Eliminare una costante di sistema non la toglie davvero: il BE torna al valore di default
function descrizioneEliminazione(c) {
  if (COSTANTI_SISTEMA[c.chiave]) return `"${c.chiave}" è di sistema: verrà ripristinato il valore di default.`
  return `"${c.chiave}" verrà eliminata definitivamente.`
}

export default function ConstantsPage() {
  const { isSuperUser } = useAuth()
  const [inModifica, setInModifica] = useState(null)
  const [daEliminare, setDaEliminare] = useState(null)
  const costanti = useQuery({ queryKey: ['constants'], queryFn: getConstants })

  const elimina = useAzione(deleteConstant, {
    invalida: ['constants', 'durate'],
    successo: 'Costante eliminata.',
    onSuccess: () => setDaEliminare(null),
  })

  let descrizione = 'Parametri della biblioteca. Solo il SuperUser può modificarli.'
  if (isSuperUser) descrizione = 'Parametri della biblioteca: durate dei prestiti, penali e valori personalizzati.'

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <AdminHeader titolo="Costanti" descrizione={descrizione}>
        {isSuperUser && (
          <Button onClick={() => setInModifica('nuova')}>
            <Plus aria-hidden="true" />
            Nuova costante
          </Button>
        )}
      </AdminHeader>

      <QueryState query={costanti} isEmpty={(d) => d.length === 0} empty="Nessuna costante.">
        {(data) => (
          <div className="overflow-x-auto rounded-md border border-border bg-card/70">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Chiave</TableHead>
                  <TableHead>Valore</TableHead>
                  {isSuperUser && (
                    <TableHead>
                      <span className="sr-only">Azioni</span>
                    </TableHead>
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((c) => {
                  const sistema = COSTANTI_SISTEMA[c.chiave]
                  return (
                    <TableRow key={c.id}>
                      <TableCell>
                        <span className="font-mono text-xs">{c.chiave}</span>
                        {sistema && (
                          <span className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
                            {sistema.descrizione}
                            <Badge variant="outline">sistema</Badge>
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="tabular-nums">{c.valore}</TableCell>
                      {isSuperUser && (
                        <TableCell className="text-right">
                          <Button variant="ghost" size="icon-sm" aria-label={`Modifica ${c.chiave}`} onClick={() => setInModifica(c)}>
                            <Pencil aria-hidden="true" />
                          </Button>
                          <Button variant="ghost" size="icon-sm" aria-label={`Elimina ${c.chiave}`} onClick={() => setDaEliminare(c)}>
                            <Trash2 aria-hidden="true" />
                          </Button>
                        </TableCell>
                      )}
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </QueryState>

      <ConstantDialog costante={inModifica} onClose={() => setInModifica(null)} />
      <ConfirmDialog
        open={Boolean(daEliminare)}
        onOpenChange={(aperta) => !aperta && setDaEliminare(null)}
        titolo="Eliminare la costante?"
        descrizione={daEliminare && descrizioneEliminazione(daEliminare)}
        conferma="Elimina"
        distruttiva
        inCorso={elimina.isPending}
        onConfirm={() => elimina.mutate(daEliminare.id)}
      />
    </div>
  )
}
