import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { gestisciErrore } from '@/lib/errors'

/**
 * Mutation con i comportamenti standard dell'app: toast di successo, errori mostrati
 * (anche per campo se si passa il form) e cache invalidata per le query indicate.
 * @param {(variabili: any) => Promise<any>} fn chiamata API
 * @param {{ invalida?: string[], successo?: string | ((dati: any, variabili: any) => string),
 *           form?: import('react-hook-form').UseFormReturn, onSuccess?: (dati: any) => void }} opzioni
 */
export function useAzione(fn, { invalida = [], successo, form, onSuccess } = {}) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: fn,
    onSuccess: (dati, variabili) => {
      for (const chiave of invalida) queryClient.invalidateQueries({ queryKey: [chiave] })
      if (typeof successo === 'function') toast.success(successo(dati, variabili))
      else if (successo) toast.success(successo)
      onSuccess?.(dati, variabili)
    },
    onError: (err) => gestisciErrore(err, form),
  })
}
