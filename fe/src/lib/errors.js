import { toast } from 'sonner'
import { ApiError } from '@/lib/api'

/**
 * Mostra un errore API all'utente.
 * Se è passato un form di react-hook-form, gli errori per campo del BE (400) finiscono sotto ai rispettivi input.
 * @param {unknown} err
 * @param {import('react-hook-form').UseFormReturn} [form]
 */
export function gestisciErrore(err, form) {
  if (!(err instanceof ApiError)) {
    toast.error('Impossibile contattare il server. Riprova tra poco.')
    return
  }
  if (form) {
    for (const [campo, messaggio] of Object.entries(err.fieldErrors)) {
      form.setError(campo, { message: messaggio })
    }
  }
  // Il 401 è già gestito da AuthProvider (sessione chiusa + avviso)
  if (err.status !== 401) toast.error(err.message)
}

/** Testo leggibile per gli errori mostrati inline (es. nelle query). */
export function messaggioErrore(err) {
  if (err instanceof ApiError) return err.message
  return 'Impossibile contattare il server.'
}
