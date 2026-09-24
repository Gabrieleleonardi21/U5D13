import { useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useQuery } from '@tanstack/react-query'
import { z } from 'zod'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { FormDialog } from '@/components/FormDialog'
import { FormField } from '@/components/FormField'
import { useAzione } from '@/hooks/useAzione'
import { createBook, getGenres } from '@/lib/endpoints'

const annoCorrente = new Date().getFullYear()
const testo = (campo) => z.string().trim().min(1, `Inserisci ${campo}.`)

// Stesse regole di NuovoLibroRequest lato BE
const schema = z.object({
  isbn: z.string().regex(/^\d{1,13}$/, 'Solo cifre, al massimo 13.'),
  titolo: testo('il titolo'),
  autore: testo("l'autore"),
  casaEditrice: testo('la casa editrice'),
  edizione: z.string().trim(),
  prezzo: z.coerce
    .number('Inserisci il prezzo.')
    .min(0, 'Non può essere negativo.')
    .max(99.99, 'Al massimo 99,99 €.')
    .multipleOf(0.01, 'Al massimo due decimali.'),
  annoDiUscita: z.coerce
    .number('Inserisci l’anno.')
    .int('Anno non valido.')
    .min(1450, 'Non prima del 1450.')
    .max(annoCorrente, 'Non può essere nel futuro.'),
  copie: z.coerce.number('Inserisci le copie.').int('Numero intero.').min(1, 'Almeno una copia.'),
  copertinaRigida: z.boolean(),
  genereId: z.string().min(1, 'Scegli un genere.'),
  path: z.union([z.literal(''), z.url({ protocol: /^https?$/, error: 'URL http(s) non valido.' })]),
})

const VUOTO = {
  isbn: '',
  titolo: '',
  autore: '',
  casaEditrice: '',
  edizione: '',
  prezzo: '',
  annoDiUscita: '',
  copie: '1',
  copertinaRigida: false,
  genereId: '',
  path: '',
}

export function NewBookDialog() {
  const [open, setOpen] = useState(false)
  const form = useForm({ resolver: zodResolver(schema), defaultValues: VUOTO })
  const { errors } = form.formState
  const generi = useQuery({ queryKey: ['genres'], queryFn: getGenres })

  const crea = useAzione(createBook, {
    form,
    invalida: ['books'],
    // Stesso ISBN già presente: il BE somma le copie e lo dice nel messaggio
    successo: (res) => res.messaggio,
    onSuccess: () => {
      form.reset(VUOTO)
      setOpen(false)
    },
  })

  const onSubmit = form.handleSubmit((d) =>
    crea.mutate({
      ...d,
      isbn: Number(d.isbn),
      edizione: d.edizione || null,
      path: d.path || null,
    }),
  )

  const campo = (nome, label, props = {}) => (
    <FormField id={`libro-${nome}`} label={label} error={errors[nome]} {...props} {...form.register(nome)} />
  )

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus aria-hidden="true" />
        Nuovo libro
      </Button>
      <FormDialog
        open={open}
        onOpenChange={setOpen}
        titolo="Nuovo libro"
        descrizione="Se l'ISBN esiste già, le copie vengono aggiunte a quel libro."
        onSubmit={onSubmit}
        conferma="Salva libro"
        inCorso={crea.isPending}
        larga
      >
        <div className="grid gap-4 sm:grid-cols-2">
          {campo('titolo', 'Titolo', { className: 'sm:col-span-2' })}
          {campo('autore', 'Autore')}
          {campo('casaEditrice', 'Casa editrice')}
          {campo('isbn', 'ISBN', { inputMode: 'numeric' })}
          {campo('edizione', 'Edizione (facoltativa)')}
          {campo('annoDiUscita', 'Anno di uscita', { type: 'number', inputMode: 'numeric' })}
          {campo('prezzo', 'Prezzo (€)', { type: 'number', step: '0.01', inputMode: 'decimal' })}
          {campo('copie', 'Copie', { type: 'number', min: 1, inputMode: 'numeric' })}

          <FormField id="libro-genereId" label="Genere" error={errors.genereId}>
            {(aria) => (
              <Controller
                control={form.control}
                name="genereId"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger {...aria} className="w-full">
                      <SelectValue placeholder="Scegli un genere" />
                    </SelectTrigger>
                    <SelectContent>
                      {generi.data?.map((g) => (
                        <SelectItem key={g.id} value={g.id}>
                          {g.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            )}
          </FormField>

          {campo('path', 'URL copertina (facoltativo)', {
            type: 'url',
            className: 'sm:col-span-2',
            hint: 'Se manca, la copertina si cerca su Open Library tramite ISBN.',
          })}

          <Controller
            control={form.control}
            name="copertinaRigida"
            render={({ field }) => (
              <div className="flex items-center gap-2 sm:col-span-2">
                <Checkbox id="libro-rigida" checked={field.value} onCheckedChange={(v) => field.onChange(v === true)} />
                <Label htmlFor="libro-rigida">Copertina rigida</Label>
              </div>
            )}
          />
        </div>
      </FormDialog>
    </>
  )
}
