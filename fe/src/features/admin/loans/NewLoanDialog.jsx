import { useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { BookPlus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { FormDialog } from '@/components/FormDialog'
import { FormField } from '@/components/FormField'
import { SearchPicker } from '@/components/SearchPicker'
import { useAzione } from '@/hooks/useAzione'
import { useDurate } from '@/hooks/useDurate'
import { openLoan, searchBooks, searchUsers } from '@/lib/endpoints'
import { DURATE_PRESTITO } from '@/lib/format'

// Nel form teniamo gli oggetti scelti (per mostrarli), al BE mandiamo solo gli id
const schema = z.object({
  utente: z.object({ id: z.string() }, 'Scegli il lettore.'),
  libro: z.object({ id: z.string() }, 'Scegli il libro.'),
  durata: z.enum(['BREVE', 'MEDIA', 'LUNGA']),
})

const VUOTO = { utente: null, libro: null, durata: 'MEDIA' }

// Solo i primi 5 risultati: il picker serve a scegliere, non a sfogliare
const cercaUtenti = (q, opts) => searchUsers({ q, size: 5 }, opts)
const cercaLibri = (q, opts) => searchBooks({ q, size: 5, sort: 'titolo,asc' }, opts)

export function NewLoanDialog() {
  const [open, setOpen] = useState(false)
  const etichettaDurata = useDurate()
  const form = useForm({ resolver: zodResolver(schema), defaultValues: VUOTO })
  const { errors } = form.formState

  const apri = useAzione(openLoan, {
    invalida: ['loans', 'books'],
    successo: (p) => `Prestito aperto: "${p.libro.titolo}" a ${p.user.nome} ${p.user.cognome}.`,
    onSuccess: () => {
      form.reset(VUOTO)
      setOpen(false)
    },
  })

  const onSubmit = form.handleSubmit((d) => apri.mutate({ userId: d.utente.id, libroId: d.libro.id, durata: d.durata }))

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <BookPlus aria-hidden="true" />
        Nuovo prestito
      </Button>
      <FormDialog
        open={open}
        onOpenChange={setOpen}
        titolo="Nuovo prestito"
        descrizione="Cerca il lettore e il libro, poi scegli la durata."
        onSubmit={onSubmit}
        conferma="Apri prestito"
        inCorso={apri.isPending}
        larga
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Controller
            control={form.control}
            name="utente"
            render={({ field }) => (
              <SearchPicker
                id="prestito-utente"
                label="Lettore"
                placeholder="Nome, cognome o email"
                queryKey="users"
                cerca={cercaUtenti}
                selezionato={field.value}
                onSelect={field.onChange}
                descrivi={(u) => ({ titolo: `${u.nome} ${u.cognome}`, sottotitolo: u.email })}
                error={errors.utente}
              />
            )}
          />
          <Controller
            control={form.control}
            name="libro"
            render={({ field }) => (
              <SearchPicker
                id="prestito-libro"
                label="Libro"
                placeholder="Titolo, autore o ISBN"
                queryKey="books"
                cerca={cercaLibri}
                selezionato={field.value}
                onSelect={field.onChange}
                descrivi={(l) => ({
                  titolo: l.titolo,
                  sottotitolo: `${l.autore} · ${l.copieDisponibili} disponibili`,
                  // Senza copie il BE risponderebbe 409: meglio non poterlo scegliere
                  disabilitato: l.copieDisponibili === 0,
                })}
                error={errors.libro}
              />
            )}
          />
        </div>

        <FormField id="prestito-durata" label="Durata" className="max-w-56">
          {(aria) => (
            <Controller
              control={form.control}
              name="durata"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger {...aria} className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DURATE_PRESTITO.map((d) => (
                      <SelectItem key={d.value} value={d.value}>
                        {etichettaDurata(d.value)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          )}
        </FormField>
      </FormDialog>
    </>
  )
}
