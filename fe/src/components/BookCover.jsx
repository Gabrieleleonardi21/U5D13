import { useState } from 'react'
import { cn } from '@/lib/utils'

// Tinte "da rilegatura" per le copertine generate, scelte in modo stabile dal titolo
const TINTE = [
  'oklch(0.38 0.1 32)', // cuoio rosso
  'oklch(0.34 0.06 150)', // verde bottiglia
  'oklch(0.32 0.07 255)', // blu notte
  'oklch(0.42 0.08 65)', // ocra bruciata
  'oklch(0.3 0.03 50)', // marrone scuro
  'oklch(0.36 0.08 350)', // prugna
]

function hash(testo) {
  let h = 0
  for (const c of testo) h = (h * 31 + c.charCodeAt(0)) | 0
  return Math.abs(h)
}

// Solo URL http(s): un path arbitrario dal DB (es. "javascript:") non deve finire in src
function urlSicuro(path) {
  if (!path) return null
  try {
    const url = new URL(path)
    if (url.protocol === 'http:' || url.protocol === 'https:') return url.href
  } catch {
    // path non valido: si usa la copertina di Open Library o quella generata
  }
  return null
}

function sorgenteCopertina(libro) {
  const custom = urlSicuro(libro.path)
  if (custom) return custom
  // default=false: Open Library risponde 404 se non ha la copertina, così scatta il fallback
  return `https://covers.openlibrary.org/b/isbn/${libro.isbn}-M.jpg?default=false`
}

/**
 * Copertina del libro: path del BE, poi Open Library per ISBN, altrimenti una copertina tipografica generata.
 * @param {{ libro: { titolo: string, autore: string, isbn: number, path?: string }, className?: string,
 *           miniatura?: boolean }} props miniatura: solo colore e dorso, senza testo (per le liste)
 */
export function BookCover({ libro, className, miniatura = false }) {
  // 'caricamento' | 'caricata' | 'assente': la copertina generata resta visibile finché l'immagine non è pronta
  const [immagine, setImmagine] = useState('caricamento')

  return (
    <div
      style={{ backgroundColor: TINTE[hash(libro.titolo) % TINTE.length] }}
      className={cn(
        'relative aspect-[2/3] w-full overflow-hidden rounded-sm shadow-[2px_3px_10px_rgba(60,35,15,0.25)]',
        className,
      )}
    >
      {/* Copertina generata, subito visibile: il testo è già nella card, quindi è decorativa */}
      <div aria-hidden="true" className="flex size-full flex-col justify-between p-3 text-[oklch(0.93_0.03_85)]">
        {/* Nervatura del dorso */}
        <span className="absolute inset-y-0 left-2 w-px bg-white/15" />
        {/* In miniatura il testo non entrerebbe: resta solo la "rilegatura" colorata */}
        {!miniatura && (
          <>
            <span className="font-heading text-sm leading-tight font-semibold line-clamp-4">{libro.titolo}</span>
            <span className="text-[0.65rem] tracking-wide uppercase opacity-80 line-clamp-2">{libro.autore}</span>
          </>
        )}
      </div>

      {/* Copertina vera sovrapposta: compare in dissolvenza solo a caricamento completato */}
      {immagine !== 'assente' && (
        <img
          src={sorgenteCopertina(libro)}
          alt={`Copertina di ${libro.titolo}`}
          loading="lazy"
          width={200}
          height={300}
          onLoad={() => setImmagine('caricata')}
          onError={() => setImmagine('assente')}
          className={cn(
            'absolute inset-0 size-full object-cover opacity-0 transition-opacity duration-500 motion-reduce:transition-none',
            immagine === 'caricata' && 'opacity-100',
          )}
        />
      )}
    </div>
  )
}
