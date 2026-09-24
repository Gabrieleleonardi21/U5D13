import { Link } from 'react-router'
import { BookmarkCheck, BookmarkPlus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/lib/auth-context'
import { useLista } from '@/lib/lista-context'

/** Aggiunge o toglie un libro dalla lista dei libri da chiedere in prestito. */
export function ListaButton({ libro }) {
  const { user } = useAuth()
  const lista = useLista()

  // Da anonimi si invita ad accedere, tornando poi al catalogo
  if (!user) {
    return (
      <Button variant="link" size="sm" asChild className="h-auto px-0">
        <Link to="/accedi">Accedi per prenotarlo</Link>
      </Button>
    )
  }

  if (lista.contiene(libro.id)) {
    return (
      <Button variant="secondary" size="sm" aria-pressed="true" onClick={() => lista.rimuovi(libro.id)}>
        <BookmarkCheck aria-hidden="true" />
        Nella lista
        <span className="sr-only">: togli {libro.titolo}</span>
      </Button>
    )
  }

  // Senza copie non si può richiedere (il BE risponderebbe 409)
  if (libro.copieDisponibili === 0) return null

  return (
    <Button variant="outline" size="sm" onClick={() => lista.aggiungi(libro)}>
      <BookmarkPlus aria-hidden="true" />
      Aggiungi alla lista
      <span className="sr-only">: {libro.titolo}</span>
    </Button>
  )
}
