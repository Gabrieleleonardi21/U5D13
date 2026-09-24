import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link, Navigate, useLocation } from 'react-router'
import { Button } from '@/components/ui/button'
import { FormField } from '@/components/FormField'
import { useAuth } from '@/lib/auth-context'
import { gestisciErrore } from '@/lib/errors'
import { AuthShell } from './AuthShell'

// Stesse regole di LoginRequest lato BE
const schema = z.object({
  email: z.email('Inserisci un indirizzo email valido.'),
  password: z.string().min(1, 'Inserisci la password.'),
})

export function LoginPage() {
  const { user, login } = useAuth()
  const location = useLocation()
  const form = useForm({ resolver: zodResolver(schema), defaultValues: { email: '', password: '' } })
  const { errors, isSubmitting } = form.formState

  // Autenticato (anche subito dopo il login): si torna alla pagina richiesta o al catalogo
  if (user) return <Navigate to={location.state?.da ?? '/'} replace />

  const onSubmit = async ({ email, password }) => {
    try {
      // Al termine user è valorizzato e il <Navigate> qui sopra fa il redirect
      await login(email, password)
    } catch (err) {
      gestisciErrore(err)
    }
  }

  return (
    <AuthShell titolo="Bentornato" sottotitolo="Accedi per vedere i tuoi prestiti.">
      <form noValidate onSubmit={form.handleSubmit(onSubmit)} className="grid gap-5">
        <FormField id="email" label="Email" type="email" autoComplete="email" error={errors.email} {...form.register('email')} />
        <FormField
          id="password"
          label="Password"
          type="password"
          autoComplete="current-password"
          error={errors.password}
          {...form.register('password')}
        />
        <Button type="submit" size="lg" disabled={isSubmitting}>
          {isSubmitting && 'Accesso in corso…'}
          {!isSubmitting && 'Accedi'}
        </Button>
        <p className="text-sm text-muted-foreground">
          Non hai una tessera?{' '}
          <Link to="/registrati" className="text-primary underline underline-offset-4">
            Registrati
          </Link>
        </p>
      </form>
    </AuthShell>
  )
}
