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

/**
 * Conferma per azioni irreversibili (al posto di window.confirm, che blocca la pagina).
 * @param {{ open: boolean, onOpenChange: (open: boolean) => void, titolo: string, descrizione: string,
 *           conferma: string, onConfirm: () => void, inCorso?: boolean, distruttiva?: boolean,
 *           esci?: string }} props esci: etichetta del pulsante che chiude senza fare nulla
 */
export function ConfirmDialog({ open, onOpenChange, titolo, descrizione, conferma, onConfirm, inCorso, distruttiva, esci = 'Annulla' }) {
  let variante = 'default'
  if (distruttiva) variante = 'destructive'
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="font-heading text-xl">{titolo}</DialogTitle>
          <DialogDescription>{descrizione}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">{esci}</Button>
          </DialogClose>
          <Button variant={variante} disabled={inCorso} onClick={onConfirm}>
            {conferma}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
