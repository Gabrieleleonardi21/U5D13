import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { FormDialog } from '@/components/FormDialog'
import { FormField } from '@/components/FormField'
import { useAzione } from '@/hooks/useAzione'
import { createRole } from '@/lib/endpoints'

const schema = z.object({
  ruolo: z.string().trim().min(1, 'Inserisci il nome del ruolo.').max(50, 'Al massimo 50 caratteri.'),
})

export function NewRoleDialog() {
  const [open, setOpen] = useState(false)
  const form = useForm({ resolver: zodResolver(schema), defaultValues: { ruolo: '' } })

  const crea = useAzione(createRole, {
    form,
    successo: (_, nome) => `Ruolo "${nome}" creato.`,
    onSuccess: () => {
      form.reset()
      setOpen(false)
    },
  })

  return (
    <>
      <Button variant="outline" onClick={() => setOpen(true)}>
        <Plus aria-hidden="true" />
        Nuovo ruolo
      </Button>
      <FormDialog
        open={open}
        onOpenChange={setOpen}
        titolo="Nuovo ruolo"
        descrizione="Per ora i nuovi ruoli vengono solo registrati: i permessi del backend riguardano User, Admin e SuperUser."
        onSubmit={form.handleSubmit((d) => crea.mutate(d.ruolo))}
        conferma="Crea ruolo"
        inCorso={crea.isPending}
      >
        <FormField id="ruolo-nome" label="Nome" error={form.formState.errors.ruolo} {...form.register('ruolo')} />
      </FormDialog>
    </>
  )
}
