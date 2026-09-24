import { Link, useNavigate } from 'react-router'
import { Send, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { BookCover } from '@/components/BookCover'
import { useAzione } from '@/hooks/useAzione'
import { createRequest } from '@/lib/endpoints'
import { DURATE_PRESTITO } from '@/lib/format'
import { useLista } from '@/lib/lista-context'

function messaggioInvio(richieste) {
  if (richieste.length === 1) return 'Richiesta inviata: il libro è prenotato per te.'
  return `Richiesta inviata: ${richieste.length} libri prenotati per te.`
}

export function ListaPage() {
  const lista = useLista()
  const navigate = useNavigate()

  const invia = useAzione(createRequest, {
    // Le copie prenotate cambiano la disponibilità nel catalogo
    invalida: ['myRequests', 'books', 'requests'],
    successo: messaggioInvio,
    onSuccess: () => {
      lista.svuota()
      navigate('/prestiti')
    },
  })

  const onInvia = () => invia.mutate(lista.voci.map((v) => ({ libroId: v.libro.id, durata: v.durata })))

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <header className="mb-8 border-b border-border pb-6">
        <p className="text-xs tracking-[0.3em] text-primary uppercase">Da prendere in prestito</p>
        <h1 className="mt-2 text-4xl font-semibold">La mia lista</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Scegli la durata di ogni prestito e invia la richiesta: le copie restano prenotate finché il bibliotecario
          non la approva.
        </p>
      </header>

      {lista.voci.length === 0 && (
        <div className="rounded-md border border-dashed p-10 text-center">
          <p className="text-muted-foreground">La lista è vuota.</p>
          <Button asChild variant="outline" className="mt-4">
            <Link to="/">Sfoglia il catalogo</Link>
          </Button>
        </div>
      )}

      {lista.voci.length > 0 && (
        <>
          <ul className="divide-y divide-border rounded-md border border-border bg-card/70">
            {lista.voci.map(({ libro, durata }) => (
              <li key={libro.id} className="flex items-center gap-4 p-4">
                <BookCover libro={libro} miniatura className="w-14 shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="font-heading font-semibold">{libro.titolo}</p>
                  <p className="text-sm italic text-muted-foreground">{libro.autore}</p>
                </div>
                <div className="grid gap-1">
                  <Label htmlFor={`durata-${libro.id}`} className="text-xs">
                    Durata
                  </Label>
                  <Select value={durata} onValueChange={(v) => lista.impostaDurata(libro.id, v)}>
                    <SelectTrigger id={`durata-${libro.id}`} className="w-28">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {DURATE_PRESTITO.map((d) => (
                        <SelectItem key={d.value} value={d.value}>
                          {d.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button variant="ghost" size="icon-sm" aria-label={`Togli ${libro.titolo}`} onClick={() => lista.rimuovi(libro.id)}>
                  <X aria-hidden="true" />
                </Button>
              </li>
            ))}
          </ul>

          <div className="mt-6 flex flex-wrap items-center justify-end gap-3">
            <Button variant="ghost" onClick={lista.svuota}>
              Svuota lista
            </Button>
            <Button size="lg" disabled={invia.isPending} onClick={onInvia}>
              <Send aria-hidden="true" />
              Invia richiesta ({lista.voci.length})
            </Button>
          </div>
        </>
      )}
    </div>
  )
}
