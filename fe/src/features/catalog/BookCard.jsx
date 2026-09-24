import { Badge } from '@/components/ui/badge'
import { BookCover } from '@/components/BookCover'
import { formatEuro } from '@/lib/format'
import { ListaButton } from './ListaButton'

/** Scheda di un libro nel catalogo (LibroResponse del BE). */
export function BookCard({ libro }) {
  const disponibile = libro.copieDisponibili > 0
  const dettagli = [libro.casaEditrice, libro.annoDiUscita, libro.edizione].filter(Boolean).join(' · ')

  return (
    <article className="group flex h-full flex-col">
      <div className="transition-transform duration-300 group-hover:-translate-y-1 motion-reduce:transition-none">
        <BookCover libro={libro} />
      </div>
      <div className="mt-3 flex flex-1 flex-col gap-1">
        <p className="text-[0.65rem] tracking-[0.18em] text-muted-foreground uppercase">{libro.genere}</p>
        <h3 className="text-base leading-snug font-semibold line-clamp-2">{libro.titolo}</h3>
        <p className="text-sm italic">{libro.autore}</p>
        <p className="text-xs text-muted-foreground">{dettagli}</p>
        <div className="mt-auto flex items-center justify-between gap-2 pt-2">
          {disponibile && (
            <Badge variant="secondary" className="text-success">
              {libro.copieDisponibili} di {libro.copieTotali} disponibili
            </Badge>
          )}
          {!disponibile && <Badge variant="destructive">Tutte in prestito</Badge>}
          <span className="text-sm tabular-nums">{formatEuro(libro.prezzo)}</span>
        </div>
        <div className="pt-2">
          <ListaButton libro={libro} />
        </div>
      </div>
    </article>
  )
}
