import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

/**
 * Navigazione tra le pagine di un PageResponse del BE (page parte da 0).
 * @param {{ page: number, totalPages: number, onChange: (page: number) => void }} props
 */
export function Pagination({ page, totalPages, onChange }) {
  if (totalPages <= 1) return null
  return (
    <nav aria-label="Paginazione" className="flex items-center justify-center gap-3 pt-6">
      <Button variant="outline" size="sm" disabled={page === 0} onClick={() => onChange(page - 1)}>
        <ChevronLeft aria-hidden="true" />
        Precedente
      </Button>
      <span className="text-sm text-muted-foreground tabular-nums">
        Pagina {page + 1} di {totalPages}
      </span>
      <Button variant="outline" size="sm" disabled={page >= totalPages - 1} onClick={() => onChange(page + 1)}>
        Successiva
        <ChevronRight aria-hidden="true" />
      </Button>
    </nav>
  )
}
