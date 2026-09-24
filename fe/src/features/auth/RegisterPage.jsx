import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link, Navigate } from 'react-router'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { FormField } from '@/components/FormField'
import { useAuth } from '@/lib/auth-context'
import { register as registra } from '@/lib/endpoints'
import { gestisciErrore } from '@/lib/errors'
import { AuthShell } from './AuthShell'

const obbligatorio = (campo) => z.string().trim().min(1, `Inserisci ${campo}.`)

// Stesse regole di RegisterRequest lato BE (password 8-72, data di nascita nel passato)
const schema = z.object({
  nome: obbligatorio('il nome'),
  cognome: obbligatorio('il cognome'),
  email: z.email('Inserisci un indirizzo email valido.'),
  password: z.string().min(8, 'Almeno 8 caratteri.').max(72, 'Al massimo 72 caratteri.'),
  dataDiNascita: z.iso.date('Inserisci la data di nascita.').refine((d) => new Date(d) < new Date(), {
    message: 'La data deve essere nel passato.',
  }),
  indirizzo: obbligatorio("l'indirizzo"),
})

const VUOTO = { nome: '', cognome: '', email: '', password: '', dataDiNascita: '', indirizzo: '' }

export function RegisterPage() {
  const { user, login } = useAuth()
  const form = useForm({ resolver: zodResolver(schema), defaultValues: VUOTO })
  const { errors, isSubmitting } = form.formState

  if (user) return <Navigate to="/" replace />

  const onSubmit = async (dati) => {
    try {
      await registra(dati)
      // Registrazione riuscita: accesso diretto senza chiedere di nuovo le credenziali
      await login(dati.email, dati.password)
      // Dopo il login user è valorizzato e il <Navigate> in cima porta al catalogo
      toast.success(`Benvenuto, ${dati.nome}! La tua tessera è attiva.`)
    } catch (err) {
      gestisciErrore(err, form)
    }
  }

  // Helper: evita di ripetere id, errore e register per ogni campo
  const campo = (nome, label, props = {}) => (
    <FormField id={nome} label={label} error={errors[nome]} {...props} {...form.register(nome)} />
  )

  return (
    <AuthShell titolo="Richiedi la tessera" sottotitolo="Registrati per prendere in prestito i libri.">
      <form noValidate onSubmit={form.handleSubmit(onSubmit)} className="grid gap-5 sm:grid-cols-2">
        {campo('nome', 'Nome', { autoComplete: 'given-name' })}
        {campo('cognome', 'Cognome', { autoComplete: 'family-name' })}
        {campo('email', 'Email', { type: 'email', autoComplete: 'email', className: 'sm:col-span-2' })}
        {campo('password', 'Password', {
          type: 'password',
          autoComplete: 'new-password',
          hint: 'Da 8 a 72 caratteri.',
        })}
        {campo('dataDiNascita', 'Data di nascita', { type: 'date', autoComplete: 'bday' })}
        {campo('indirizzo', 'Indirizzo', { autoComplete: 'street-address', className: 'sm:col-span-2' })}
        <Button type="submit" size="lg" disabled={isSubmitting} className="sm:col-span-2">
          {isSubmitting && 'Registrazione in corso…'}
          {!isSubmitting && 'Registrati'}
        </Button>
        <p className="text-sm text-muted-foreground sm:col-span-2">
          Hai già una tessera?{' '}
          <Link to="/accedi" className="text-primary underline underline-offset-4">
            Accedi
          </Link>
        </p>
      </form>
    </AuthShell>
  )
}
