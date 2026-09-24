import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { FormDialog } from '@/components/FormDialog'
import { FormField } from '@/components/FormField'
import { useAzione } from '@/hooks/useAzione'
import { addCopies } from '@/lib/endpoints'

const schema = z.object({
  copie: z.coerce.number('Inserisci un numero.').int('Numero intero.').min(1, 'Almeno una copia.'),
})

/**
 * Aggiunge copie a un libro esistente. Aperta dalla tabella: libro === null significa chiusa.
 * @param {{ libro: object | null, onClose: () => void }} props
 */
export function AddCopiesDialog({ libro, onClose }) {
  const form = useForm({ resolver: zodResolver(schema), defaultValues: { copie: '1' } })

  const aggiungi = useAzione(({ id, copie }) => addCopies(id, copie), {
    form,
    invalida: ['books'],
    successo: (res) => res.messaggio,
    onSuccess: () => {
      form.reset()
      onClose()
    },
  })

  return (
    <FormDialog
      open={Boolean(libro)}
      onOpenChange={(aperta) => !aperta && onClose()}
      titolo="Aggiungi copie"
      descrizione={libro && `${libro.titolo} — oggi ${libro.copieTotali} copie totali.`}
      onSubmit={form.handleSubmit((d) => aggiungi.mutate({ id: libro.id, copie: d.copie }))}
      conferma="Aggiungi"
      inCorso={aggiungi.isPending}
    >
      <FormField
        id="copie-da-aggiungere"
        label="Copie da aggiungere"
        type="number"
        min={1}
        inputMode="numeric"
        error={form.formState.errors.copie}
        {...form.register('copie')}
      />
    </FormDialog>
  )
}
