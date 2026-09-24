import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { formatData, formatEuro, nomeCompleto, STATI_PRESTITO } from '@/lib/format'

/**
 * Tabella dei prestiti (PrestitoResponse del BE).
 * @param {{ prestiti: object[], mostraUtente?: boolean, azioni?: (prestito: object) => import('react').ReactNode }} props
 */
export function LoansTable({ prestiti, mostraUtente = false, azioni }) {
  return (
    <div className="overflow-x-auto rounded-md border border-border bg-card/70">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Libro</TableHead>
            {mostraUtente && <TableHead>Lettore</TableHead>}
            <TableHead>Aperto il</TableHead>
            <TableHead>Da restituire</TableHead>
            <TableHead>Restituito</TableHead>
            <TableHead>Penale</TableHead>
            <TableHead>Stato</TableHead>
            {azioni && (
              <TableHead>
                <span className="sr-only">Azioni</span>
              </TableHead>
            )}
          </TableRow>
        </TableHeader>
        <TableBody>
          {prestiti.map((p) => {
            const stato = STATI_PRESTITO[p.stato]
            return (
              <TableRow key={p.id}>
                <TableCell>
                  <span className="font-medium">{p.libro.titolo}</span>
                  <span className="block text-xs text-muted-foreground">{p.libro.autore}</span>
                </TableCell>
                {mostraUtente && (
                  <TableCell>
                    {nomeCompleto(p.user)}
                    <span className="block text-xs text-muted-foreground">{p.user.email}</span>
                  </TableCell>
                )}
                <TableCell>{formatData(p.createdAt)}</TableCell>
                <TableCell>
                  {formatData(p.dataRiconsegnaPrevista)}
                  {p.extended && <span className="block text-xs text-muted-foreground">prorogato</span>}
                </TableCell>
                <TableCell>{formatData(p.dataRiconsegnaEffettiva)}</TableCell>
                <TableCell className="tabular-nums">{formatEuro(p.penaleRiscossa)}</TableCell>
                <TableCell>
                  <Badge variant={stato.variant}>{stato.label}</Badge>
                </TableCell>
                {azioni && <TableCell className="text-right">{azioni(p)}</TableCell>}
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}
