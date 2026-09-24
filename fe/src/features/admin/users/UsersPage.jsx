import { useState } from 'react'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { Search, ShieldCheck, ShieldOff } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { Pagination } from '@/components/Pagination'
import { QueryState } from '@/components/QueryState'
import { useAzione } from '@/hooks/useAzione'
import { useDebouncedValue } from '@/hooks/useDebouncedValue'
import { useAuth } from '@/lib/auth-context'
import { grantAdmin, revokeAdmin, searchUsers } from '@/lib/endpoints'
import { formatData } from '@/lib/format'
import { AdminHeader } from '../AdminHeader'
import { NewRoleDialog } from './NewRoleDialog'

// Testi della conferma: promuovere o revocare chiude tutte le sessioni dell'utente (token revocati dal BE)
const AZIONI_RUOLO = {
  grant: {
    titolo: 'Promuovere ad Admin?',
    conferma: 'Promuovi',
    esito: 'promosso ad Admin',
    fn: grantAdmin,
  },
  revoke: {
    titolo: 'Revocare il ruolo Admin?',
    conferma: 'Revoca',
    esito: 'non è più Admin',
    fn: revokeAdmin,
  },
}

export default function UsersPage() {
  const { user: io } = useAuth()
  const [testo, setTesto] = useState('')
  const [page, setPage] = useState(0)
  // { utente, tipo: 'grant' | 'revoke' } in attesa di conferma
  const [richiesta, setRichiesta] = useState(null)
  const q = useDebouncedValue(testo.trim())

  const filtri = { q, page, size: 20 }
  const utenti = useQuery({
    queryKey: ['users', filtri],
    queryFn: ({ signal }) => searchUsers(filtri, { signal }),
    placeholderData: keepPreviousData,
  })

  const cambiaRuolo = useAzione(({ utente, tipo }) => AZIONI_RUOLO[tipo].fn(utente.id), {
    invalida: ['users'],
    successo: (_, { utente, tipo }) => `${utente.nome} ${utente.cognome} ${AZIONI_RUOLO[tipo].esito}.`,
    onSuccess: () => setRichiesta(null),
  })

  let azione = null
  if (richiesta) azione = AZIONI_RUOLO[richiesta.tipo]

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <AdminHeader titolo="Utenti" descrizione="Lettori registrati e ruoli di amministrazione.">
        <NewRoleDialog />
      </AdminHeader>

      <div className="relative mb-4 max-w-sm">
        <Label htmlFor="cerca-utenti" className="sr-only">
          Cerca utenti
        </Label>
        <Search aria-hidden="true" className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          id="cerca-utenti"
          type="search"
          value={testo}
          onChange={(e) => {
            setTesto(e.target.value)
            setPage(0)
          }}
          placeholder="Nome, cognome o email…"
          className="pl-9"
        />
      </div>

      <QueryState query={utenti} isEmpty={(d) => d.content.length === 0} empty="Nessun utente trovato.">
        {(data) => (
          <>
            <div className="overflow-x-auto rounded-md border border-border bg-card/70">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Lettore</TableHead>
                    <TableHead>Iscritto dal</TableHead>
                    <TableHead>Ruoli</TableHead>
                    <TableHead>
                      <span className="sr-only">Azioni</span>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.content.map((u) => {
                    const isAdmin = u.ruoli.includes('Admin')
                    const isSuper = u.ruoli.includes('SuperUser')
                    // Il SuperUser non modifica sé stesso né altri SuperUser
                    const modificabile = !isSuper && u.id !== io.id
                    return (
                      <TableRow key={u.id}>
                        <TableCell>
                          <span className="font-medium">
                            {u.nome} {u.cognome}
                          </span>
                          <span className="block text-xs text-muted-foreground">{u.email}</span>
                        </TableCell>
                        <TableCell>{formatData(u.createdAt)}</TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {u.ruoli.map((r) => (
                              <Badge key={r} variant="outline">
                                {r}
                              </Badge>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          {modificabile && !isAdmin && (
                            <Button variant="ghost" size="sm" onClick={() => setRichiesta({ utente: u, tipo: 'grant' })}>
                              <ShieldCheck aria-hidden="true" />
                              Rendi Admin
                            </Button>
                          )}
                          {modificabile && isAdmin && (
                            <Button variant="ghost" size="sm" onClick={() => setRichiesta({ utente: u, tipo: 'revoke' })}>
                              <ShieldOff aria-hidden="true" />
                              Revoca Admin
                            </Button>
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

      <ConfirmDialog
        open={Boolean(richiesta)}
        onOpenChange={(aperta) => !aperta && setRichiesta(null)}
        titolo={azione?.titolo ?? ''}
        descrizione={
          richiesta &&
          `${richiesta.utente.nome} ${richiesta.utente.cognome} (${richiesta.utente.email}) verrà disconnesso da tutti i dispositivi e dovrà accedere di nuovo.`
        }
        conferma={azione?.conferma ?? ''}
        distruttiva={richiesta?.tipo === 'revoke'}
        inCorso={cambiaRuolo.isPending}
        onConfirm={() => cambiaRuolo.mutate(richiesta)}
      />
    </div>
  )
}
