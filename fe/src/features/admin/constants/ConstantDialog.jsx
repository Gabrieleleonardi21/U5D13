import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { FormDialog } from '@/components/FormDialog'
import { FormField } from '@/components/FormField'
import { useAzione } from '@/hooks/useAzione'
import { createConstant, editConstant } from '@/lib/endpoints'
import { COSTANTI_SISTEMA } from './costantiSistema'

const schema = z.object({
  chiave: z.string().trim().min(1, 'Inserisci la chiave.').max(255, 'Al massimo 255 caratteri.'),
  valore: z.string().max(255, 'Al massimo 255 caratteri.'),
})

/**
 * Crea (costante === 'nuova') o modifica una costante. null = chiusa.
 * Le costanti di sistema non si possono rinominare: il campo chiave resta bloccato.
 * @param {{ costante: object | 'nuova' | null, onClose: () => void }} props
 */
export function ConstantDialog({ costante, onClose }) {
  const nuova = costante === 'nuova'
  const esistente = costante && !nuova
  const sistema = esistente && COSTANTI_SISTEMA[costante.chiave]
  const form = useForm({ resolver: zodResolver(schema), defaultValues: { chiave: '', valore: '' } })

  // Ad ogni apertura il form riparte dai valori della costante scelta
  useEffect(() => {
    if (esistente) form.reset({ chiave: costante.chiave, valore: costante.valore })
    if (nuova) form.reset({ chiave: '', valore: '' })
  }, [costante]) // eslint-disable-line react-hooks/exhaustive-deps -- form è stabile

  const opzioni = { form, invalida: ['constants'], onSuccess: onClose }
  const crea = useAzione(createConstant, { ...opzioni, successo: (c) => `Costante "${c.chiave}" creata.` })
  const modifica = useAzione(editConstant, { ...opzioni, successo: (c) => `Costante "${c.chiave}" aggiornata.` })

  const onSubmit = form.handleSubmit((d) => {
    if (nuova) crea.mutate(d)
    else modifica.mutate({ id: costante.id, ...d })
  })

  let titolo = 'Modifica costante'
  if (nuova) titolo = 'Nuova costante'

  return (
    <FormDialog
      open={Boolean(costante)}
      onOpenChange={(aperta) => !aperta && onClose()}
      titolo={titolo}
      descrizione={sistema && sistema.regola}
      onSubmit={onSubmit}
      conferma="Salva"
      inCorso={crea.isPending || modifica.isPending}
    >
      <FormField
        id="costante-chiave"
        label="Chiave"
        readOnly={Boolean(sistema)}
        hint={sistema && 'Costante di sistema: la chiave non si può rinominare.'}
        error={form.formState.errors.chiave}
        {...form.register('chiave')}
      />
      <FormField id="costante-valore" label="Valore" error={form.formState.errors.valore} {...form.register('valore')} />
    </FormDialog>
  )
}
