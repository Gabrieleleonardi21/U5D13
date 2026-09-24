import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

/**
 * Etichetta + controllo + messaggio d'errore, collegati per gli screen reader
 * (htmlFor, aria-invalid, aria-describedby).
 * Senza children rende un <Input>; con children passa loro gli attributi aria tramite render prop.
 * @param {{ id: string, label: string, error?: { message?: string }, hint?: string, className?: string,
 *           children?: (aria: object) => import('react').ReactNode } & object} props
 */
export function FormField({ id, label, error, hint, className, children, ...inputProps }) {
  const errorId = `${id}-errore`
  const hintId = `${id}-suggerimento`
  const descritto = [hint && hintId, error && errorId].filter(Boolean).join(' ') || undefined
  const aria = { id, 'aria-invalid': Boolean(error), 'aria-describedby': descritto }

  let controllo = <Input {...aria} {...inputProps} />
  if (children) controllo = children(aria)

  return (
    <div className={cn('grid gap-1.5', className)}>
      <Label htmlFor={id}>{label}</Label>
      {controllo}
      {hint && (
        <p id={hintId} className="text-xs text-muted-foreground">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} role="alert" className="text-xs text-destructive">
          {error.message}
        </p>
      )}
    </div>
  )
}
