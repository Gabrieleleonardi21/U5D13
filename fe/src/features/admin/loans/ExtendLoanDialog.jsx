import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { FormDialog } from '@/components/FormDialog'
import { FormField } from '@/components/FormField'
import { useAzione } from '@/hooks/useAzione'
import { extendLoan } from '@/lib/endpoints'
import { formatData } from '@/lib/format'

// Stesse regole di EstendiPrestitoRequest: da 1 a 365 giorni
const schema = z.object({
  giorni: z.coerce.number('Inserisci i giorni.').int('Numero intero.').min(1, 'Almeno 1 giorno.').max(365, 'Al massimo 365 giorni.'),
})

/**
 * Proroga di un prestito (consentita una sola volta dal BE).
 * @param {{ prestito: object | null, onClose: () => void }} props
 */
export function ExtendLoanDialog({ prestito, onClose }) {
  const form = useForm({ resolver: zodResolver(schema), defaultValues: { giorni: '7' } })

  const estendi = useAzione(({ id, giorni }) => extendLoan(id, giorni), {
    form,
    invalida: ['loans'],
    successo: (p) => `Nuova scadenza: ${formatData(p.dataRiconsegnaPrevista)}.`,
    onSuccess: () => {
      form.reset()
      onClose()
    },
  })

  return (
    <FormDialog
      open={Boolean(prestito)}
      onOpenChange={(aperta) => !aperta && onClose()}
      titolo="Proroga prestito"
      descrizione={
        prestito &&
        `"${prestito.libro.titolo}" — scadenza attuale ${formatData(prestito.dataRiconsegnaPrevista)}. Si può prorogare una sola volta.`
      }
      onSubmit={form.handleSubmit((d) => estendi.mutate({ id: prestito.id, giorni: d.giorni }))}
      conferma="Proroga"
      inCorso={estendi.isPending}
    >
      <FormField
        id="proroga-giorni"
        label="Giorni in più"
        type="number"
        min={1}
        max={365}
        inputMode="numeric"
        error={form.formState.errors.giorni}
        {...form.register('giorni')}
      />
    </FormDialog>
  )
}
