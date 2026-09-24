import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Tag } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { FormDialog } from '@/components/FormDialog'
import { FormField } from '@/components/FormField'
import { useAzione } from '@/hooks/useAzione'
import { createGenre } from '@/lib/endpoints'

const schema = z.object({
  nome: z.string().trim().min(1, 'Inserisci il nome.').max(100, 'Al massimo 100 caratteri.'),
})

export function NewGenreDialog() {
  const [open, setOpen] = useState(false)
  const form = useForm({ resolver: zodResolver(schema), defaultValues: { nome: '' } })

  const crea = useAzione(createGenre, {
    form,
    invalida: ['genres'],
    successo: (g) => `Genere "${g.nome}" creato.`,
    onSuccess: () => {
      form.reset()
      setOpen(false)
    },
  })

  return (
    <>
      <Button variant="outline" onClick={() => setOpen(true)}>
        <Tag aria-hidden="true" />
        Nuovo genere
      </Button>
      <FormDialog
        open={open}
        onOpenChange={setOpen}
        titolo="Nuovo genere"
        descrizione="I generi sono unici, senza distinzione tra maiuscole e minuscole."
        onSubmit={form.handleSubmit((d) => crea.mutate(d.nome))}
        conferma="Crea genere"
        inCorso={crea.isPending}
      >
        <FormField id="genere-nome" label="Nome" error={form.formState.errors.nome} {...form.register('nome')} />
      </FormDialog>
    </>
  )
}
