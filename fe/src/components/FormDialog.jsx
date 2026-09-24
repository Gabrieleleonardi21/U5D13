import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'

/**
 * Modale con un form: titolo, campi, pulsanti Annulla/Conferma.
 * Radix gestisce focus trap, chiusura con Esc e ritorno del focus al pulsante che l'ha aperta.
 * @param {{ open: boolean, onOpenChange: (open: boolean) => void, titolo: string, descrizione?: string,
 *           onSubmit: (e: import('react').FormEvent) => void, conferma: string, inCorso?: boolean,
 *           larga?: boolean, children: import('react').ReactNode }} props
 */
export function FormDialog({ open, onOpenChange, titolo, descrizione, onSubmit, conferma, inCorso, larga, children }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={cn(larga && 'sm:max-w-2xl')}>
        <DialogHeader>
          <DialogTitle className="font-heading text-xl">{titolo}</DialogTitle>
          {descrizione && <DialogDescription>{descrizione}</DialogDescription>}
        </DialogHeader>
        <form noValidate onSubmit={onSubmit} className="grid gap-4">
          {children}
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Annulla
              </Button>
            </DialogClose>
            <Button type="submit" disabled={inCorso}>
              {conferma}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
